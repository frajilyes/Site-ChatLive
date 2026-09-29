import type { RequestHandler } from "express";
import mongoose from "mongoose";

import { CONTACT_SUBJECTS } from "../Models/contactMessage";
import ApiError from "../Utils/ApiError";
import { CODE_LENGTH } from "../Utils/verification";
import { isKnownCountry } from "../config/countries";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface TextRule {
  field: string;
  min?: number;
  max?: number;
  message: string;
}

const asString = (value: unknown): string => (typeof value === "string" ? value : "");

function requireText(value: unknown, rule: TextRule): string {
  const { field, min = 1, max = Infinity, message } = rule;
  const text = asString(value).trim();
  if (text.length < min || text.length > max) {
    throw ApiError.badRequest(message, field);
  }
  return text;
}

function requireEmail(value: unknown, field = "email"): string {
  const email = asString(value).trim().toLowerCase();
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw ApiError.badRequest("This email address does not look valid.", field);
  }
  return email;
}

function requirePassword(value: unknown, field = "password"): string {
  const password = asString(value);
  if (password.length < 8) {
    throw ApiError.badRequest("The password must be at least 8 characters long.", field);
  }
  if (password.length > 128) {
    throw ApiError.badRequest("The password cannot exceed 128 characters.", field);
  }
  return password;
}

function initialsOfName(name: unknown): string {
  const parts = asString(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const validateRegister: RequestHandler = (req, res, next) => {
  try {
    req.body.name = requireText(req.body.name, {
      field: "name",
      min: 2,
      max: 60,
      message: "Please enter your name (2 characters minimum).",
    });
    req.body.email = requireEmail(req.body.email);
    req.body.password = requirePassword(req.body.password);

    if (req.body.country !== undefined && !isKnownCountry(req.body.country)) {
      throw ApiError.badRequest("This country is not in the list provided.", "country");
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const validateLogin: RequestHandler = (req, res, next) => {
  try {
    req.body.email = requireEmail(req.body.email);
    req.body.password = requirePassword(req.body.password);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateVerifyCode: RequestHandler = (req, res, next) => {
  try {
    req.body.email = requireEmail(req.body.email);
    const code = asString(req.body.code).replace(/\D/g, "");
    if (code.length !== CODE_LENGTH) {
      throw ApiError.badRequest(
        `The confirmation code has ${CODE_LENGTH} digits.`,
        "code",
      );
    }
    req.body.code = code;
    next();
  } catch (error) {
    next(error);
  }
};

export const validateResendCode: RequestHandler = (req, res, next) => {
  try {
    req.body.email = requireEmail(req.body.email);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateGoogleAuth: RequestHandler = (req, res, next) => {
  try {
    const credential = asString(req.body.credential).trim();
    if (!credential || credential.length > 4096) {
      throw ApiError.badRequest("Google's response is empty. Try signing in with Google again.");
    }
    req.body.credential = credential;

    if (req.body.country !== undefined && !isKnownCountry(req.body.country)) {
      throw ApiError.badRequest("This country is not in the list provided.", "country");
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const validateChangePassword: RequestHandler = (req, res, next) => {
  try {
    const current = asString(req.body.currentPassword);
    if (!current || current.length > 128) {
      throw ApiError.badRequest("Please enter your current password.", "currentPassword");
    }
    req.body.newPassword = requirePassword(req.body.newPassword, "newPassword");
    if (req.body.newPassword === req.body.currentPassword) {
      throw ApiError.badRequest(
        "The new password must be different from the old one.",
        "newPassword",
      );
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const validateUpdateProfile: RequestHandler = (req, res, next) => {
  try {
    if (req.body.name !== undefined) {
      req.body.name = requireText(req.body.name, {
        field: "name",
        min: 2,
        max: 60,
        message: "Please enter your name (2 characters minimum).",
      });
    }
    if (req.body.country !== undefined && !isKnownCountry(req.body.country)) {
      throw ApiError.badRequest("This country is not in the list provided.", "country");
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const validateRoom: RequestHandler = (req, res, next) => {
  try {
    req.body.name = requireText(req.body.name, {
      field: "name",
      min: 2,
      max: 60,
      message: "The room name must be between 2 and 60 characters.",
    });
    req.body.topic = requireText(req.body.topic, {
      field: "topic",
      min: 2,
      max: 140,
      message: "The room topic must be between 2 and 140 characters.",
    });

    const emoji = asString(req.body.emoji).trim();
    req.body.emoji = (emoji || initialsOfName(req.body.name)).slice(0, 2).toUpperCase();

    delete req.body.showcase;

    if (req.body.visibility !== undefined && !["public", "private"].includes(req.body.visibility)) {
      throw ApiError.badRequest("Visibility must be 'public' or 'private'.", "visibility");
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const validateMessage: RequestHandler = (req, res, next) => {
  try {
    req.body.body = requireText(req.body.body, {
      field: "body",
      min: 1,
      max: 500,
      message: "A message must be between 1 and 500 characters.",
    });
    next();
  } catch (error) {
    next(error);
  }
};

export const validateCommunity: RequestHandler = (req, res, next) => {
  try {
    req.body.name = requireText(req.body.name, {
      field: "name",
      min: 2,
      max: 60,
      message: "The community name must be between 2 and 60 characters.",
    });
    req.body.topic = requireText(req.body.topic, {
      field: "topic",
      min: 2,
      max: 40,
      message: "The category must be between 2 and 40 characters.",
    });
    req.body.description = requireText(req.body.description, {
      field: "description",
      min: 12,
      max: 400,
      message: "The description must be between 12 and 400 characters.",
    });

    const emoji = asString(req.body.emoji).trim();
    req.body.emoji = (emoji || initialsOfName(req.body.name)).slice(0, 2).toUpperCase();

    if (req.body.languages !== undefined) {
      if (!Array.isArray(req.body.languages)) {
        throw ApiError.badRequest("Languages must be an array of names.", "languages");
      }
      // Languages are spoken-language names shown as-is on the community card
      // ("French", "Portuguese"), not codes: neither upper-casing them nor
      // clipping them to five characters would survive the trip to the page.
      const seen = new Set<string>();
      req.body.languages = req.body.languages
        .slice(0, 20)
        .map((language: unknown) => asString(language).trim().replace(/\s+/g, " ").slice(0, 40))
        .filter((language: string) => {
          if (!language) return false;
          const key = language.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
    }

    if (req.body.featured !== undefined) {
      req.body.featured = req.body.featured === true;
    }

    for (const field of ["members", "online"]) {
      delete req.body[field];
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const validateContact: RequestHandler = (req, res, next) => {
  try {
    req.body.name = requireText(req.body.name, {
      field: "name",
      min: 2,
      max: 80,
      message: "Please enter your name (2 characters minimum).",
    });
    req.body.email = requireEmail(req.body.email);
    req.body.message = requireText(req.body.message, {
      field: "message",
      min: 12,
      max: 4000,
      message: "Your message is a bit short (12 characters minimum).",
    });

    if (req.body.subject !== undefined && !CONTACT_SUBJECTS.includes(req.body.subject)) {
      throw ApiError.badRequest("This subject is not in the list provided.", "subject");
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const validateObjectId =
  (param = "id"): RequestHandler =>
  (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params[param])) {
      return next(ApiError.badRequest("This identifier is not valid.", param));
    }
    next();
  };
