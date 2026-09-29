import Message from "../Models/message";
import Room from "../Models/room";
import User, { type IUser } from "../Models/userAuth";
import asyncHandler from "../Utils/asyncHandler";
import { idOf } from "../Utils/ids";
import { chatUser, initialsFrom, minutesSince } from "../Utils/presenters";
import { SITE_LANGUAGE } from "../config/countries";
import type { Showcase, ShowcaseMessage } from "../types/index";

const PREVIEW_MESSAGES = 4;

const PRESENCE_LIMIT = 8;

type PreviewAuthor = Pick<IUser, "name" | "initials" | "flag"> & { language?: string };

type PreviewMember = { user: Pick<IUser, "presence"> | null };

function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export const getShowcase = asyncHandler(async (req, res) => {
  const room = await Room.findOne({ showcase: true })
    .sort({ lastMessageAt: -1 })
    .populate("members.user", "name initials country flag language presence");

  const [online, places] = await Promise.all([
    User.find({ presence: "online" })
      .sort({ lastSeenAt: -1 })
      .limit(PRESENCE_LIMIT)
      .select("name initials country flag language presence")
      .lean(),
    User.distinct("country"),
  ]);

  let messages: ShowcaseMessage[] = [];
  let roomPayload: Showcase["room"] = null;

  if (room) {
    const recent = await Message.find({ room: room._id })
      .sort({ createdAt: -1 })
      .limit(PREVIEW_MESSAGES)
      .populate("author", "name initials flag language")
      .lean();

    messages = recent
      .filter((message) => message.author)
      .reverse()
      .map((message) => {
        const author = message.author as unknown as PreviewAuthor;
        const language = author.language ?? message.language ?? "";
        return {
          id: idOf(message._id),
          author: firstNameOf(author.name),
          initials: author.initials || initialsFrom(author.name),
          flag: author.flag,
          body: message.body,
          minutesAgo: minutesSince(message.createdAt),
          language,
          ...(language && language !== SITE_LANGUAGE
            ? { translatedFrom: language }
            : {}),
        };
      });

    const members = room.members as unknown as PreviewMember[];
    roomPayload = {
      id: idOf(room._id),
      name: room.name,
      emoji: room.emoji,
      topic: room.topic,
      members: members.length,
      online: members.filter((member) => member.user?.presence === "online").length,
    };
  }

  const payload: Showcase = {
    room: roomPayload,
    messages,
    online: online.map((user) => chatUser(user)),
    places: places.filter(Boolean).sort(),
  };

  res.status(200).json(payload);
});
