import NewsletterSubscriber from "../Models/newsletterSubscriber";
import ApiError from "../Utils/ApiError";
import asyncHandler from "../Utils/asyncHandler";
import { requireUser } from "../Utils/currentUser";
import { param } from "../Utils/params";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const subscribe = asyncHandler(async (req, res) => {
  const email = String(req.body?.email ?? "")
    .trim()
    .toLowerCase();

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw ApiError.badRequest("This email address does not look valid.", "email");
  }

  const existing = await NewsletterSubscriber.findOne({ email });
  if (existing) {
    if (existing.unsubscribedAt) {
      existing.unsubscribedAt = null;
      existing.user = req.user?._id ?? existing.user;
      await existing.save();
    }
    res.status(200).json({
      message: "This address is already subscribed to the monthly newsletter.",
      alreadySubscribed: true,
    });
    return;
  }

  await NewsletterSubscriber.create({ email, user: req.user?._id ?? null });

  res.status(201).json({
    message: "Thank you! Your subscription to the monthly newsletter is confirmed.",
    alreadySubscribed: false,
  });
});

export const unsubscribe = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const email = param(req, "email").trim().toLowerCase();

  if (user.role !== "admin" && email !== user.email) {
    throw ApiError.forbidden("You can only unsubscribe your own address.");
  }

  const updated = await NewsletterSubscriber.findOneAndUpdate(
    { email, unsubscribedAt: null },
    { $set: { unsubscribedAt: new Date() } },
  );
  if (!updated) {
    throw ApiError.notFound("This address is not subscribed.");
  }

  res.status(200).json({ message: "You will no longer receive the monthly newsletter." });
});

export const getSubscribers = asyncHandler(async (req, res) => {
  const entries = await NewsletterSubscriber.find({ unsubscribedAt: null })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    total: entries.length,
    data: entries.map((entry) => ({
      id: String(entry._id),
      email: entry.email,
      createdAt: new Date(entry.createdAt).toISOString(),
    })),
  });
});
