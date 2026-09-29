import "../config/env";

import mongoose from "mongoose";

import Community from "../Models/community";
import Message from "../Models/message";
import Room from "../Models/room";
import SiteContent from "../Models/siteContent";
import Testimonial from "../Models/testimonial";
import User from "../Models/userAuth";
import connectDB from "../config/db";
import type { ContentSection } from "../types/index";

const DEMO_ADMIN_EMAIL = "demo@chatlive.io";

const FAKE_MEMBER_EMAILS = [
  "mei@chatlive.io",
  "lucas@chatlive.io",
  "amina@chatlive.io",
  "jonas@chatlive.io",
  "sofia@chatlive.io",
  "aya@chatlive.io",
];

const FAKE_ROOMS = ["Tour du monde", "Nuit blanche", "Recettes partagees", "Code & cafe"];

const FAKE_COMMUNITIES = [
  "Globe Talk",
  "Night Owls",
  "Dev Rendez-vous",
  "Cuisines du Monde",
  "Sunrise Runners",
  "Pixel & Palette",
  "Study Together",
  "Cine Club International",
  "Voyageurs Solidaires",
];

const FAKE_SECTIONS: ContentSection[] = ["team", "office", "plan", "milestone", "contactChannel", "socialLink"];

async function purge(): Promise<void> {
  await connectDB();

  const fakeUsers = await User.find({ email: { $in: FAKE_MEMBER_EMAILS } }).select("_id").lean();
  const fakeIds = fakeUsers.map((user) => user._id);

  const admin = await User.findOne({ email: DEMO_ADMIN_EMAIL }).select("_id").lean();
  const demoIds = admin ? [...fakeIds, admin._id] : fakeIds;

  const fakeRooms = admin
    ? await Room.find({ name: { $in: FAKE_ROOMS }, owner: admin._id }).select("_id").lean()
    : [];
  const roomIds = fakeRooms.map((room) => room._id);

  const [messages, testimonials, rooms, communities, content, users] = await Promise.all([
    Message.deleteMany({ $or: [{ author: { $in: fakeIds } }, { room: { $in: roomIds } }] }),
    Testimonial.deleteMany({ author: { $in: demoIds } }),
    Room.deleteMany({ _id: { $in: roomIds } }),
    Community.deleteMany({ name: { $in: FAKE_COMMUNITIES } }),
    SiteContent.deleteMany({ section: { $in: FAKE_SECTIONS } }),
    User.deleteMany({ _id: { $in: fakeIds } }),
  ]);

  await Room.updateMany({}, { $pull: { members: { user: { $in: fakeIds } } } });

  if (admin) {
    await User.updateOne(
      { _id: admin._id },
      { $set: { name: "Administrator", initials: "AD" } },
    );
  }

  console.log(`${users.deletedCount} faux membres supprimes`);
  console.log(`${messages.deletedCount} messages fictifs supprimes`);
  console.log(`${testimonials.deletedCount} faux temoignages supprimes`);
  console.log(`${rooms.deletedCount} salons fictifs supprimes`);
  console.log(`${communities.deletedCount} communautes fictives supprimees`);
  console.log(`${content.deletedCount} entrees de contenu fictives supprimees`);

  await mongoose.connection.close();
}

purge().catch(async (error) => {
  console.error("Nettoyage interrompu :", error);
  await mongoose.connection.close();
  process.exit(1);
});
