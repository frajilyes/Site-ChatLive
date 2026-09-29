import { type HydratedDocument, Schema, type Types, model } from "mongoose";

export interface IMessage {
  room: Types.ObjectId;
  author: Types.ObjectId;
  body: string;
  language?: string;
  editedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type MessageDocument = HydratedDocument<IMessage>;

const messageSchema = new Schema<IMessage>(
  {
    room: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      required: [true, "A message cannot be empty."],
      trim: true,
      maxlength: [500, "A message cannot exceed 500 characters."],
    },
    language: {
      type: String,
      trim: true,
    },
    editedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// The _id tail matches the (createdAt, _id) order the history is paged on, so
// messages sharing a millisecond still come back in one stable sequence.
messageSchema.index({ room: 1, createdAt: -1, _id: -1 });

export default model<IMessage>("Message", messageSchema);
