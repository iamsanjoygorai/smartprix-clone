import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(100, "Name is too long"),

  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .transform((value) => value.toLowerCase()),

  mobile: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ""))
    .refine(
      (value) => value.length === 10,
      "Please enter a valid 10-digit mobile number",
    ),

  dateOfBirth: z
    .string()
    .trim()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Please enter a valid date of birth",
    ),

  gender: z
    .string()
    .trim()
    .min(1, "Please select a gender")
    .max(30, "Invalid gender"),
});

export type UpdateProfileInput = z.infer<
  typeof updateProfileSchema
>;

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Current password is required"),

    newPassword: z
      .string()
      .min(
        8,
        "New password must be at least 8 characters long",
      )
      .max(128, "New password is too long"),

    confirmPassword: z
      .string()
      .min(1, "Please confirm your new password"),
  })
  .refine(
    (data) =>
      data.newPassword === data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    },
  );

export type ChangePasswordInput = z.infer<
  typeof changePasswordSchema
>;