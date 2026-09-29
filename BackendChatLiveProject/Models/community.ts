import { type HydratedDocument, Schema, model } from "mongoose";

export interface ICommunity {
  name: string;
  topic: string;
  description: string;
  languages: string[];
  emoji: string;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CommunityDocument = HydratedDocument<ICommunity>;

const communitySchema = new Schema<ICommunity>(
  {
    name: {
      type: String,
      required: [true, "The community must have a name."],
      trim: true,
      unique: true,
      maxlength: 60,
    },
    topic: {
      type: String,
      required: [true, "The community must have a category."],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "The community must have a description."],
      trim: true,
      maxlength: [400, "The description cannot exceed 400 characters."],
    },
    languages: {
      type: [String],
      default: [],
    },
    emoji: {
      type: String,
      required: [true, "The community must have a two-letter badge."],
      trim: true,
      uppercase: true,
      maxlength: 2,
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

communitySchema.index({ featured: -1, name: 1 });
communitySchema.index({ name: "text", topic: "text", description: "text" });

export default model<ICommunity>("Community", communitySchema);
