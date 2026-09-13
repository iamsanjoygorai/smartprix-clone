import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "./env";

export interface JwtPayload {
  userId: string;
  role: string;
  sessionId?: string;
}

export const generateToken = (
  payload: JwtPayload,
) => {
  const options: SignOptions = {
    expiresIn:
      env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign(
    payload,
    env.JWT_SECRET,
    options,
  );
};

export const verifyToken = (
  token: string,
) => {
  return jwt.verify(
    token,
    env.JWT_SECRET,
  );
};