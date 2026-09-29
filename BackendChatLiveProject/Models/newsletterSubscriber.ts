import { type HydratedDocument, Schema, type Types, model } from "mongoose";

export interface INewsletterSubscriber {
  email: string;
  user: Types.ObjectId | null;
  unsubscribedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type NewsletterSubscriberDocument = HydratedDocument<INewsletterSubscriber>;

const newsletterSubscriberSchema = new Schema<INewsletterSubscriber>(
  {
    email: {
      type: String,
      required: [true, "This email address does not look valid."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "This email address does not look valid."],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    unsubscribedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export default model<INewsletterSubscriber>("NewsletterSubscriber", newsletterSubscriberSchema);
