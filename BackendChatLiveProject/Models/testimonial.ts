import { type HydratedDocument, Schema, type Types, model } from "mongoose";

import type { TestimonialStatus } from "../types/index";

export interface ITestimonial {
  author: Types.ObjectId;
  quote: string;
  role: string;
  rating: number;
  status: TestimonialStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type TestimonialDocument = HydratedDocument<ITestimonial>;

const testimonialSchema = new Schema<ITestimonial>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    quote: {
      type: String,
      required: [true, "Your testimonial is a bit short (40 characters minimum)."],
      trim: true,
      minlength: [40, "Your testimonial is a bit short (40 characters minimum)."],
      maxlength: [400, "Your testimonial cannot exceed 400 characters."],
    },
    role: {
      type: String,
      default: "Membre",
      trim: true,
      maxlength: 60,
    },
    rating: {
      type: Number,
      default: 5,
      min: [1, "The rating goes from 1 to 5 stars."],
      max: [5, "The rating goes from 1 to 5 stars."],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

testimonialSchema.index({ status: 1, createdAt: -1 });

export default model<ITestimonial>("Testimonial", testimonialSchema);
