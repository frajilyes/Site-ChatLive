import { Router } from "express";

import { getSubscribers, subscribe, unsubscribe } from "../Controllers/newsletterController";
import { isAdmin } from "../Middlewares/adminMiddleware";
import { optionalAuth, protect } from "../Middlewares/authMiddleware";
import { formLimiter } from "../Middlewares/security";

const newsletterRouter = Router();

newsletterRouter.post("/", formLimiter, optionalAuth, subscribe);
newsletterRouter.delete("/:email", protect, unsubscribe);
newsletterRouter.get("/", protect, isAdmin, getSubscribers);

export default newsletterRouter;
