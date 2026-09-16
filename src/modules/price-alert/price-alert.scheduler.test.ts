import { describe, expect, it, vi } from "vitest";

import { startPriceAlertScheduler } from "./price-alert.scheduler";

describe("Price Alert Scheduler", () => {
  it("should run the price alert processor immediately when the scheduler starts", async () => {
    const processActivePriceAlerts = vi
      .fn()
      .mockResolvedValue({ processed: 2, triggered: 1 });

    const scheduler = startPriceAlertScheduler({
      processActivePriceAlerts,
      intervalMs: 60_000,
    });

    await Promise.resolve();

    expect(processActivePriceAlerts).toHaveBeenCalledTimes(1);

    scheduler.stop();
  });

  it("should run the price alert processor again after the configured interval", async () => {
    vi.useFakeTimers();

    const processActivePriceAlerts = vi
      .fn()
      .mockResolvedValue({ processed: 2, triggered: 1 });

    const scheduler = startPriceAlertScheduler({
      processActivePriceAlerts,
      intervalMs: 60_000,
    });

    await Promise.resolve();

    expect(processActivePriceAlerts).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(60_000);

    expect(processActivePriceAlerts).toHaveBeenCalledTimes(2);

    scheduler.stop();
    vi.useRealTimers();
  });

  it("should stop running the processor after the scheduler is stopped", async () => {
    vi.useFakeTimers();

    const processActivePriceAlerts = vi
      .fn()
      .mockResolvedValue({ processed: 1, triggered: 1 });

    const scheduler = startPriceAlertScheduler({
      processActivePriceAlerts,
      intervalMs: 60_000,
    });

    await Promise.resolve();

    expect(processActivePriceAlerts).toHaveBeenCalledTimes(1);

    scheduler.stop();

    await vi.advanceTimersByTimeAsync(120_000);

    expect(processActivePriceAlerts).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("should not allow overlapping price alert processing", async () => {
    vi.useFakeTimers();

    let resolveProcessing!: () => void;

    const processingPromise = new Promise<{
      processed: number;
      triggered: number;
    }>((resolve) => {
      resolveProcessing = () =>
        resolve({
          processed: 1,
          triggered: 1,
        });
    });

    const processActivePriceAlerts = vi
      .fn()
      .mockReturnValue(processingPromise);

    const scheduler = startPriceAlertScheduler({
      processActivePriceAlerts,
      intervalMs: 1_000,
    });

    await Promise.resolve();

    expect(processActivePriceAlerts).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1_000);

    expect(processActivePriceAlerts).toHaveBeenCalledTimes(1);

    resolveProcessing();

    await processingPromise;

    scheduler.stop();
    vi.useRealTimers();
  });

  it("should continue scheduling when price alert processing fails", async () => {
    vi.useFakeTimers();

    const processActivePriceAlerts = vi
      .fn()
      .mockRejectedValueOnce(
        new Error("Database temporarily unavailable"),
      )
      .mockResolvedValueOnce({
        processed: 1,
        triggered: 1,
      });

    const scheduler = startPriceAlertScheduler({
      processActivePriceAlerts,
      intervalMs: 1_000,
    });

    await Promise.resolve();

    await vi.advanceTimersByTimeAsync(1_000);

    expect(processActivePriceAlerts).toHaveBeenCalledTimes(2);

    scheduler.stop();
    vi.useRealTimers();
  });
});