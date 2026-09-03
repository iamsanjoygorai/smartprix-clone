import { Request, Response } from "express";

import { loginSchema } from "../validators/auth.validator";
import { loginUser } from "../services/auth.service";

export const login = async (
  req: Request,
  res: Response,
) => {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Invalid login data",
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    const data = await loginUser(result.data);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data,
    });
  } catch (error) {
    console.error("Login failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Login failed";

    if (message === "Invalid email or password") {
      res.status(401).json({
        success: false,
        message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};