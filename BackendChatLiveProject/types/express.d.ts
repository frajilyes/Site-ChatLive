import type { UserDocument } from "../Models/userAuth";

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument | null;
    }
  }
}

export {};
