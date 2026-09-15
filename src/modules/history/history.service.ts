import { createHistoryChecksum, createHistoryDiff, hasHistoryChanges, sanitizeHistoryData } from "./history.utils";
import type {
  HistoryChanges,
  HistoryTimelineOptions,
  HistoryVersion,
  RecordChangeInput,
  RecordHistoryInput,
  RecordSnapshotInput,
} from "./history.types";

import prisma from "../../db/prisma";

import type { Prisma, PrismaClient } from "@prisma/client";

/* =========================================================
   TYPES
========================================================= */

type PrismaExecutor =
  | PrismaClient
  | Prisma.TransactionClient;

type HistoryRecord = Prisma.HistoryEventGetPayload<{}>;

/* =========================================================
   HELPERS
========================================================= */

function getNextVersion(
  executor: PrismaExecutor,
  entityType: string,
  entityId: string,
): Promise<number> {
  return executor.historyEvent
    .aggregate({
      where: {
        entityType,
        entityId,
        version: {
          not: null,
        },
      },
      _max: {
        version: true,
      },
    })
    .then((result) => (result._max.version ?? 0) + 1);
}

/* =========================================================
   HISTORY SERVICE
========================================================= */

class HistoryService {
  /* =======================================================
     RECORD EVENT
  ======================================================= */

  async record(
    input: RecordHistoryInput,
    executor: PrismaExecutor = prisma,
  ): Promise<HistoryRecord> {
    let version = input.version ?? null;

    if (
      version === null &&
      input.entityType &&
      input.entityId
    ) {
      version = await getNextVersion(
        executor,
        input.entityType,
        input.entityId,
      );
    }

    const changes = input.changes
      ? sanitizeHistoryData(input.changes)
      : null;

    const metadata = input.metadata
      ? sanitizeHistoryData(input.metadata)
      : null;

    return executor.historyEvent.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        targetUserId: input.targetUserId ?? null,

        category: input.category,
        eventType: input.eventType,

        operation: input.operation ?? null,

        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,

        title: input.title,
        description: input.description ?? null,

        version,

        changes: changes as Prisma.InputJsonValue | undefined,
        metadata: metadata as Prisma.InputJsonValue | undefined,

        sessionId: input.sessionId ?? null,

        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,

        country: input.country ?? null,
        state: input.state ?? null,
        city: input.city ?? null,
        timezone: input.timezone ?? null,

        parentEventId: input.parentEventId ?? null,
      },
    });
  }

  /* =======================================================
     RECORD CHANGE
  ======================================================= */

  async recordChange(
    input: RecordChangeInput,
    executor: PrismaExecutor = prisma,
  ): Promise<{
    event: HistoryRecord;
    snapshot: Prisma.HistorySnapshotGetPayload<{}> | null;
    changes: HistoryChanges;
    version: number;
  }> {
    const changes = createHistoryDiff(
      input.before,
      input.after,
    );

    /*
     * Don't create meaningless history entries.
     */
    if (!hasHistoryChanges(changes)) {
      const latestVersion = await getNextVersion(
        executor,
        input.entityType,
        input.entityId,
      );

      return {
        event: await this.record(
          {
            actorUserId: input.actorUserId,
            targetUserId: input.targetUserId,
            sessionId: input.sessionId,

            ipAddress: input.ipAddress,
            userAgent: input.userAgent,

            country: input.country,
            state: input.state,
            city: input.city,
            timezone: input.timezone,

            category: input.category,
            eventType: input.eventType,
            operation: input.operation,

            entityType: input.entityType,
            entityId: input.entityId,

            title: input.title,
            description: input.description,

            changes: {},
            metadata: input.metadata,

            parentEventId: input.parentEventId,

            version: latestVersion - 1,
          },
          executor,
        ),
        snapshot: null,
        changes: {},
        version: latestVersion - 1,
      };
    }

    const version = await getNextVersion(
      executor,
      input.entityType,
      input.entityId,
    );

    const event = await this.record(
      {
        actorUserId: input.actorUserId,
        targetUserId: input.targetUserId,
        sessionId: input.sessionId,

        ipAddress: input.ipAddress,
        userAgent: input.userAgent,

        country: input.country,
        state: input.state,
        city: input.city,
        timezone: input.timezone,

        category: input.category,
        eventType: input.eventType,
        operation: input.operation,

        entityType: input.entityType,
        entityId: input.entityId,

        title: input.title,
        description: input.description,

        version,

        changes,
        metadata: input.metadata,

        parentEventId: input.parentEventId,
      },
      executor,
    );

    let snapshot: Prisma.HistorySnapshotGetPayload<{}> | null =
      null;

   if (input.createSnapshot !== false)  {
      snapshot = await this.recordSnapshot(
        {
          entityType: input.entityType,
          entityId: input.entityId,

          data: input.after,

          eventId: event.id,
          createdByUserId: input.actorUserId,

          version,
        },
        executor,
      );
    }

    return {
      event,
      snapshot,
      changes,
      version,
    };
  }

  /* =======================================================
     RECORD SNAPSHOT
  ======================================================= */

  async recordSnapshot(
    input: RecordSnapshotInput,
    executor: PrismaExecutor = prisma,
  ): Promise<Prisma.HistorySnapshotGetPayload<{}>> {
    const sanitizedData =
      sanitizeHistoryData(input.data) as Record<
        string,
        unknown
      >;

    const version =
      input.version ??
      (await this.getNextSnapshotVersion(
        input.entityType,
        input.entityId,
        executor,
      ));

    const checksum =
      input.checksum ??
      createHistoryChecksum(sanitizedData);

    return executor.historySnapshot.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,

        version,

        data:
          sanitizedData as Prisma.InputJsonValue,

        eventId: input.eventId ?? null,

        createdByUserId:
          input.createdByUserId ?? null,

        checksum,
      },
    });
  }

  /* =======================================================
     NEXT SNAPSHOT VERSION
  ======================================================= */

  private async getNextSnapshotVersion(
    entityType: string,
    entityId: string,
    executor: PrismaExecutor,
  ): Promise<number> {
    const result =
      await executor.historySnapshot.aggregate({
        where: {
          entityType,
          entityId,
        },
        _max: {
          version: true,
        },
      });

    return (result._max.version ?? 0) + 1;
  }

  /* =======================================================
     GET TIMELINE
  ======================================================= */

  async getTimeline(
  options: HistoryTimelineOptions = {},
) {
  const page = Math.max(
    options.page ?? 1,
    1,
  );

  const limit = Math.min(
    Math.max(options.limit ?? 50, 1),
    100,
  );

  const where: Prisma.HistoryEventWhereInput = {};

  if (options.entityType) {
    where.entityType = options.entityType;
  }

  if (options.entityId) {
    where.entityId = options.entityId;
  }

  if (options.actorUserId) {
    where.actorUserId = options.actorUserId;
  }

  if (options.targetUserId) {
    where.targetUserId =
      options.targetUserId;
  }

  if (options.category) {
    where.category = options.category;
  }

  if (options.eventType) {
    where.eventType = options.eventType;
  }

  if (options.operation) {
    where.operation = options.operation;
  }

  if (options.search) {
    where.OR = [
      {
        title: {
          contains: options.search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: options.search,
          mode: "insensitive",
        },
      },
      {
        eventType: {
          contains: options.search,
          mode: "insensitive",
        },
      },
      {
        entityType: {
          contains: options.search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (options.from || options.to) {
    where.createdAt = {
      ...(options.from
        ? { gte: options.from }
        : {}),
      ...(options.to
        ? { lte: options.to }
        : {}),
    };
  }

  const [events, total] =
    await Promise.all([
      prisma.historyEvent.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              email: true,
              mobile: true,
              role: true,
              profileImageUrl: true,
            },
          },

          targetUser: {
            select: {
              id: true,
              name: true,
              email: true,
              mobile: true,
              role: true,
              profileImageUrl: true,
            },
          },
        },
      }),

      prisma.historyEvent.count({
        where,
      }),
    ]);

  return {
    events,
    page,
    limit,
    total,
    totalPages: Math.ceil(
      total / limit,
    ),
  };
}

  /* =======================================================
     GET ENTITY HISTORY
  ======================================================= */

  async getEntityTimeline(
    entityType: string,
    entityId: string,
    options: Omit<
      HistoryTimelineOptions,
      "entityType" | "entityId"
    > = {},
  ) {
    return this.getTimeline({
      ...options,
      entityType,
      entityId,
    });
  }

  /* =======================================================
     GET VERSION
  ======================================================= */

/* =========================================================
   GET VERSION
========================================================= */

/* =========================================================
   GET VERSION
========================================================= */

async getVersion(
  entityType: string,
  entityId: string,
  version: number,
): Promise<HistoryVersion> {
  if (version < 1) {
    throw new Error(
      "History version must be greater than 0.",
    );
  }

  /*
   * A version does not need to have an exact snapshot.
   *
   * Example:
   *
   * Snapshot v1
   * Event    v2
   * Event    v3
   * Snapshot v4
   * Event    v5
   *
   * Requesting v5 reconstructs the state from:
   *
   * Snapshot v4 + Event v5
   */

  const [state, event] = await Promise.all([
    this.getStateAtVersion(
      entityType,
      entityId,
      version,
    ),

prisma.historyEvent.findFirst({
  where: {
    entityType,
    entityId,
    version,
  },
  orderBy: {
    createdAt: "desc",
  },
}),

  ]);

  return {
    version,

    // Reconstructed state at the requested version.
    snapshot: state,

    event: event
      ? {
          id: event.id,
          eventType: event.eventType,
          title: event.title,
          description: event.description,
          createdAt: event.createdAt,
        }
      : null,
  };
}



  /* =======================================================
     GET LATEST VERSION
  ======================================================= */

  async getLatestVersion(
    entityType: string,
    entityId: string,
  ): Promise<number> {
    return getNextVersion(
      prisma,
      entityType,
      entityId,
    ).then((version) => Math.max(version - 1, 0));
  }


    /* =======================================================
     GET STATE AT VERSION
  ======================================================= */

/* =========================================================
   GET STATE AT VERSION
========================================================= */

/* =========================================================
   GET STATE AT VERSION
========================================================= */

async getStateAtVersion(
  entityType: string,
  entityId: string,
  version: number,
): Promise<Record<string, unknown>> {
  if (version < 1) {
    throw new Error(
      "History version must be greater than 0.",
    );
  }

  /*
   * -------------------------------------------------------
   * LOAD ALL EVENTS UP TO THE REQUESTED VERSION
   * -------------------------------------------------------
   *
   * We intentionally reconstruct from the chronological
   * event stream instead of blindly trusting a snapshot.
   *
   * This is important because older snapshots may contain
   * only the fields changed by one particular event.
   *
   * Example of an incomplete old snapshot:
   *
   * {
   *   profileImageUrl: "..."
   * }
   *
   * But earlier events may contain:
   *
   * name
   * email
   * mobile
   * gender
   * dateOfBirth
   *
   * Therefore we reconstruct the complete state from the
   * event history.
   */

  const events =
    await prisma.historyEvent.findMany({
      where: {
        entityType,
        entityId,
        version: {
          lte: version,
        },
      },
      orderBy: {
        version: "asc",
      },
      select: {
        version: true,
        changes: true,
      },
    });

  if (events.length === 0) {
    throw new Error(
      `No history exists for ${entityType}/${entityId} at or before version ${version}.`,
    );
  }

  /*
   * -------------------------------------------------------
   * RECONSTRUCT INITIAL STATE
   * -------------------------------------------------------
   *
   * The earliest event provides the first known value for
   * each field through its "before" values.
   */

  const state: Record<string, unknown> = {};

  const firstEvent = events[0];

  if (firstEvent?.changes) {
    const firstChanges =
      firstEvent.changes as Record<
        string,
        {
          before: unknown;
          after: unknown;
        }
      >;

    for (const [field, change] of Object.entries(
      firstChanges,
    )) {
      state[field] = change.before;
    }
  }

  /*
   * -------------------------------------------------------
   * APPLY EVENTS CHRONOLOGICALLY
   * -------------------------------------------------------
   *
   * Every event updates only the fields that actually
   * changed during that event.
   *
   * This preserves fields from older events.
   */

  for (const event of events) {
    if (!event.changes) {
      continue;
    }

    const changes =
      event.changes as Record<
        string,
        {
          before: unknown;
          after: unknown;
        }
      >;

    for (const [field, change] of Object.entries(
      changes,
    )) {
      state[field] = change.after;
    }
  }

  return state;
}



  /* =======================================================
     GET DIFF BETWEEN TWO VERSIONS
  ======================================================= */

    /* =======================================================
     GET DIFF BETWEEN TWO VERSIONS
  ======================================================= */


  async getDiff(
    entityType: string,
    entityId: string,
    fromVersion: number,
    toVersion: number,
  ): Promise<HistoryChanges> {
    if (fromVersion < 1 || toVersion < 1) {
      throw new Error(
        "History versions must be greater than 0.",
      );
    }

    if (fromVersion >= toVersion) {
      throw new Error(
        "fromVersion must be smaller than toVersion.",
      );
    }

    /*
     * Reconstruct the complete entity state at both
     * requested versions.
     *
     * A version does NOT need to have its own snapshot.
     */
    const [
  fromState,
  toState,
] = await Promise.all([
  this.getStateAtVersion(
    entityType,
    entityId,
    fromVersion,
  ),
  this.getStateAtVersion(
    entityType,
    entityId,
    toVersion,
  ),
]);

return createHistoryDiff(
  fromState,
  toState,
);


return createHistoryDiff(fromState, toState);

    /*
     * Compare the reconstructed states.
     */
    return createHistoryDiff(
      fromState,
      toState,
    );
  }

  /* =======================================================
     GET EVENT
  ======================================================= */

  async getEvent(
    eventId: string,
  ) {
    return prisma.historyEvent.findUnique({
      where: {
        id: eventId,
      },

      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            role: true,
            profileImageUrl: true,
          },
        },

        targetUser: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            role: true,
            profileImageUrl: true,
          },
        },

        parentEvent: true,

        childEvents: {
          orderBy: {
            createdAt: "asc",
          },
        },

        session: true,
      },
    });
  }

  /* =======================================================
     TRANSACTION HELPER
  ======================================================= */

  async transaction<T>(
    callback: (
      tx: Prisma.TransactionClient,
    ) => Promise<T>,
  ): Promise<T> {
    return prisma.$transaction(
      async (tx) => callback(tx),
    );
  }
}

/* =========================================================
   SINGLETON
========================================================= */

export const historyService =
  new HistoryService();

export default historyService;