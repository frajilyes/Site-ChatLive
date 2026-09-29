import "../config/env";

import mongoose from "mongoose";

import { ensureSiteContent } from "../Controllers/siteController";
import ContactMessage from "../Models/contactMessage";
import Message from "../Models/message";
import SiteContent from "../Models/siteContent";
import SiteSettings, { SETTINGS_SLUG } from "../Models/siteSettings";
import User from "../Models/userAuth";
import { COUNTRIES } from "../config/countries";
import connectDB from "../config/db";
import { DEFAULT_CONTENT, DEFAULT_SITE } from "../config/defaultContent";

const OLD_LANGUAGES: Record<string, string> = {
  Francais: "French",
  Arabe: "Arabic",
  Espagnol: "Spanish",
  Portugais: "Portuguese",
  Italien: "Italian",
  Allemand: "German",
  Anglais: "English",
  Turc: "Turkish",
  Coreen: "Korean",
  Japonais: "Japanese",
};

const OLD_SUBJECTS: Record<string, string> = {
  "Question generale": "General question",
  "Support technique": "Technical support",
  "Offre Communaute": "Community plan",
  Partenariat: "Partnership",
  Presse: "Press",
  Securite: "Security",
};

async function translate(): Promise<void> {
  await connectDB();

  let entries = 0;
  for (const entry of DEFAULT_CONTENT) {
    const result = await SiteContent.updateOne(
      { section: entry.section, key: entry.key },
      { $set: { data: entry.data } },
    );
    entries += result.modifiedCount;
  }
  console.log(`${entries} content entries translated`);

  await SiteSettings.updateOne(
    { slug: SETTINGS_SLUG },
    { $set: { tagline: DEFAULT_SITE.tagline, description: DEFAULT_SITE.description } },
  );
  console.log("Site tagline and description translated");

  await ensureSiteContent();

  let users = 0;
  for (const country of COUNTRIES) {
    const result = await User.updateMany(
      { flag: country.code },
      { $set: { country: country.name, language: country.language } },
      { runValidators: false },
    );
    users += result.modifiedCount;
  }
  console.log(`${users} accounts updated`);

  let messages = 0;
  for (const [from, to] of Object.entries(OLD_LANGUAGES)) {
    const result = await Message.updateMany({ language: from }, { $set: { language: to } });
    messages += result.modifiedCount;
  }
  console.log(`${messages} messages updated`);

  let contacts = 0;
  for (const [from, to] of Object.entries(OLD_SUBJECTS)) {
    const result = await ContactMessage.updateMany({ subject: from }, { $set: { subject: to } });
    contacts += result.modifiedCount;
  }
  console.log(`${contacts} contact messages updated`);

  await mongoose.connection.close();
  console.log("\nDone.");
}

translate().catch(async (error) => {
  console.error("Translation interrupted:", error);
  await mongoose.connection.close();
  process.exit(1);
});
