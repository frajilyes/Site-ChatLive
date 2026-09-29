import mongoose, { type QueryFilter } from "mongoose";

import Message, { type IMessage } from "../Models/message";
import Room from "../Models/room";
import ApiError from "../Utils/ApiError";
import asyncHandler from "../Utils/asyncHandler";
import { requireUser } from "../Utils/currentUser";
import { idOf, sameId } from "../Utils/ids";
import { chatMessage } from "../Utils/presenters";
import { param } from "../Utils/params";
import { emitToRoom } from "../config/realtime";
import { loadRoom } from "./roomController";

const AUTHOR_FIELDS = "name initials country flag language presence";

export const getRoomMessages = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const room = await loadRoom(param(req, "roomId"), user, { mustBeMember: false });

  const limit = Math.min(Math.max(Math.trunc(Number(req.query.limit)) || 50, 1), 200);
  const query: QueryFilter<IMessage> = { room: room._id };

  // Messages are ordered on the (createdAt, _id) pair rather than on the date
  // alone: several messages routinely land in the same millisecond, and a
  // date-only cursor would skip every one of them that shares the boundary
  // instant with the last message of the previous page.
  const cursor = String(req.query.before ?? "");
  if (cursor) {
    const boundary = await readCursor(cursor);
    query.$or = [
      { createdAt: { $lt: boundary.createdAt } },
      { createdAt: boundary.createdAt, _id: { $lt: boundary._id } },
    ];
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .populate("author", AUTHOR_FIELDS);

  const ordered = messages.reverse();

  res.status(200).json({
    total: ordered.length,
    nextBefore: ordered.length === limit ? idOf(ordered[0]._id) : null,
    data: ordered.map((message) => chatMessage(message, user.language)),
  });
});

/**
 * Resolves a `before` cursor into the exact point to page back from. The
 * cursor is the id of the oldest message already shown; an ISO date is still
 * accepted so links and clients holding an older cursor keep working.
 */
async function readCursor(
  cursor: string,
): Promise<{ createdAt: Date; _id: mongoose.Types.ObjectId }> {
  if (mongoose.isValidObjectId(cursor)) {
    const boundary = await Message.findById(cursor).select("createdAt").lean();
    if (!boundary) {
      throw ApiError.badRequest("This point in the history no longer exists.", "before");
    }
    return { createdAt: boundary.createdAt, _id: new mongoose.Types.ObjectId(cursor) };
  }

  const date = new Date(cursor);
  if (Number.isNaN(date.getTime())) {
    throw ApiError.badRequest(
      "The 'before' parameter must be a message id or an ISO date.",
      "before",
    );
  }
  // A bare date carries no tiebreaker, so page back from the very start of
  // that instant: the smallest possible id at that date.
  return { createdAt: date, _id: new mongoose.Types.ObjectId("000000000000000000000000") };
}

export const sendMessage = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const room = await loadRoom(param(req, "roomId"), user);

  const message = await Message.create({
    room: room._id,
    author: user._id,
    body: req.body.body,
    language: user.language,
  });

  await Room.updateOne(
    { _id: room._id, "members.user": user._id },
    { $set: { lastMessageAt: message.createdAt, "members.$.lastReadAt": message.createdAt } },
  );

  await message.populate("author", AUTHOR_FIELDS);

  emitToRoom(room._id, "message:new", {
    roomId: idOf(room._id),
    message: chatMessage(message, null),
  });

  res.status(201).json({ message: chatMessage(message, user.language) });
});

export const updateMessage = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const message = await Message.findById(param(req, "id"));
  if (!message) {
    throw ApiError.notFound("This message does not exist.");
  }
  if (!sameId(message.author, user._id)) {
    throw ApiError.forbidden("You can only edit your own messages.");
  }

  message.body = req.body.body;
  message.editedAt = new Date();
  await message.save();
  await message.populate("author", AUTHOR_FIELDS);

  emitToRoom(message.room, "message:updated", {
    roomId: idOf(message.room),
    message: chatMessage(message, null),
  });

  res.status(200).json({ message: chatMessage(message, user.language) });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const message = await Message.findById(param(req, "id"));
  if (!message) {
    throw ApiError.notFound("This message does not exist.");
  }

  if (!sameId(message.author, user._id) && user.role !== "admin") {
    const room = await Room.findById(message.room);
    const membership = room?.members.find((member) => sameId(member.user, user._id));
    if (!membership || !["owner", "moderator"].includes(membership.role)) {
      throw ApiError.forbidden("You can only delete your own messages.");
    }
  }

  await message.deleteOne();

  emitToRoom(message.room, "message:deleted", {
    roomId: idOf(message.room),
    id: idOf(message._id),
  });

  res.status(200).json({ message: "Message deleted" });
});
