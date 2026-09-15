import type { Request } from "express";

export function getAuditRequestContext(req: Request) {
  const user = (req as any).user;

  const userId =
    typeof user === "string"
      ? user
      : user?.userId ?? user?.id ?? null;

  const sessionId =
    user && typeof user === "object" && "sessionId" in user
      ? user.sessionId ?? null
      : null;

const forwardedFor = req.headers["x-forwarded-for"];

const ipAddress =
  (typeof forwardedFor === "string"
    ? forwardedFor.split(",")[0]?.trim()
    : Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : undefined) ||
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
