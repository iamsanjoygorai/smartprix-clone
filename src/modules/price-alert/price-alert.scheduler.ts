type PriceAlertProcessor = () => Promise<{
  processed: number;
  triggered: number;
}>;

type PriceAlertSchedulerOptions = {
  processActivePriceAlerts: PriceAlertProcessor;
  intervalMs: number;
};

type PriceAlertScheduler = {
  stop: () => void;
};

/**
 * Starts the background Price Alert scheduler.
 *
 * The processor runs immediately once, then repeatedly
 * according to the configured interval.
 */
export const startPriceAlertScheduler = ({
  processActivePriceAlerts,
  intervalMs,
}: PriceAlertSchedulerOptions): PriceAlertScheduler => {
  let isProcessing = false;

  const runProcessor = async (): Promise<void> => {
    if (isProcessing) {
      console.log("⏭️ Price Alert Scheduler: previous cycle still running.");
      return;
    }

    isProcessing = true;

    const startedAt = Date.now();

    console.log("⏰ Price Alert Scheduler: processing started...");

    try {
      const result = await processActivePriceAlerts();

      const durationMs = Date.now() - startedAt;

      console.log(
        `✅ Price Alert Scheduler: processed=${result.processed}, triggered=${result.triggered}, duration=${durationMs}ms`,
      );
    } catch (error) {
      console.error("❌ Price Alert Scheduler error:", error);
    } finally {
      isProcessing = false;
    }
  };

  // Run immediately when the scheduler starts.
  void runProcessor();

  const interval = setInterval(() => {
    void runProcessor();
  }, intervalMs);

  console.log(
    `📅 Price Alert Scheduler started. Interval: ${intervalMs}ms`,
  );

  return {
    stop: () => {
      clearInterval(interval);
      console.log("🛑 Price Alert Scheduler stopped.");
    },
  };
};