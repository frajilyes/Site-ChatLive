import bcrypt from "bcrypt";

import User, { type UserDocument } from "../Models/userAuth";
import ApiError from "../Utils/ApiError";
import asyncHandler from "../Utils/asyncHandler";
import { requireUser } from "../Utils/currentUser";
import { signToken } from "../Utils/generateToken";
import { verifyGoogleCredential } from "../Utils/googleIdentity";
import { mailEnabled, sendVerificationCode } from "../Utils/mailer";
import { initialsFrom, publicUser } from "../Utils/presenters";
import {
  CODE_LENGTH,
  MAX_ATTEMPTS,
  expiryFromNow,
  generateCode,
  hashCode,
  matchesCode,
  resendCooldown,
} from "../Utils/verification";
import { resolveCountry } from "../config/countries";
import { env } from "../config/env";
import { disconnectUser } from "../config/realtime";
import type { PendingVerification } from "../types/index";

export const SALT_ROUNDS = 12;

const DUMMY_HASH = bcrypt.hashSync("chatlive-timing-equalizer", SALT_ROUNDS);

const BAD_CREDENTIALS =
  "Incorrect email address or password. If your account was created with Google, use “Continue with Google”.";

async function issueVerificationCode(user: UserDocument): Promise<boolean> {
  const code = generateCode();
  user.verification = {
    codeHash: await hashCode(code),
    expiresAt: expiryFromNow(),
    sentAt: new Date(),
    attempts: 0,
  };
  await user.save();

  return sendVerificationCode({
    to: user.email,
    name: user.name,
    code,
    minutes: env.VERIFICATION_TTL_MINUTES,
  });
}

function pendingPayload(email: string, delivered: boolean): PendingVerification {
  return {
    pendingVerification: true,
    email,
    delivered,
    codeLength: CODE_LENGTH,
    expiresInMinutes: env.VERIFICATION_TTL_MINUTES,
    resendInSeconds: env.VERIFICATION_RESEND_SECONDS,
  };
}

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, country } = req.body;

  const resolved = resolveCountry(country);
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const existent = await User.findOne({ email }).select("+verification");
  if (existent) {
    if (existent.emailVerified || existent.googleId) {
      throw ApiError.conflict("An account already exists with this email address.", "email");
    }

    existent.name = name;
    existent.password = hashed;
    existent.initials = initialsFrom(name);
    existent.country = resolved.name;
    existent.flag = resolved.code;
    existent.language = resolved.language;

    const wait = resendCooldown(existent.verification?.sentAt);
    if (wait > 0 && existent.verification) {
      await existent.save();
      res.status(200).json({
        message: "A confirmation code has already been sent to you.",
        ...pendingPayload(existent.email, mailEnabled),
        resendInSeconds: wait,
      });
      return;
    }

    const resent = await issueVerificationCode(existent);
    res.status(200).json({
      message: "A new confirmation code has been sent to you.",
      ...pendingPayload(existent.email, resent),
    });
    return;
  }

  const user = await User.create({
    name,
    email,
    password: hashed,
    initials: initialsFrom(name),
    country: resolved.name,
    flag: resolved.code,
    language: resolved.language,
    emailVerified: false,
    presence: "offline",
    lastSeenAt: new Date(),
  });

  const delivered = await issueVerificationCode(user);

  res.status(201).json({
    message: "Account created. Please confirm your email address.",
    ...pendingPayload(user.email, delivered),
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  const user = await User.findOne({ email }).select("+verification");
  if (!user) {
    throw ApiError.notFound("No pending sign-up for this address.", "email");
  }
  if (user.emailVerified) {
    throw ApiError.conflict(
      "This address is already confirmed. You can sign in.",
      "email",
    ).withCode("ALREADY_VERIFIED");
  }

  const pending = user.verification;
  if (!pending) {
    throw ApiError.badRequest("No active code. Request a new one.", "code").withCode(
      "CODE_EXPIRED",
    );
  }
  if (pending.expiresAt.getTime() < Date.now()) {
    user.verification = undefined;
    await user.save();
    throw ApiError.badRequest("This code has expired. Request a new one.", "code").withCode(
      "CODE_EXPIRED",
    );
  }

  if (pending.attempts >= MAX_ATTEMPTS) {
    user.verification = undefined;
    await user.save();
    throw ApiError.badRequest(
      "Too many attempts on this code. Request a new one.",
      "code",
    ).withCode("CODE_EXPIRED");
  }

  if (!(await matchesCode(code, pending.codeHash))) {
    pending.attempts += 1;
    user.markModified("verification");
    await user.save();
    const left = MAX_ATTEMPTS - pending.attempts;
    throw ApiError.badRequest(
      left > 0
        ? `Incorrect code. You have ${left} attempt${left > 1 ? "s" : ""} left.`
        : "Incorrect code. Request a new code.",
      "code",
    );
  }

  user.emailVerified = true;
  user.verification = undefined;
  user.lastSeenAt = new Date();
  await user.save();

  res.status(200).json({
    message: "Address confirmed. Welcome to ChatLive!",
    token: signToken(user._id, user.role, user.tokenVersion),
    user: publicUser(user),
  });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email }).select("+verification");
  if (!user) {
    throw ApiError.notFound("No pending sign-up for this address.", "email");
  }
  if (user.emailVerified) {
    throw ApiError.conflict(
      "This address is already confirmed. You can sign in.",
      "email",
    ).withCode("ALREADY_VERIFIED");
  }

  const wait = resendCooldown(user.verification?.sentAt);
  if (wait > 0) {
    throw ApiError.badRequest(
      `A code was just sent. Please wait ${wait} second${wait > 1 ? "s" : ""}.`,
      "code",
    )
      .withCode("TOO_SOON")
      .withRetryAfter(wait);
  }

  const delivered = await issueVerificationCode(user);

  res.status(200).json({
    message: delivered
      ? "A new code has just been sent to you."
      : "Sending the email failed. Try again in a moment.",
    ...pendingPayload(user.email, delivered),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  const matches = await bcrypt.compare(password, user?.password || DUMMY_HASH);
  if (!user || !user.password || !matches) {
    throw ApiError.unauthorized(BAD_CREDENTIALS, "password");
  }

  if (user.emailVerified === false) {
    throw ApiError.forbidden(
      "Please confirm your email address first: a code has been sent to you.",
      "email",
    ).withCode("EMAIL_NOT_VERIFIED");
  }

  // Presence stays whatever the realtime layer last set. Holding a token is
  // not being connected: only the socket knows, and only it can tell when the
  // user goes away again.
  user.lastSeenAt = new Date();
  await user.save();

  res.status(200).json({
    message: "Signed in successfully",
    token: signToken(user._id, user.role, user.tokenVersion),
    user: publicUser(user),
  });
});

export const googleAuth = asyncHandler(async (req, res) => {
  const { credential, country } = req.body;

  const profile = await verifyGoogleCredential(credential);

  let user = await User.findOne({ googleId: profile.googleId });
  let created = false;

  if (!user) {
    user = await User.findOne({ email: profile.email });
    if (user) {
      if (user.emailVerified === false) {
        user.set("password", undefined);
        user.provider = "google";
        user.tokenVersion = (user.tokenVersion ?? 0) + 1;
      }
      user.googleId = profile.googleId;
      if (profile.picture) user.avatar = profile.picture;
    } else {
      const resolved = resolveCountry(country);
      const name = profile.name.slice(0, 60) || profile.email.split("@")[0];
      user = new User({
        name,
        email: profile.email,
        googleId: profile.googleId,
        avatar: profile.picture ?? undefined,
        provider: "google",
        initials: initialsFrom(name),
        country: resolved.name,
        flag: resolved.code,
        language: resolved.language,
      });
      created = true;
    }
  } else if (profile.picture && user.avatar !== profile.picture) {
    user.avatar = profile.picture;
  }

  user.emailVerified = true;
  user.set("verification", undefined);
  user.lastSeenAt = new Date();
  await user.save();

  res.status(created ? 201 : 200).json({
    message: created ? "Account created with Google" : "Signed in successfully",
    created,
    token: signToken(user._id, user.role, user.tokenVersion),
    user: publicUser(user),
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ user: publicUser(requireUser(req)) });
});

export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(requireUser(req)._id, {
    $set: { presence: "offline", lastSeenAt: new Date() },
  });
  res.status(200).json({ message: "Signed out successfully" });
});

export const logoutAll = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(requireUser(req)._id, {
    $set: { presence: "offline", lastSeenAt: new Date() },
    $inc: { tokenVersion: 1 },
  });
  disconnectUser(requireUser(req)._id);
  res.status(200).json({ message: "All your sessions have been closed" });
});
