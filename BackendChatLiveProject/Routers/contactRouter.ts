import { Router } from "express";

import {
  createContactMessage,
  deleteContactMessage,
  getAllContactMessages,
  getContactMessageById,
  getContactSubjects,
  updateContactStatus,
} from "../Controllers/contactController";
import { isModerator } from "../Middlewares/adminMiddleware";
import { optionalAuth, protect } from "../Middlewares/authMiddleware";
import { formLimiter } from "../Middlewares/security";
import { validateContact, validateObjectId } from "../Middlewares/validate";

const contactRouter = Router();

contactRouter.get("/subjects", getContactSubjects);

contactRouter.post("/", formLimiter, optionalAuth, validateContact, createContactMessage);

contactRouter.get("/", protect, isModerator, getAllContactMessages);
contactRouter.get("/:id", protect, isModerator, validateObjectId(), getContactMessageById);
contactRouter.put("/:id/status", protect, isModerator, validateObjectId(), updateContactStatus);
contactRouter.delete("/:id", protect, isModerator, validateObjectId(), deleteContactMessage);

export default contactRouter;
