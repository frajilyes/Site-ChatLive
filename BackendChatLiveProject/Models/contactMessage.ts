import { type HydratedDocument, Schema, type Types, model } from "mongoose";

import type { ContactStatus } from "../types/index";

export const CONTACT_SUBJECTS: readonly string[] = [
  "General question",
  "Technical support",
  "Community plan",
  "Partnership",
  "Press",
  "Security",
];

export interface IContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactStatus;
  author: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ContactMessageDocument = HydratedDocument<IContactMessage>;

const contactMessageSchema = new Schema<IContactMessage>(
  {
    name: {
      type: String,
      required: [true, "Please enter your name (2 characters minimum)."],
      trim: true,
      minlength: [2, "Please enter your name (2 characters minimum)."],
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, "This email address does not look valid."],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "This email address does not look valid."],
    },
    subject: {
      type: String,
      enum: {
        values: CONTACT_SUBJECTS,
        message: "This subject is not in the list provided.",
      },
      default: CONTACT_SUBJECTS[0],
    },
    message: {
      type: String,
      required: [true, "Your message is a bit short (12 characters minimum)."],
      trim: true,
      minlength: [12, "Your message is a bit short (12 characters minimum)."],
      maxlength: [4000, "Your message cannot exceed 4000 characters."],
    },
    status: {
      type: String,
      enum: ["new", "read", "answered"],
      default: "new",
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

contactMessageSchema.index({ status: 1, createdAt: -1 });

export default model<IContactMessage>("ContactMessage", contactMessageSchema);
