-- CreateTable
CREATE TABLE "HistoryEvent" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "targetUserId" TEXT,
    "category" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "operation" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER,
    "changes" JSONB,
    "metadata" JSONB,
    "sessionId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "timezone" TEXT,
    "parentEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorySnapshot" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "eventId" TEXT,
    "createdByUserId" TEXT,
    "checksum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HistoryEvent_actorUserId_createdAt_idx"
ON "HistoryEvent"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "HistoryEvent_targetUserId_createdAt_idx"
ON "HistoryEvent"("targetUserId", "createdAt");

-- CreateIndex
CREATE INDEX "HistoryEvent_entityType_entityId_createdAt_idx"
ON "HistoryEvent"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "HistoryEvent_entityType_entityId_version_idx"
ON "HistoryEvent"("entityType", "entityId", "version");

-- CreateIndex
CREATE INDEX "HistoryEvent_eventType_createdAt_idx"
ON "HistoryEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "HistoryEvent_category_createdAt_idx"
ON "HistoryEvent"("category", "createdAt");

-- CreateIndex
CREATE INDEX "HistoryEvent_sessionId_createdAt_idx"
ON "HistoryEvent"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "HistoryEvent_parentEventId_idx"
ON "HistoryEvent"("parentEventId");

-- CreateIndex
CREATE INDEX "HistoryEvent_createdAt_idx"
ON "HistoryEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HistorySnapshot_entityType_entityId_version_key"
ON "HistorySnapshot"("entityType", "entityId", "version");

-- CreateIndex
CREATE INDEX "HistorySnapshot_entityType_entityId_createdAt_idx"
ON "HistorySnapshot"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "HistorySnapshot_entityType_entityId_version_idx"
ON "HistorySnapshot"("entityType", "entityId", "version");

-- CreateIndex
CREATE INDEX "HistorySnapshot_createdByUserId_createdAt_idx"
ON "HistorySnapshot"("createdByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "HistorySnapshot_eventId_idx"
ON "HistorySnapshot"("eventId");

-- AddForeignKey
ALTER TABLE "HistoryEvent"
ADD CONSTRAINT "HistoryEvent_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoryEvent"
ADD CONSTRAINT "HistoryEvent_targetUserId_fkey"
FOREIGN KEY ("targetUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoryEvent"
ADD CONSTRAINT "HistoryEvent_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "UserSession"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoryEvent"
ADD CONSTRAINT "HistoryEvent_parentEventId_fkey"
FOREIGN KEY ("parentEventId") REFERENCES "HistoryEvent"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorySnapshot"
ADD CONSTRAINT "HistorySnapshot_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
