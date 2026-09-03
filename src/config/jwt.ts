import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "./env";

export const generateToken = (payload: {
  userId: string;
  role: string;
}) => {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET);
};