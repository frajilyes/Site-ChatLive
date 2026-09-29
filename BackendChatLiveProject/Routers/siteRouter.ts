import { Router } from "express";

import {
  createContentEntry,
  deleteContentEntry,
  getAllContentEntries,
  getContentSection,
  getSiteBundle,
  reorderContentSection,
  updateContentEntry,
  updateSiteSettings,
} from "../Controllers/siteController";
import { isAdmin } from "../Middlewares/adminMiddleware";
import { protect } from "../Middlewares/authMiddleware";

const siteRouter = Router();

siteRouter.get("/", getSiteBundle);
siteRouter.get("/content/:section", getContentSection);

siteRouter.get("/content", protect, isAdmin, getAllContentEntries);

siteRouter.put("/", protect, isAdmin, updateSiteSettings);
siteRouter.post("/content/:section", protect, isAdmin, createContentEntry);
siteRouter.put("/content/:section/reorder", protect, isAdmin, reorderContentSection);
siteRouter.put("/content/:section/:key", protect, isAdmin, updateContentEntry);
siteRouter.delete("/content/:section/:key", protect, isAdmin, deleteContentEntry);

export default siteRouter;
