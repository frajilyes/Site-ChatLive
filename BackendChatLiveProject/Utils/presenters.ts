import type { Types } from "mongoose";

import type { ICommunity } from "../Models/community";
import type { IContactMessage } from "../Models/contactMessage";
import type { IMessage } from "../Models/message";
import type { IRoom } from "../Models/room";
import type { ISiteSettings } from "../Models/siteSettings";
import type { ITestimonial } from "../Models/testimonial";
import type { IUser } from "../Models/userAuth";
import type {
  AdminContactMessage,
  AuthUser,
  ChatMessage as ChatMessageDto,
  ChatRoom as ChatRoomDto,
  ChatUser as ChatUserDto,
  Community as CommunityDto,
  ContentPayload,
  MemberRole,
  Presence,
  SiteIdentity,
  Testimonial as TestimonialDto,
} from "../types/index";
import { idOf } from "./ids";

type Id = Types.ObjectId | string;

export function initialsFrom(name: unknown): string {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function minutesSince(date: Date | string): number {
  const stamp = date instanceof Date ? date.getTime() : new Date(date).getTime();
  if (Number.isNaN(stamp)) return 0;
  return Math.max(0, Math.round((Date.now() - stamp) / 60000));
}

function isoOf(date: Date | string): string {
  return date instanceof Date ? date.toISOString() : new Date(date).toISOString();
}

function populatedAuthor(message: MessageSource): { language?: string } | null {
  const author: unknown = message.author;
  return author && typeof author === "object" && "language" in author
    ? (author as { language?: string })
    : null;
}

type UserSource = Pick<IUser, "name" | "initials" | "country" | "flag" | "language"> & {
  _id: Id;
  presence?: Presence;
};

type AuthUserSource = UserSource & Pick<IUser, "email" | "role" | "createdAt"> & {
  provider?: IUser["provider"];
};

type RoomSource = Pick<IRoom, "name" | "emoji" | "topic"> & {
  _id: Id;
  members?: readonly { user: Id }[];
};

type MessageSource = Pick<IMessage, "body" | "createdAt"> & {
  _id: Id;
  room: Id;
  author: unknown;
  language?: string;
};

type CommunitySource = Pick<
  ICommunity,
  "name" | "topic" | "description" | "emoji" | "featured"
> & {
  _id: Id;
  languages: readonly string[];
};

type ContactSource = Pick<
  IContactMessage,
  "name" | "email" | "subject" | "message" | "status" | "createdAt"
> & { _id: Id };

type ContentSource = { key: string; data?: Record<string, unknown> | null };

type TestimonialSource = Pick<ITestimonial, "quote" | "role" | "rating" | "createdAt"> & {
  _id: Id;
  author: unknown;
};

export interface AudienceCounts {
  members: number;
  online: number;
}

export function publicUser(user: AuthUserSource): AuthUser {
  return {
    id: idOf(user._id),
    name: user.name,
    email: user.email,
    initials: user.initials || initialsFrom(user.name),
    country: user.country,
    flag: user.flag,
    language: user.language,
    createdAt: isoOf(user.createdAt),
    role: user.role,
    provider: user.provider ?? "local",
  };
}

export function chatUser(user: UserSource, roomRole?: MemberRole): ChatUserDto {
  const payload: ChatUserDto = {
    id: idOf(user._id),
    name: user.name,
    initials: user.initials || initialsFrom(user.name),
    country: user.country,
    flag: user.flag,
    presence: user.presence ?? "offline",
    language: user.language,
  };
  return roomRole ? { ...payload, roomRole } : payload;
}

export function chatRoom(room: RoomSource, unread = 0): ChatRoomDto {
  return {
    id: idOf(room._id),
    name: room.name,
    emoji: room.emoji,
    topic: room.topic,
    memberIds: (room.members ?? []).map((member) => idOf(member.user)),
    unread,
  };
}

export function chatMessage(
  message: MessageSource,
  viewerLanguage: string | null,
): ChatMessageDto {
  const author = populatedAuthor(message);
  const authorLanguage = author?.language ?? message.language ?? null;
  const payload: ChatMessageDto = {
    id: idOf(message._id),
    roomId: idOf(message.room),
    authorId: idOf(message.author as Id),
    body: message.body,
    minutesAgo: minutesSince(message.createdAt),
    createdAt: isoOf(message.createdAt),
  };
  if (authorLanguage && viewerLanguage && authorLanguage !== viewerLanguage) {
    return { ...payload, translatedFrom: authorLanguage };
  }
  return payload;
}

export function publicCommunity(
  community: CommunitySource,
  counts: AudienceCounts = { members: 0, online: 0 },
): CommunityDto {
  return {
    id: idOf(community._id),
    name: community.name,
    topic: community.topic,
    description: community.description,
    members: counts.members,
    online: counts.online,
    languages: [...community.languages],
    emoji: community.emoji,
    featured: community.featured,
  };
}

export function publicContactMessage(entry: ContactSource): AdminContactMessage {
  return {
    id: idOf(entry._id),
    name: entry.name,
    email: entry.email,
    subject: entry.subject,
    message: entry.message,
    status: entry.status,
    createdAt: isoOf(entry.createdAt),
  };
}

export function contentEntry<T extends { id: string } = ContentPayload>(
  entry: ContentSource,
): T {
  return { id: entry.key, ...(entry.data ?? {}) } as T;
}

export function siteIdentity(settings: ISiteSettings): SiteIdentity {
  return {
    name: settings.name,
    tagline: settings.tagline,
    description: settings.description,
    email: settings.email,
    phone: settings.phone,
    founded: settings.founded,
    legalNote: settings.legalNote,
  };
}

export function publicTestimonial(entry: TestimonialSource): TestimonialDto {
  const author = entry.author as Pick<IUser, "name" | "country" | "flag">;
  return {
    id: idOf(entry._id),
    quote: entry.quote,
    author: author.name,
    role: entry.role,
    country: author.country,
    flag: author.flag,
    rating: entry.rating,
    createdAt: isoOf(entry.createdAt),
  };
}
