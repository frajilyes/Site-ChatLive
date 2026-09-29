import { type HydratedDocument, type Model, Schema, type Types, model } from "mongoose";

import { type Ref, idOf } from "../Utils/ids";
import type { MemberRole, RoomVisibility } from "../types/index";

export interface IRoomMember {
  user: Types.ObjectId;
  role: MemberRole;
  joinedAt: Date;
  lastReadAt: Date;
}

export interface IRoom {
  name: string;
  emoji: string;
  topic: string;
  owner: Types.ObjectId;
  members: IRoomMember[];
  visibility: RoomVisibility;
  community: Types.ObjectId | null;
  showcase: boolean;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomMethods {
  hasMember(userId: Ref | null | undefined): boolean;
}

type RoomModel = Model<IRoom, Record<string, never>, RoomMethods>;

export type RoomDocument = HydratedDocument<IRoom, RoomMethods>;

const memberSchema = new Schema<IRoomMember>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "moderator", "member"],
      default: "member",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastReadAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const roomSchema = new Schema<IRoom, RoomModel, RoomMethods>(
  {
    name: {
      type: String,
      required: [true, "The room must have a name."],
      trim: true,
      minlength: [2, "The room name must be at least 2 characters long."],
      maxlength: [60, "The room name cannot exceed 60 characters."],
    },
    emoji: {
      type: String,
      required: [true, "The room must have a two-letter badge."],
      trim: true,
      uppercase: true,
      maxlength: 2,
    },
    topic: {
      type: String,
      required: [true, "The room must have a topic."],
      trim: true,
      maxlength: [140, "The topic cannot exceed 140 characters."],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: {
      type: [memberSchema],
      default: [],
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    community: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      default: null,
    },
    showcase: {
      type: Boolean,
      default: false,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

roomSchema.index({ "members.user": 1 });
roomSchema.index({ visibility: 1, lastMessageAt: -1 });
roomSchema.index({ showcase: 1, lastMessageAt: -1 });
roomSchema.index({ name: "text", topic: "text" });

roomSchema.methods.hasMember = function hasMember(this: RoomDocument, userId) {
  const needle = idOf(userId);
  return this.members.some((member) => idOf(member.user) === needle);
};

export default model<IRoom, RoomModel>("Room", roomSchema);
