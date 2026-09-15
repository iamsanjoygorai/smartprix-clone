import type { JwtPayload } from "../config/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload | string;
    }
  }
}

export {};