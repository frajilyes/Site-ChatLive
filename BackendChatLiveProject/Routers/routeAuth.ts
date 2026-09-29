import { Router } from "express";

import {
  getMe,
  googleAuth,
  login,
  logout,
  logoutAll,
  registerUser,
  resendVerification,
  verifyEmail,
} from "../Controllers/userAuth";
import { protect } from "../Middlewares/authMiddleware";
import {
  loginAccountLimiter,
  loginIpLimiter,
  signupLimiter,
  verifyLimiter,
} from "../Middlewares/security";
import {
  validateGoogleAuth,
  validateLogin,
  validateRegister,
  validateResendCode,
  validateVerifyCode,
} from "../Middlewares/validate";

const authRouter = Router();

authRouter.post("/register", signupLimiter, validateRegister, registerUser);
authRouter.post("/verify", verifyLimiter, validateVerifyCode, verifyEmail);
authRouter.post("/verify/resend", signupLimiter, validateResendCode, resendVerification);
authRouter.post("/login", loginIpLimiter, validateLogin, loginAccountLimiter, login);
authRouter.post("/google", loginIpLimiter, validateGoogleAuth, googleAuth);
authRouter.get("/me", protect, getMe);
authRouter.post("/logout", protect, logout);
authRouter.post("/logout-all", protect, logoutAll);

export default authRouter;
