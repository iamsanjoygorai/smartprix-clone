import prisma from "../../db/prisma";

import {
  processActivePriceAlerts,
  type ProcessPriceAlertsResult,
} from "./price-alert.engine";

import {
  sendPriceAlertNotifications,
} from "./notifications/price-alert.notification";

export type PriceAlertJobResult = ProcessPriceAlertsResult & {
  notifications: {
    attempted: number;
    sent: number;
    failed: number;
    skipped: number;
  };
};

type PriceAlertJobOptions = {
  processActivePriceAlerts: () => Promise<ProcessPriceAlertsResult>;
  sendNotifications?: typeof sendPriceAlertNotifications;
};

/**
 * Runs one complete Price Alert processing cycle.
 *
 * Flow:
 *
 * Engine → Triggered Alerts → Notifications
 */
export const runPriceAlertJob = async ({
  processActivePriceAlerts,
  sendNotifications = sendPriceAlertNotifications,
}: PriceAlertJobOptions): Promise<PriceAlertJobResult> => {
  console.log("🔔 Price Alert Job: engine processing started...");

  const result = await processActivePriceAlerts();

  console.log(
    `🔔 Price Alert Job: processed=${result.processed}, triggered=${result.triggered}`,
  );

  const notifications = await sendNotifications(
    result.triggeredAlerts,
  );

  console.log(
    `📧 Price Alert Notifications: attempted=${notifications.attempted}, sent=${notifications.sent}, failed=${notifications.failed}, skipped=${notifications.skipped}`,
  );

  return {
    ...result,
    notifications,
  };
};

/**
 * Production entry point using the application's Prisma instance.
 */
export const runPriceAlertJobWithPrisma = async (
  prismaClient: typeof prisma,
  processor: typeof processActivePriceAlerts = processActivePriceAlerts,
): Promise<PriceAlertJobResult> => {
  return runPriceAlertJob({
    processActivePriceAlerts: () =>
      processor(prismaClient),
  });
};