import { type HydratedDocument, Schema, model } from "mongoose";

import type { ContentSection } from "../types/index";

export interface ISiteContent {
  section: ContentSection;
  key: string;
  order: number;
  published: boolean;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type SiteContentDocument = HydratedDocument<ISiteContent>;

export const CONTENT_SECTIONS: readonly ContentSection[] = [
  "navItem",
  "footerColumn",
  "socialLink",
  "stat",
  "feature",
  "step",
  "value",
  "plan",
  "faq",
  "team",
  "milestone",
  "contactChannel",
  "office",
  "authBenefit",
  "metric",
  "securityPoint",
  "securityRow",
  "platform",
];

const siteContentSchema = new Schema<ISiteContent>(
  {
    section: {
      type: String,
      required: [true, "The section is required."],
      enum: {
        values: CONTENT_SECTIONS,
        message: "This content section does not exist.",
      },
      index: true,
    },
    key: {
      type: String,
      required: [true, "The entry must have a stable key."],
      trim: true,
      maxlength: 40,
    },
    order: {
      type: Number,
      default: 0,
    },
    published: {
      type: Boolean,
      default: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

siteContentSchema.index({ section: 1, key: 1 }, { unique: true });
siteContentSchema.index({ section: 1, order: 1 });

export default model<ISiteContent>("SiteContent", siteContentSchema);
