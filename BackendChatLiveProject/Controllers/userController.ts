import bcrypt from "bcrypt";
import type { QueryFilter } from "mongoose";

import User, { type IUser } from "../Models/userAuth";
import ApiError from "../Utils/ApiError";
import asyncHandler from "../Utils/asyncHandler";
import { requireUser } from "../Utils/currentUser";
import { chatUser, initialsFrom, publicUser } from "../Utils/presenters";
import { param } from "../Utils/params";
import { USER_ROLES, isUserRole } from "../Utils/roles";
import { COUNTRIES, resolveCountry } from "../config/countries";
import { signToken } from "../Utils/generateToken";
import { disconnectUser } from "../config/realtime";
import { SALT_ROUNDS } from "./userAuth";

export const getProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ user: publicUser(requireUser(req)) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const { name, country } = req.body;

  const changes: Partial<IUser> = {};
  if (name !== undefined) {
    changes.name = name;
    changes.initials = initialsFrom(name);
  }
  if (country !== undefined) {
    const resolved = resolveCountry(country);
    changes.country = resolved.name;
    changes.flag = resolved.code;
    changes.language = resolved.language;
  }

  const updated = await User.findByIdAndUpdate(
    user._id,
    { $set: changes },
    { new: true, runValidators: true },
  );

  if (!updated) {
    throw ApiError.notFound("Account not found.");
  }

  res.status(200).json({ message: "Profile updated", user: publicUser(updated) });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(requireUser(req)._id).select("+password");
  if (!user) {
    throw ApiError.notFound("Account not found.");
  }

  if (!user.password) {
    throw ApiError.badRequest(
      "This account signs in with Google and has no password.",
      "currentPassword",
    );
  }

  const matches = await bcrypt.compare(currentPassword, user.password);
  if (!matches) {
    throw ApiError.unauthorized("Incorrect password.", "currentPassword");
  }

  user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();

  res.status(200).json({
    message: "Password updated",
    token: signToken(user._id, user.role, user.tokenVersion),
  });
});

export const updatePresence = asyncHandler(async (req, res) => {
  const { presence } = req.body;
  if (presence !== "online" && presence !== "away" && presence !== "offline") {
    throw ApiError.badRequest("Presence must be 'online', 'away' or 'offline'.", "presence");
  }

  const updated = await User.findByIdAndUpdate(
    requireUser(req)._id,
    { $set: { presence, lastSeenAt: new Date() } },
    { new: true },
  );
  if (!updated) {
    throw ApiError.notFound("Account not found.");
  }

  res.status(200).json({ user: chatUser(updated) });
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const searchUsers = asyncHandler(async (req, res) => {
  const needle = String(req.query.search ?? "").trim().slice(0, 60);
  const limit = Math.min(Math.max(Math.trunc(Number(req.query.limit)) || 20, 1), 100);

  const query: QueryFilter<IUser> = needle
    ? {
        $or: [
          { name: new RegExp(escapeRegExp(needle), "i") },
          { email: needle.toLowerCase() },
        ],
      }
    : {};

  const users = await User.find(query).sort({ name: 1 }).limit(limit);

  res.status(200).json({ total: users.length, data: users.map((entry) => chatUser(entry)) });
});

export const getCountries = asyncHandler(async (req, res) => {
  res.status(200).json({ total: COUNTRIES.length, data: COUNTRIES });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.status(200).json({ total: users.length, data: users.map(publicUser) });
});

export const getUserById = asyncHandler(async (req, res) => {
  const found = await User.findById(param(req, "id"));
  if (!found) {
    throw ApiError.notFound("Account not found.");
  }
  res.status(200).json({ user: publicUser(found) });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body ?? {};
  if (!isUserRole(role)) {
    throw ApiError.badRequest(
      `Role must be ${USER_ROLES.map((value) => `'${value}'`).join(", ")}.`,
      "role",
    );
  }

  if (param(req, "id") === String(requireUser(req)._id) && role !== "admin") {
    throw ApiError.badRequest("You cannot remove your own administrator role.");
  }

  const target = await User.findById(param(req, "id"));
  if (!target) {
    throw ApiError.notFound("Account not found.");
  }

  if (target.role === "admin" && role !== "admin") {
    const admins = await User.countDocuments({ role: "admin" });
    if (admins <= 1) {
      throw ApiError.badRequest(
        "This account is the last administrator: appoint another one before demoting it.",
      );
    }
  }

  if (target.role !== role) {
    target.tokenVersion = (target.tokenVersion ?? 0) + 1;
  }
  const changed = target.role !== role;
  target.role = role;
  await target.save();
  if (changed) disconnectUser(target._id);

  res.status(200).json({ message: "Role updated", user: publicUser(target) });
});

export const deleteUserById = asyncHandler(async (req, res) => {
  if (param(req, "id") === String(requireUser(req)._id)) {
    throw ApiError.badRequest("You cannot delete your own account through this route.");
  }

  const deleted = await User.findByIdAndDelete(param(req, "id"));
  if (!deleted) {
    throw ApiError.notFound("Account not found.");
  }
  disconnectUser(deleted._id);

  res.status(200).json({ message: "Account deleted" });
});
