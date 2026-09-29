import type { Server as HttpServer } from "node:http";

import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Server, type Socket } from "socket.io";

import Message from "../Models/message";
import Room from "../Models/room";
import User, { type UserDocument } from "../Models/userAuth";
import { isCurrentSession, verifyToken } from "../Utils/generateToken";
import { type Ref, idOf, sameId } from "../Utils/ids";
import { chatMessage, chatUser } from "../Utils/presenters";
import type { Presence } from "../types/index";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
} from "../types/socket";

type RealtimeServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
type RealtimeSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type ServerEvent = keyof ServerToClientEvents;
type PayloadOf<E extends ServerEvent> = Parameters<ServerToClientEvents[E]>[0];

interface Emitter {
  emit<E extends ServerEvent>(event: E, payload: PayloadOf<E>): void;
}

let io: RealtimeServer | null = null;

export const channelOf = (roomId: Ref): string => `room:${idOf(roomId)}`;

const userChannelOf = (userId: Ref): string => `user:${idOf(userId)}`;

function isRoomId(value: unknown): value is string {
  return typeof value === "string" && mongoose.isValidObjectId(value);
}

function throttle(capacity: number, perSecond: number): () => boolean {
  let tokens = capacity;
  let last = Date.now();
  return () => {
    const now = Date.now();
    tokens = Math.min(capacity, tokens + ((now - last) / 1000) * perSecond);
    last = now;
    if (tokens < 1) return false;
    tokens -= 1;
    return true;
  };
}

function safely<A extends unknown[]>(
  name: string,
  handler: (...args: A) => Promise<void> | void,
): (...args: A) => void {
  return (...args: A) => {
    Promise.resolve()
      .then(() => handler(...args))
      .catch((error: unknown) => {
        console.error(`[socket] ${name} :`, error instanceof Error ? error.message : error);
      });
  };
}

export function emitToRoom<E extends ServerEvent>(
  roomId: Ref,
  event: E,
  payload: PayloadOf<E>,
): void {
  if (!io) return;
  (io.to(channelOf(roomId)) as unknown as Emitter).emit(event, payload);
}

export function emitToAll<E extends ServerEvent>(event: E, payload: PayloadOf<E>): void {
  if (!io) return;
  (io as unknown as Emitter).emit(event, payload);
}

export const getIO = (): RealtimeServer | null => io;

export function joinUserToRoom(userId: Ref, roomId: Ref): void {
  io?.in(userChannelOf(userId)).socketsJoin(channelOf(roomId));
}

export function removeUserFromRoom(userId: Ref, roomId: Ref): void {
  io?.in(userChannelOf(userId)).socketsLeave(channelOf(roomId));
}

export function closeRoomChannel(roomId: Ref): void {
  io?.in(channelOf(roomId)).socketsLeave(channelOf(roomId));
}

export function disconnectUser(userId: Ref): void {
  io?.in(userChannelOf(userId)).disconnectSockets(true);
}

/**
 * Clears presence left behind by a previous process. Presence only lives as
 * long as a socket does, and no socket survives a restart, so on boot nobody
 * is connected however the process went down.
 */
export async function resetPresence(): Promise<void> {
  const { modifiedCount } = await User.updateMany(
    { presence: { $ne: "offline" } },
    { $set: { presence: "offline" } },
  );
  if (modifiedCount > 0) {
    console.log(`Presence remise a zero pour ${modifiedCount} compte(s)`);
  }
}

async function setPresence(user: UserDocument, presence: Presence): Promise<void> {
  if (user.presence === presence) return;
  user.presence = presence;
  user.lastSeenAt = new Date();
  await User.updateOne({ _id: user._id }, { $set: { presence, lastSeenAt: user.lastSeenAt } });
  emitToAll("presence:update", { userId: idOf(user._id), presence });
}

async function authenticate(
  socket: RealtimeSocket,
  next: (err?: Error) => void,
): Promise<void> {
  try {
    const raw: unknown = socket.handshake.auth?.token;
    if (typeof raw !== "string" || !raw || raw.length > 2048) {
      return next(new Error("Missing token"));
    }
    const decoded = verifyToken(raw);
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new Error("The account for this token no longer exists"));
    }
    if (!isCurrentSession(decoded, user)) {
      return next(new Error("Session closed"));
    }
    socket.data.user = user;

    const claims = jwt.decode(raw);
    const exp = claims && typeof claims === "object" ? claims.exp : undefined;
    if (typeof exp === "number") {
      const remaining = exp * 1000 - Date.now();
      if (remaining < 2 ** 31 - 1) {
        const timer = setTimeout(() => socket.disconnect(true), Math.max(0, remaining));
        timer.unref();
        socket.once("disconnect", () => clearTimeout(timer));
      }
    }
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
}

async function joinOwnChannels(socket: RealtimeSocket, user: UserDocument): Promise<void> {
  const rooms = await Room.find({ "members.user": user._id }).select("_id").lean();
  socket.join([...rooms.map((room) => channelOf(room._id)), userChannelOf(user._id)]);
  await setPresence(user, "online");
}

function onConnection(server: RealtimeServer, socket: RealtimeSocket): void {
  const user = socket.data.user;
  const allowMessage = throttle(10, 2);
  const allowTyping = throttle(20, 5);
  const allowOther = throttle(60, 10);

  const listensTo = (roomId: string): boolean => socket.rooms.has(channelOf(roomId));

  socket.on("room:join", async (roomId, ack) => {
    const reply = typeof ack === "function" ? ack : undefined;
    try {
      if (!allowOther() || !isRoomId(roomId)) {
        reply?.({ ok: false, message: "Room unavailable" });
        return;
      }
      const room = await Room.findById(roomId).select("members.user").lean();
      if (!room || !room.members.some((member) => sameId(member.user, user._id))) {
        reply?.({ ok: false, message: "Room unavailable" });
        return;
      }
      socket.join(channelOf(room._id));
      reply?.({ ok: true });
    } catch {
      reply?.({ ok: false, message: "Room unavailable" });
    }
  });

  socket.on("room:leave", (roomId) => {
    if (isRoomId(roomId)) socket.leave(channelOf(roomId));
  });

  const typing = (roomId: unknown, state: boolean): void => {
    if (!isRoomId(roomId) || !listensTo(roomId) || !allowTyping()) return;
    socket.to(channelOf(roomId)).emit("typing", {
      roomId,
      user: chatUser(user),
      typing: state,
    });
  };
  socket.on("typing:start", (roomId) => typing(roomId, true));
  socket.on("typing:stop", (roomId) => typing(roomId, false));

  socket.on("message:send", async (payload, ack) => {
    const reply = typeof ack === "function" ? ack : undefined;
    try {
      if (!allowMessage()) {
        throw new Error("You are sending too many messages. Please wait a moment.");
      }
      if (typeof payload?.body !== "string" || !isRoomId(payload?.roomId)) {
        throw new Error("Invalid message.");
      }
      const body = payload.body.trim();
      if (!body) {
        throw new Error("A message cannot be empty.");
      }
      if (body.length > 500) {
        throw new Error("A message cannot exceed 500 characters.");
      }

      const room = await Room.findById(payload.roomId);
      if (!room || !room.hasMember(user._id)) {
        throw new Error("You are not a member of this room.");
      }

      const message = await Message.create({
        room: room._id,
        author: user._id,
        body,
        language: user.language,
      });

      await Room.updateOne(
        { _id: room._id, "members.user": user._id },
        {
          $set: {
            lastMessageAt: message.createdAt,
            "members.$.lastReadAt": message.createdAt,
          },
        },
      );

      await message.populate("author", "name initials country flag language presence");
      const formatted = chatMessage(message, null);

      server.to(channelOf(room._id)).emit("message:new", {
        roomId: idOf(room._id),
        message: formatted,
      });
      reply?.({ ok: true, message: formatted });
    } catch (err) {
      const known = err instanceof Error && !(err instanceof mongoose.Error);
      if (!known) console.error("[socket] message:send :", err);
      reply?.({
        ok: false,
        message: known ? (err as Error).message : "Could not send.",
      });
    }
  });

  socket.on(
    "message:read",
    safely("message:read", async (roomId: unknown) => {
      if (!isRoomId(roomId) || !allowOther()) return;
      await Room.updateOne(
        { _id: roomId, "members.user": user._id },
        { $set: { "members.$.lastReadAt": new Date() } },
      );
    }),
  );

  socket.on(
    "presence:set",
    safely("presence:set", async (presence: unknown) => {
      if (!allowOther()) return;
      if (presence === "online" || presence === "away" || presence === "offline") {
        await setPresence(user, presence);
      }
    }),
  );

  socket.on(
    "disconnect",
    safely("disconnect", async () => {
      const remaining = await server.in(userChannelOf(user._id)).fetchSockets();
      if (remaining.length === 0) {
        await setPresence(user, "offline");
      }
    }),
  );

  safely("abonnements", joinOwnChannels)(socket, user);
}

export function attachRealtime(
  httpServer: HttpServer,
  { origins }: { origins: string[] },
): RealtimeServer {
  const server: RealtimeServer = new Server(httpServer, {
    cors: { origin: origins, methods: ["GET", "POST"], credentials: true },
    maxHttpBufferSize: 16 * 1024,
    connectTimeout: 10_000,
  });

  server.use((socket, next) => {
    void authenticate(socket, next);
  });

  server.on("connection", (socket) => {
    try {
      onConnection(server, socket);
    } catch (error) {
      console.error("[socket] connexion :", error);
      socket.disconnect(true);
    }
  });

  io = server;
  return server;
}
