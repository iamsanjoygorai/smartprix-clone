import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "./env";

export interface JwtPayload {
  userId: string;
  role: string;
  sessionId?: string;
}

export const generateToken = (payload: JwtPayload) => {
  let expiresIn = env.JWT_USER_EXPIRES_IN;

  if (payload.role === "ADMIN") {
    expiresIn = env.JWT_ADMIN_EXPIRES_IN;
  }

  if (payload.role === "SUPER_ADMIN") {
    expiresIn = env.JWT_SUPER_ADMIN_EXPIRES_IN;
  }

  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET);
};