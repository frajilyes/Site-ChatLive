import { type HydratedDocument, Schema, model } from "mongoose";

import { COUNTRY_NAMES, DEFAULT_COUNTRY } from "../config/countries";
import type { AuthProvider, Presence, UserRole } from "../types/index";

export interface IVerification {
  codeHash: string;
  expiresAt: Date;
  sentAt: Date;
  attempts: number;
}

export interface IUser {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  avatar?: string;
  provider: AuthProvider;
  emailVerified: boolean;
  verification?: IVerification;
  initials: string;
  country: string;
  flag: string;
  language: string;
  presence: Presence;
  lastSeenAt: Date;
  role: UserRole;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Please enter your name (2 characters minimum)."],
      trim: true,
      minlength: [2, "Please enter your name (2 characters minimum)."],
      maxlength: [60, "The name cannot exceed 60 characters."],
    },
    email: {
      type: String,
      required: [true, "This email address does not look valid."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "This email address does not look valid."],
    },
    password: {
      type: String,
      required: [
        function (this: IUser) {
          return !this.googleId;
        },
        "The password must be at least 8 characters long.",
      ],
      select: false,
    },
    googleId: {
      type: String,
      trim: true,
      index: { unique: true, sparse: true },
    },
    avatar: {
      type: String,
      trim: true,
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    verification: {
      select: false,
      type: new Schema<IVerification>(
        {
          codeHash: { type: String, required: true },
          expiresAt: { type: Date, required: true },
          sentAt: { type: Date, required: true },
          attempts: { type: Number, default: 0 },
        },
        { _id: false },
      ),
    },
    initials: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 2,
    },
    country: {
      type: String,
      enum: {
        values: COUNTRY_NAMES,
        message: "This country is not in the list provided.",
      },
      default: DEFAULT_COUNTRY.name,
    },
    flag: {
      type: String,
      uppercase: true,
      trim: true,
      default: DEFAULT_COUNTRY.code,
    },
    language: {
      type: String,
      trim: true,
      default: DEFAULT_COUNTRY.language,
    },
    presence: {
      type: String,
      enum: ["online", "away", "offline"],
      default: "offline",
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user",
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

userSchema.index({ name: 1 });

export default model<IUser>("User", userSchema);
