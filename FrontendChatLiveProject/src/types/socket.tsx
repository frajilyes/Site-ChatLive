import type { ChatMessage, ChatRoom, ChatUser, Presence } from './index'

export interface MessageEvent {
  roomId: string
  message: ChatMessage
}

export interface MessageDeletedEvent {
  roomId: string
  id: string
}

export interface TypingEvent {
  roomId: string
  user: ChatUser
  typing: boolean
}

export interface PresenceEvent {
  userId: string
  presence: Presence
}

export interface MemberJoinedEvent {
  roomId: string
  member: ChatUser
}

export interface MemberLeftEvent {
  roomId: string
  userId: string
}

export interface RoomDeletedEvent {
  id: string
}

export interface SendMessageInput {
  roomId: string
  body: string
}

export type SendAck =
  | { ok: true; message: ChatMessage }
  | { ok: false; message: string }

export type JoinAck = { ok: true } | { ok: false; message: string }

export interface ServerToClientEvents {
  'message:new': (payload: MessageEvent) => void
  'message:updated': (payload: MessageEvent) => void
  'message:deleted': (payload: MessageDeletedEvent) => void
  typing: (payload: TypingEvent) => void
  'presence:update': (payload: PresenceEvent) => void
  'room:updated': (payload: ChatRoom) => void
  'room:deleted': (payload: RoomDeletedEvent) => void
  'room:member-joined': (payload: MemberJoinedEvent) => void
  'room:member-left': (payload: MemberLeftEvent) => void
}

export interface ClientToServerEvents {
  'room:join': (roomId: string, ack?: (result: JoinAck) => void) => void
  'room:leave': (roomId: string) => void
  'typing:start': (roomId: string) => void
  'typing:stop': (roomId: string) => void
  'message:send': (payload: SendMessageInput, ack?: (result: SendAck) => void) => void
  'message:read': (roomId: string) => void
  'presence:set': (presence: Presence) => void
}
