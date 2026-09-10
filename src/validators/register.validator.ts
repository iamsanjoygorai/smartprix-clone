import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters"),

  email: z
    .string()
    .trim()
    .email("Valid email is required")
    .transform((value) => value.toLowerCase()),

  mobile: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Valid 10-digit mobile number is required"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;