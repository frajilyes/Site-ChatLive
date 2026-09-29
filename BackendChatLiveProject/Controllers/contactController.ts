import type { QueryFilter } from "mongoose";

import ContactMessage, {
  CONTACT_SUBJECTS,
  type IContactMessage,
} from "../Models/contactMessage";
import ApiError from "../Utils/ApiError";
import asyncHandler from "../Utils/asyncHandler";
import { idOf } from "../Utils/ids";
import { publicContactMessage } from "../Utils/presenters";
import { param } from "../Utils/params";
import type { ContactStatus } from "../types/index";

function assertStatus(value: unknown): ContactStatus {
  if (value === "new" || value === "read" || value === "answered") {
    return value;
  }
  throw ApiError.badRequest("Status must be 'new', 'read' or 'answered'.", "status");
}

export const getContactSubjects = asyncHandler(async (req, res) => {
  res.status(200).json({ total: CONTACT_SUBJECTS.length, data: CONTACT_SUBJECTS });
});

export const createContactMessage = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  const created = await ContactMessage.create({
    name,
    email,
    subject,
    message,
    author: req.user?._id ?? null,
  });

  res.status(201).json({
    message: "Message sent, our team will reply by email.",
    id: idOf(created._id),
  });
});

export const getAllContactMessages = asyncHandler(async (req, res) => {
  const query: QueryFilter<IContactMessage> = {};
  if (req.query.status) {
    query.status = assertStatus(req.query.status);
  }

  const entries = await ContactMessage.find(query).sort({ createdAt: -1 });
  res.status(200).json({ total: entries.length, data: entries.map(publicContactMessage) });
});

export const getContactMessageById = asyncHandler(async (req, res) => {
  const entry = await ContactMessage.findById(param(req, "id"));
  if (!entry) {
    throw ApiError.notFound("This message does not exist.");
  }
  res.status(200).json({ contactMessage: publicContactMessage(entry) });
});

export const updateContactStatus = asyncHandler(async (req, res) => {
  const status = assertStatus(req.body.status);

  const updated = await ContactMessage.findByIdAndUpdate(
    param(req, "id"),
    { $set: { status } },
    { new: true },
  );
  if (!updated) {
    throw ApiError.notFound("This message does not exist.");
  }

  res.status(200).json({
    message: "Status updated",
    contactMessage: publicContactMessage(updated),
  });
});

export const deleteContactMessage = asyncHandler(async (req, res) => {
  const deleted = await ContactMessage.findByIdAndDelete(param(req, "id"));
  if (!deleted) {
    throw ApiError.notFound("This message does not exist.");
  }
  res.status(200).json({ message: "Message deleted" });
});
