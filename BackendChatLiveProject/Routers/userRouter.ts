import { Router } from "express";

import {
  changePassword,
  deleteUserById,
  getAllUsers,
  getCountries,
  getProfile,
  getUserById,
  searchUsers,
  updatePresence,
  updateProfile,
  updateUserRole,
} from "../Controllers/userController";
import { isAdmin } from "../Middlewares/adminMiddleware";
import { protect } from "../Middlewares/authMiddleware";
import { loginIpLimiter } from "../Middlewares/security";
import {
  validateChangePassword,
  validateObjectId,
  validateUpdateProfile,
} from "../Middlewares/validate";

const userRouter = Router();

userRouter.get("/countries", getCountries);

userRouter.use(protect);

userRouter.get("/profile", getProfile);
userRouter.put("/profile", validateUpdateProfile, updateProfile);
userRouter.put("/password", loginIpLimiter, validateChangePassword, changePassword);
userRouter.put("/presence", updatePresence);
userRouter.get("/search", searchUsers);

userRouter.get("/all", isAdmin, getAllUsers);
userRouter.get("/:id", isAdmin, validateObjectId(), getUserById);
userRouter.put("/:id/role", isAdmin, validateObjectId(), updateUserRole);
userRouter.delete("/:id", isAdmin, validateObjectId(), deleteUserById);

export default userRouter;
