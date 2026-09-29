import { Router } from "express";

import {
  createCommunity,
  deleteCommunity,
  getAllCommunities,
  getCommunityById,
  getTopics,
  updateCommunity,
} from "../Controllers/communityController";
import { isModerator } from "../Middlewares/adminMiddleware";
import { protect } from "../Middlewares/authMiddleware";
import { validateCommunity, validateObjectId } from "../Middlewares/validate";

const communityRouter = Router();

communityRouter.get("/", getAllCommunities);
communityRouter.get("/topics", getTopics);
communityRouter.get("/:id", validateObjectId(), getCommunityById);

communityRouter.post("/", protect, isModerator, validateCommunity, createCommunity);
communityRouter.put(
  "/:id",
  protect,
  isModerator,
  validateObjectId(),
  validateCommunity,
  updateCommunity,
);
communityRouter.delete("/:id", protect, isModerator, validateObjectId(), deleteCommunity);

export default communityRouter;
