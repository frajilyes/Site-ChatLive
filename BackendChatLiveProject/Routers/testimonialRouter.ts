import { Router } from "express";

import {
  deleteTestimonial,
  getAllTestimonials,
  getMyTestimonial,
  getTestimonials,
  saveTestimonial,
  updateTestimonialStatus,
} from "../Controllers/testimonialController";
import { isModerator } from "../Middlewares/adminMiddleware";
import { protect } from "../Middlewares/authMiddleware";
import { formLimiter } from "../Middlewares/security";
import { validateObjectId } from "../Middlewares/validate";

const testimonialRouter = Router();

testimonialRouter.get("/", getTestimonials);

testimonialRouter.get("/all", protect, isModerator, getAllTestimonials);
testimonialRouter.get("/mine", protect, getMyTestimonial);
testimonialRouter.post("/", protect, formLimiter, saveTestimonial);

testimonialRouter.put(
  "/:id/status",
  protect,
  isModerator,
  validateObjectId(),
  updateTestimonialStatus,
);
testimonialRouter.delete("/:id", protect, isModerator, validateObjectId(), deleteTestimonial);

export default testimonialRouter;
