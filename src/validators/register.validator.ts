import { z } from "zod";

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters"),

    identifier: z
      .string()
      .trim()
      .min(
        1,
        "Email address or mobile number is required",
      ),

    password: z
      .string()
      .min(
        6,
        "Password must be at least 6 characters",
      ),

    firstName: z
      .string()
      .trim()
      .optional(),

    lastName: z
      .string()
      .trim()
      .optional(),

    dateOfBirth: z
      .string()
      .trim()
      .optional(),

    gender: z
      .string()
      .trim()
      .optional(),
  })
  .superRefine((data, ctx) => {
    const identifier = data.identifier.trim();

    const isEmail =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        identifier,
      );

    const digitsOnly =
      identifier.replace(/\D/g, "");

    const isMobile =
      /^\d{10}$/.test(digitsOnly) &&
      /^\d+$/.test(
        identifier.replace(/\s/g, ""),
      );

    if (!isEmail && !isMobile) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["identifier"],
        message:
          "Enter a valid email address or 10-digit mobile number",
      });
    }
  })
  .transform((data) => {
    const identifier = data.identifier.trim();

    const isEmail =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        identifier,
      );

    if (isEmail) {
      const email = identifier.toLowerCase();

      return {
        ...data,
        identifier: email,
        email,
        mobile: undefined,
      };
    }

    const mobile =
      identifier.replace(/\D/g, "");

    return {
      ...data,
      identifier: mobile,
      email: undefined,
      mobile,
    };
  });

export type RegisterInput =
  z.infer<typeof registerSchema>;
