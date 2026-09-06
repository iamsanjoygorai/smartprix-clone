import { Request, Response } from "express";

import { loginSchema } from "../validators/auth.validator";
import { loginUser, registerUser } from "../services/auth.service";
import { registerSchema } from "../validators/register.validator";
import prisma from "../db/prisma";

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

  console.log("LOGIN ERROR MESSAGE:", message);

  if (
    message === "Invalid email or password" ||
    message === "Account is disabled"
  ) {
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


export const getMe = async (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.user || typeof req.user === "string") {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const userId = req.user.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        userPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (user.isDisabled) {
      res.status(401).json({
        success: false,
        message: "Account is disabled",
      });
      return;
    }

    // Start with role permissions
    const effectivePermissions = new Set<string>(
      user.userRoles.flatMap((userRole) =>
        userRole.role.permissions.map(
          (rolePermission) =>
            rolePermission.permission.name,
        ),
      ),
    );

    // SUPER_ADMIN gets every permission
    if (user.role === "SUPER_ADMIN") {
      const allPermissions =
        await prisma.permission.findMany({
          select: {
            name: true,
          },
        });

      for (const permission of allPermissions) {
        effectivePermissions.add(permission.name);
      }
    } else {
      // Apply individual user overrides
      for (const override of user.userPermissions) {
        if (override.allowed) {
          effectivePermissions.add(
            override.permission.name,
          );
        } else {
          effectivePermissions.delete(
            override.permission.name,
          );
        }
      }
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        permissions: Array.from(
          effectivePermissions,
        ),
      },
    });
  } catch (error) {
    console.error(
      "Failed to fetch current user:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch current user",
    });
  }
};