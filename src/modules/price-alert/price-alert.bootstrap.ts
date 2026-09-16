import prisma from "../../db/prisma";

import { runPriceAlertJobWithPrisma } from "./price-alert.job";
import { startPriceAlertScheduler } from "./price-alert.scheduler";

type PriceAlertProcessor = () => Promise<{
  processed: number;
  triggered: number;
}>;

type PriceAlertSchedulerStarter = (options: {
  processActivePriceAlerts: PriceAlertProcessor;
  intervalMs: number;
}) => {
  stop: () => void;
};

type StartPriceAlertProcessingOptions = {
  startScheduler?: PriceAlertSchedulerStarter;
  intervalMs?: number;
};

/**
 * Starts the Price Alert background processing system.
 *
 * Architecture:
 *
 * Scheduler → Job → Engine → Prisma
 */
export const startPriceAlertProcessing = ({
  startScheduler = startPriceAlertScheduler,
  intervalMs = 300_000,
}: StartPriceAlertProcessingOptions = {}) => {
  return startScheduler({
    processActivePriceAlerts: () =>
      runPriceAlertJobWithPrisma(prisma),
    intervalMs,
  });
};