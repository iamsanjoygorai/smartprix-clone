import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(5000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  CLIENT_URL: z
    .string()
    .url()
    .default("http://localhost:3000"),

      FRONTEND_URL: z
    .string()
    .url()
    .default("http://localhost:3000"),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters"),

  JWT_EXPIRES_IN: z
    .string()
    .default("1d"),

  JWT_USER_EXPIRES_IN: z
    .string()
    .default("30d"),

  JWT_ADMIN_EXPIRES_IN: z
    .string()
    .default("7d"),

  JWT_SUPER_ADMIN_EXPIRES_IN: z
    .string()
    .default("1d"),

  SMTP_HOST: z
    .string()
    .default("smtp.gmail.com"),

  SMTP_PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(587),

  SMTP_USER: z
    .string()
    .min(1, "SMTP_USER is required"),

  SMTP_PASS: z
    .string()
    .min(1, "SMTP_PASS is required"),

  MAIL_FROM: z
    .string()
    .min(1, "MAIL_FROM is required"),

  /**
   * Price Alert Engine scheduler interval.
   *
   * Default: 5 minutes
   */
  PRICE_ALERT_INTERVAL_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(300_000),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:");

  console.error(
    parsedEnv.error.flatten().fieldErrors,
  );

  process.exit(1);
}

export const env = parsedEnv.data;