CREATE TABLE IF NOT EXISTS "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "path" TEXT,
    "referrer" TEXT,
    "metadata" JSONB,
    "deviceType" TEXT,
    "browser" TEXT,
    "operatingSystem" TEXT,
    "ipAddress" TEXT,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "timezone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AnalyticsEvent_eventType_createdAt_idx"
ON "AnalyticsEvent"("eventType", "createdAt");

CREATE INDEX IF NOT EXISTS "AnalyticsEvent_userId_createdAt_idx"
ON "AnalyticsEvent"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "AnalyticsEvent_sessionId_createdAt_idx"
ON "AnalyticsEvent"("sessionId", "createdAt");

CREATE INDEX IF NOT EXISTS "AnalyticsEvent_entityType_entityId_createdAt_idx"
ON "AnalyticsEvent"("entityType", "entityId", "createdAt");

CREATE INDEX IF NOT EXISTS "AnalyticsEvent_createdAt_idx"
ON "AnalyticsEvent"("createdAt");

ALTER TABLE "AnalyticsEvent"
ADD CONSTRAINT "AnalyticsEvent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AnalyticsEvent"
ADD CONSTRAINT "AnalyticsEvent_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "UserSession"("id")
ON DELETE SET NULL ON UPDATE CASCADE;