import type { QueryFilter } from "mongoose";

import Testimonial, { type ITestimonial } from "../Models/testimonial";
import type { IUser } from "../Models/userAuth";
import ApiError from "../Utils/ApiError";
import asyncHandler from "../Utils/asyncHandler";
import { requireUser } from "../Utils/currentUser";
import { idOf } from "../Utils/ids";
import { initialsFrom, publicTestimonial } from "../Utils/presenters";
import { param } from "../Utils/params";
import type { AdminTestimonial, Testimonial as TestimonialDto } from "../types/index";

type PopulatedAuthor = Pick<IUser, "name" | "email" | "initials" | "country" | "flag"> & {
  _id: unknown;
};

export async function approvedTestimonials(limit = 12): Promise<TestimonialDto[]> {
  const entries = await Testimonial.find({ status: "approved" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("author", "name initials country flag language presence")
    .lean();

  return entries
    .filter((entry) => entry.author)
    .map((entry) => publicTestimonial(entry));
}

export const getTestimonials = asyncHandler(async (req, res) => {
  const data = await approvedTestimonials();
  res.status(200).json({ total: data.length, data });
});

export const getMyTestimonial = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const entry = await Testimonial.findOne({ author: user._id }).lean();

  res.status(200).json({
    testimonial: entry
      ? {
          id: String(entry._id),
          quote: entry.quote,
          role: entry.role,
          rating: entry.rating,
          status: entry.status,
        }
      : null,
  });
});

export const saveTestimonial = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const { quote, role, rating } = req.body;

  const text = typeof quote === "string" ? quote.trim() : "";
  if (text.length > 400) {
    throw ApiError.badRequest("Your testimonial cannot exceed 400 characters.", "quote");
  }
  if (text.length < 40) {
    throw ApiError.badRequest(
      "Your testimonial is a bit short (40 characters minimum).",
      "quote",
    );
  }

  const score = Number(rating);
  if (rating !== undefined && (!Number.isInteger(score) || score < 1 || score > 5)) {
    throw ApiError.badRequest("The rating goes from 1 to 5 stars.", "rating");
  }

  const entry = await Testimonial.findOneAndUpdate(
    { author: user._id },
    {
      $set: {
        quote: text,
        role: typeof role === "string" && role.trim() ? role.trim().slice(0, 60) : "Membre",
        rating: rating === undefined ? 5 : score,
        status: "pending",
      },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );

  res.status(201).json({
    message: "Thank you! Your testimonial will be published after review.",
    testimonial: {
      id: String(entry._id),
      quote: entry.quote,
      role: entry.role,
      rating: entry.rating,
      status: entry.status,
    },
  });
});

export const getAllTestimonials = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter: QueryFilter<ITestimonial> = {};
  if (status) filter.status = String(status) as ITestimonial["status"];

  const entries = await Testimonial.find(filter)
    .sort({ createdAt: -1 })
    .populate("author", "name email initials country flag")
    .lean();

  const data: AdminTestimonial[] = entries.map((entry) => {
    const author = entry.author as unknown as PopulatedAuthor | null;
    return {
      id: idOf(entry._id),
      quote: entry.quote,
      role: entry.role,
      rating: entry.rating,
      status: entry.status,
      createdAt: new Date(entry.createdAt).toISOString(),
      author: author
        ? {
            id: idOf(author._id as string),
            name: author.name,
            email: author.email,
            initials: author.initials || initialsFrom(author.name),
            country: author.country,
            flag: author.flag,
          }
        : null,
    };
  });

  res.status(200).json({ total: data.length, data });
});

export const updateTestimonialStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status || !["pending", "approved", "rejected"].includes(status)) {
    throw ApiError.badRequest("Unknown status: pending, approved or rejected.", "status");
  }

  const entry = await Testimonial.findByIdAndUpdate(
    param(req, "id"),
    { $set: { status } },
    { new: true, runValidators: true },
  );
  if (!entry) {
    throw ApiError.notFound("This testimonial does not exist.");
  }

  res.status(200).json({ message: "Testimonial updated", status: entry.status });
});

export const deleteTestimonial = asyncHandler(async (req, res) => {
  const deleted = await Testimonial.findByIdAndDelete(param(req, "id"));
  if (!deleted) {
    throw ApiError.notFound("This testimonial does not exist.");
  }
  res.status(200).json({ message: "Testimonial deleted" });
});
