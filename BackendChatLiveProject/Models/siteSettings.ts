import { type HydratedDocument, Schema, model } from "mongoose";

export const SETTINGS_SLUG = "default";

export interface ISiteSettings {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  email: string;
  phone: string;
  founded: number;
  legalNote: string;
  createdAt: Date;
  updatedAt: Date;
}

export type SiteSettingsDocument = HydratedDocument<ISiteSettings>;

const siteSettingsSchema = new Schema<ISiteSettings>(
  {
    slug: {
      type: String,
      default: SETTINGS_SLUG,
      unique: true,
      immutable: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    tagline: { type: String, default: "", trim: true, maxlength: 140 },
    description: { type: String, default: "", trim: true, maxlength: 600 },
    email: { type: String, default: "", trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    founded: { type: Number, default: new Date().getFullYear() },
    legalNote: { type: String, default: "", trim: true, maxlength: 300 },
  },
  { timestamps: true },
);

export default model<ISiteSettings>("SiteSettings", siteSettingsSchema);
