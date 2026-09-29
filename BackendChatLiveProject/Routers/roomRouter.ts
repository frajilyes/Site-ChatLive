import { Router } from "express";

import { getRoomMessages, sendMessage } from "../Controllers/messageController";
import {
  addMember,
  createRoom,
  deleteRoom,
  discoverRooms,
  getMyRooms,
  getRoomById,
  getRoomMembers,
  joinRoom,
  leaveRoom,
  markRoomRead,
  removeMember,
  setMemberRole,
  updateRoom,
} from "../Controllers/roomController";
import { protect } from "../Middlewares/authMiddleware";
import { validateMessage, validateObjectId, validateRoom } from "../Middlewares/validate";

const roomRouter = Router();

roomRouter.use(protect);

roomRouter.get("/", getMyRooms);
roomRouter.get("/discover", discoverRooms);
roomRouter.post("/", validateRoom, createRoom);

roomRouter.get("/:id", validateObjectId(), getRoomById);
roomRouter.put("/:id", validateObjectId(), validateRoom, updateRoom);
roomRouter.delete("/:id", validateObjectId(), deleteRoom);

roomRouter.get("/:id/members", validateObjectId(), getRoomMembers);
roomRouter.post("/:id/members", validateObjectId(), addMember);
roomRouter.delete(
  "/:id/members/:userId",
  validateObjectId(),
  validateObjectId("userId"),
  removeMember,
);
roomRouter.put(
  "/:id/members/:userId/role",
  validateObjectId(),
  validateObjectId("userId"),
  setMemberRole,
);

roomRouter.post("/:id/join", validateObjectId(), joinRoom);
roomRouter.delete("/:id/leave", validateObjectId(), leaveRoom);
roomRouter.post("/:id/read", validateObjectId(), markRoomRead);

roomRouter.get("/:roomId/messages", validateObjectId("roomId"), getRoomMessages);
roomRouter.post("/:roomId/messages", validateObjectId("roomId"), validateMessage, sendMessage);

export default roomRouter;
