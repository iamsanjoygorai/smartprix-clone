import type { Request } from "express";

export function getAuditRequestContext(req: Request) {
  const user = (req as any).user;

  const userId =
    typeof user === "string"
      ? user
      : user?.userId ?? user?.id ?? null;

  const sessionId =
    typeof user === "object"
      ? user?.sessionId ?? null
      : null;

  const forwardedFor =
    req.headers["x-forwarded-for"]
      ?.toString()
      .split(",")[0]
      .trim();

  const ipAddress =
    forwardedFor ||
    req.ip ||
    req.socket?.remoteAddress ||
    null;

  const userAgent =
    req.get("user-agent") || null;

  const timezone =
    req.get("x-timezone") ||
    (typeof req.body?.timezone === "string"
      ? req.body.timezone
      : null);

  return {
    userId,
    sessionId,
    ipAddress,
    userAgent,
    timezone,
  };
}