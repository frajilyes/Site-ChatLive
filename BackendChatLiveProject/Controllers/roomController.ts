import mongoose, { type QueryFilter, type PipelineStage, type Types } from "mongoose";

import Message from "../Models/message";
import Room, { type IRoom, type RoomDocument } from "../Models/room";
import User, { type UserDocument } from "../Models/userAuth";
import ApiError from "../Utils/ApiError";
import asyncHandler from "../Utils/asyncHandler";
import { requireUser } from "../Utils/currentUser";
import { type Ref, idOf, sameId } from "../Utils/ids";
import { chatRoom, chatUser } from "../Utils/presenters";
import { param } from "../Utils/params";
import { MEMBER_ROLES, isMemberRole } from "../Utils/roles";
import {
  closeRoomChannel,
  emitToRoom,
  joinUserToRoom,
  removeUserFromRoom,
} from "../config/realtime";

function toObjectId(value: Ref): Types.ObjectId {
  return new mongoose.Types.ObjectId(idOf(value));
}

async function unreadByRoom(
  rooms: readonly RoomDocument[],
  userId: Ref,
): Promise<Map<string, number>> {
  const conditions: PipelineStage.Match["$match"][] = [];
  for (const room of rooms) {
    const membership = room.members.find((member) => sameId(member.user, userId));
    if (membership) {
      conditions.push({ room: room._id, createdAt: { $gt: membership.lastReadAt } });
    }
  }
  if (conditions.length === 0) return new Map();

  const rows = await Message.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { $or: conditions, author: { $ne: toObjectId(userId) } } },
    { $group: { _id: "$room", count: { $sum: 1 } } },
  ]);

  return new Map(rows.map((row) => [idOf(row._id), row.count]));
}

export async function loadRoom(
  roomId: string,
  user: UserDocument,
  { mustBeMember = true }: { mustBeMember?: boolean } = {},
): Promise<RoomDocument> {
  const room = await Room.findById(roomId);
  if (!room) {
    throw ApiError.notFound("This room does not exist.");
  }

  const isMember = room.hasMember(user._id);
  const isAdmin = user.role === "admin";

  if (mustBeMember && !isMember && !isAdmin) {
    throw ApiError.forbidden("You are not a member of this room.");
  }
  if (!mustBeMember && room.visibility === "private" && !isMember && !isAdmin) {
    throw ApiError.forbidden("This room is private.");
  }

  return room;
}

function assertIsOwner(room: RoomDocument, user: UserDocument): void {
  if (user.role === "admin") return;
  if (!sameId(room.owner, user._id)) {
    throw ApiError.forbidden("Only the room owner can do that.");
  }
}

function assertCanModerate(room: RoomDocument, user: UserDocument): void {
  if (user.role === "admin") return;
  const membership = room.members.find((member) => sameId(member.user, user._id));
  if (!membership || !["owner", "moderator"].includes(membership.role)) {
    throw ApiError.forbidden("You do not have moderation rights in this room.");
  }
}

export const getMyRooms = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const rooms = await Room.find({ "members.user": user._id }).sort({ lastMessageAt: -1 });
  const unread = await unreadByRoom(rooms, user._id);

  res.status(200).json({
    total: rooms.length,
    data: rooms.map((room) => chatRoom(room, unread.get(idOf(room._id)) ?? 0)),
  });
});

export const discoverRooms = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const search = req.query.search;
  const community = req.query.community;

  const query: QueryFilter<IRoom> = {
    visibility: "public",
    "members.user": { $ne: user._id },
  };

  if (community && mongoose.isValidObjectId(String(community))) {
    query.community = new mongoose.Types.ObjectId(String(community));
  }

  if (search) {
    const pattern = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: pattern }, { topic: pattern }];
  }

  const rooms = await Room.find(query).sort({ lastMessageAt: -1 }).limit(50);
  res.status(200).json({ total: rooms.length, data: rooms.map((room) => chatRoom(room, 0)) });
});

export const getRoomById = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const room = await loadRoom(param(req, "id"), user, { mustBeMember: false });
  const unread = await unreadByRoom([room], user._id);

  res.status(200).json({ room: chatRoom(room, unread.get(idOf(room._id)) ?? 0) });
});

export const getRoomMembers = asyncHandler(async (req, res) => {
  const room = await loadRoom(param(req, "id"), requireUser(req), { mustBeMember: false });

  const members = await User.find({
    _id: { $in: room.members.map((member) => member.user) },
  });
  const roles = new Map(room.members.map((member) => [idOf(member.user), member.role]));

  res.status(200).json({
    total: members.length,
    data: members.map((member) => chatUser(member, roles.get(idOf(member._id)) ?? "member")),
  });
});

export const createRoom = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const { name, emoji, topic, visibility, community } = req.body;

  const room = await Room.create({
    name,
    emoji,
    topic,
    visibility: visibility || "public",
    community:
      typeof community === "string" && mongoose.isValidObjectId(community) ? community : null,
    owner: user._id,
    members: [
      { user: user._id, role: "owner", joinedAt: new Date(), lastReadAt: new Date() },
    ],
  });

  res.status(201).json({ message: "Room created", room: chatRoom(room, 0) });
});

export const updateRoom = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const room = await loadRoom(param(req, "id"), user);
  assertCanModerate(room, user);

  const { name, emoji, topic, visibility } = req.body;
  if (name !== undefined) room.name = name;
  if (emoji !== undefined) room.emoji = emoji;
  if (topic !== undefined) room.topic = topic;
  if (visibility !== undefined) room.visibility = visibility;
  await room.save();

  const payload = chatRoom(room, 0);
  emitToRoom(room._id, "room:updated", payload);

  res.status(200).json({ message: "Room updated", room: payload });
});

export const deleteRoom = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const room = await loadRoom(param(req, "id"), user);
  assertIsOwner(room, user);

  await Message.deleteMany({ room: room._id });
  await room.deleteOne();

  emitToRoom(room._id, "room:deleted", { id: idOf(room._id) });
  closeRoomChannel(room._id);

  res.status(200).json({ message: "Room deleted" });
});

export const joinRoom = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const room = await Room.findById(param(req, "id"));
  if (!room) {
    throw ApiError.notFound("This room does not exist.");
  }

  if (room.hasMember(user._id)) {
    return res.status(200).json({ message: "You are already a member", room: chatRoom(room, 0) });
  }
  if (room.visibility === "private") {
    throw ApiError.forbidden("This room is private: ask for an invitation.");
  }

  room.members.push({
    user: user._id,
    role: "member",
    joinedAt: new Date(),
    lastReadAt: new Date(),
  });
  await room.save();

  joinUserToRoom(user._id, room._id);
  emitToRoom(room._id, "room:member-joined", {
    roomId: idOf(room._id),
    member: chatUser(user, "member"),
  });

  res.status(200).json({ message: "Room joined", room: chatRoom(room, 0) });
});

export const leaveRoom = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const room = await loadRoom(param(req, "id"), user);

  if (sameId(room.owner, user._id)) {
    throw ApiError.badRequest(
      "The owner cannot leave their room: transfer it or delete it.",
    );
  }

  room.members = room.members.filter((member) => !sameId(member.user, user._id));
  await room.save();

  emitToRoom(room._id, "room:member-left", {
    roomId: idOf(room._id),
    userId: idOf(user._id),
  });
  removeUserFromRoom(user._id, room._id);

  res.status(200).json({ message: "Room left" });
});

export const addMember = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const room = await loadRoom(param(req, "id"), user);
  assertCanModerate(room, user);

  const invitedId = req.body?.userId;
  if (typeof invitedId !== "string" || !mongoose.isValidObjectId(invitedId)) {
    throw ApiError.badRequest("This identifier is not valid.", "userId");
  }
  const invited = await User.findById(invitedId);
  if (!invited) {
    throw ApiError.notFound("This member does not exist.", "userId");
  }
  if (room.hasMember(invited._id)) {
    throw ApiError.conflict("This member is already in the room.", "userId");
  }

  room.members.push({
    user: invited._id,
    role: "member",
    joinedAt: new Date(),
    lastReadAt: new Date(),
  });
  await room.save();

  joinUserToRoom(invited._id, room._id);
  emitToRoom(room._id, "room:member-joined", {
    roomId: idOf(room._id),
    member: chatUser(invited, "member"),
  });

  res.status(200).json({ message: "Member added", room: chatRoom(room, 0) });
});

export const setMemberRole = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const room = await loadRoom(param(req, "id"), user);
  assertIsOwner(room, user);

  const { role } = req.body ?? {};
  if (!isMemberRole(role)) {
    throw ApiError.badRequest(
      `Role must be ${MEMBER_ROLES.map((value) => `'${value}'`).join(", ")}.`,
      "role",
    );
  }

  const userId = param(req, "userId");
  const membership = room.members.find((member) => sameId(member.user, userId));
  if (!membership) {
    throw ApiError.notFound("This member is not in the room.", "userId");
  }

  if (sameId(userId, room.owner) && role !== "owner") {
    throw ApiError.badRequest(
      "Hand the room over to someone else first: it needs an owner.",
    );
  }

  if (role === "owner") {
    const previous = room.members.find((member) => sameId(member.user, room.owner));
    if (previous) previous.role = "moderator";
    room.owner = membership.user;
  }

  membership.role = role;
  await room.save();

  const payload = chatRoom(room, 0);
  emitToRoom(room._id, "room:updated", payload);

  res.status(200).json({
    message: role === "owner" ? "Room transferred" : "Role updated",
    room: payload,
  });
});

export const removeMember = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const room = await loadRoom(param(req, "id"), user);
  assertCanModerate(room, user);

  const userId = param(req, "userId");
  if (sameId(userId, room.owner)) {
    throw ApiError.badRequest("The room owner cannot be removed from it.");
  }
  const target = room.members.find((member) => sameId(member.user, userId));
  if (
    target?.role === "moderator" &&
    user.role !== "admin" &&
    !sameId(room.owner, user._id)
  ) {
    throw ApiError.forbidden("Only the owner can remove a moderator.");
  }

  const before = room.members.length;
  room.members = room.members.filter((member) => !sameId(member.user, userId));
  if (room.members.length === before) {
    throw ApiError.notFound("This member is not in the room.");
  }
  await room.save();

  emitToRoom(room._id, "room:member-left", {
    roomId: idOf(room._id),
    userId: String(userId),
  });
  removeUserFromRoom(userId, room._id);

  res.status(200).json({ message: "Member removed" });
});

export const markRoomRead = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const room = await loadRoom(param(req, "id"), user);

  const membership = room.members.find((member) => sameId(member.user, user._id));
  if (membership) {
    membership.lastReadAt = new Date();
    await room.save();
  }

  res.status(200).json({ message: "Room marked as read", room: chatRoom(room, 0) });
});
