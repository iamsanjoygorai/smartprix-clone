import type {
  HistoryCategory,
  HistoryEventType,
  HistoryOperation,
} from "./history.constants";

export interface HistoryChange {
  before: unknown;
  after: unknown;
}

export type HistoryChanges = Record<string, HistoryChange>;

export interface HistoryActorContext {
  actorUserId?: string | null;
  targetUserId?: string | null;

  sessionId?: string | null;

  ipAddress?: string | null;
  userAgent?: string | null;

  country?: string | null;
  state?: string | null;
  city?: string | null;
  timezone?: string | null;
}

export interface RecordHistoryInput extends HistoryActorContext {
  category: HistoryCategory;
  eventType: HistoryEventType;

  operation?: HistoryOperation | string | null;

  entityType?: string | null;
  entityId?: string | null;

  title: string;
  description?: string | null;

  version?: number | null;

  changes?: HistoryChanges | null;
  metadata?: Record<string, unknown> | null;

  parentEventId?: string | null;
}

export interface RecordChangeInput extends HistoryActorContext {
  category: HistoryCategory;
  eventType: HistoryEventType;

  operation?: HistoryOperation | string | null;

  entityType: string;
  entityId: string;

  title: string;
  description?: string | null;

  before: Record<string, unknown>;
  after: Record<string, unknown>;

  metadata?: Record<string, unknown> | null;

  parentEventId?: string | null;

  /**
   * Create a full snapshot after recording the change.
   */
  createSnapshot?: boolean;
}

export interface RecordSnapshotInput {
  entityType: string;
  entityId: string;

  data: Record<string, unknown>;

  eventId?: string | null;
  createdByUserId?: string | null;

  /**
   * Optional explicit version.
   * If omitted, the service calculates the next version.
   */
  version?: number;

  checksum?: string | null;
}

export interface HistoryTimelineOptions {
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  targetUserId?: string;

  category?: HistoryCategory | string;
  eventType?: HistoryEventType | string;
  operation?: string;
  search?: string;

  from?: Date;
  to?: Date;

  page?: number;
  limit?: number;
}

export interface HistoryDiff {
  version: number;

  eventId: string;

  entityType: string;
  entityId: string;

  title: string;

  changes: HistoryChanges;

  createdAt: Date;
}

export interface HistoryVersion {
  version: number;

  snapshot: Record<string, unknown> | null;

  event: {
    id: string;
    eventType: string;
    title: string;
    description: string | null;
    createdAt: Date;
  } | null;
}