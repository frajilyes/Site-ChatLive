import { Router } from "express";

import { deleteMessage, updateMessage } from "../Controllers/messageController";
import { protect } from "../Middlewares/authMiddleware";
import { validateMessage, validateObjectId } from "../Middlewares/validate";

const messageRouter = Router();

messageRouter.use(protect);

messageRouter.put("/:id", validateObjectId(), validateMessage, updateMessage);
messageRouter.delete("/:id", validateObjectId(), deleteMessage);

export default messageRouter;
