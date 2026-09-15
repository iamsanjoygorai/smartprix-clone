ALTER TABLE "HistoryEvent"
ADD COLUMN IF NOT EXISTS "entityType" TEXT,
ADD COLUMN IF NOT EXISTS "entityId" TEXT,
ADD COLUMN IF NOT EXISTS "version" INTEGER,
ADD COLUMN IF NOT EXISTS "changes" JSONB;

CREATE INDEX IF NOT EXISTS "HistoryEvent_entityType_entityId_createdAt_idx"
ON "HistoryEvent" ("entityType", "entityId", "createdAt");

CREATE INDEX IF NOT EXISTS "HistoryEvent_entityType_entityId_version_idx"
ON "HistoryEvent" ("entityType", "entityId", "version");