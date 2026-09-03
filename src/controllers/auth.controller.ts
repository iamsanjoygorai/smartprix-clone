import { Request, Response } from "express";

import { loginSchema } from "../validators/auth.validator";
import { loginUser, registerUser } from "../services/auth.service";
import { registerSchema } from "../validators/register.validator";

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

export const register = async (
  req: Request,
  res: Response,
) => {
  try {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Invalid registration data",
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    const data = await registerUser(result.data);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data,
    });
  } catch (error) {
    console.error("Registration failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Registration failed";

    if (message === "Email already registered") {
      res.status(409).json({
        success: false,
        message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};