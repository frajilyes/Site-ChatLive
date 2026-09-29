import "../config/env";

import bcrypt from "bcrypt";
import mongoose from "mongoose";

import { ensureSiteContent } from "../Controllers/siteController";
import Community from "../Models/community";
import Message from "../Models/message";
import Room from "../Models/room";
import SiteContent from "../Models/siteContent";
import SiteSettings from "../Models/siteSettings";
import Testimonial from "../Models/testimonial";
import User from "../Models/userAuth";
import { initialsFrom } from "../Utils/presenters";
import { resolveCountry } from "../config/countries";
import connectDB from "../config/db";

const ADMIN_PASSWORD = "chatlive2025";

const ADMIN_ACCOUNT = {
  name: "Administrator",
  email: "demo@chatlive.io",
  country: "FR",
} as const;

async function seed(): Promise<void> {
  await connectAndClean();

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const country = resolveCountry(ADMIN_ACCOUNT.country);

  await User.create({
    name: ADMIN_ACCOUNT.name,
    email: ADMIN_ACCOUNT.email,
    password: passwordHash,
    initials: initialsFrom(ADMIN_ACCOUNT.name),
    country: country.name,
    flag: country.code,
    language: country.language,
    presence: "offline",
    lastSeenAt: new Date(),
    role: "admin",
    emailVerified: true,
  });
  console.log("Compte administrateur cree");

  await ensureSiteContent();
  const contentCount = await SiteContent.countDocuments();
  console.log(`${contentCount} entrees de contenu ecrites`);

  console.log("\nTermine. Compte administrateur :");
  console.log(`  e-mail : ${ADMIN_ACCOUNT.email}`);
  console.log(`  mot de passe : ${ADMIN_PASSWORD}`);

  await mongoose.connection.close();
}

async function connectAndClean(): Promise<void> {
  await connectDB();

  console.log("Nettoyage des collections...");
  await Promise.all([
    User.deleteMany({}),
    Room.deleteMany({}),
    Message.deleteMany({}),
    Community.deleteMany({}),
    Testimonial.deleteMany({}),
    SiteContent.deleteMany({}),
    SiteSettings.deleteMany({}),
  ]);
}

seed().catch(async (error) => {
  console.error("Peuplement interrompu :", error);
  await mongoose.connection.close();
  process.exit(1);
});
