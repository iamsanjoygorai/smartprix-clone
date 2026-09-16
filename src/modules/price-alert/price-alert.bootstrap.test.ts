import { describe, expect, it, vi } from "vitest";

import {
  startPriceAlertProcessing,
} from "./price-alert.bootstrap";

describe("Price Alert Bootstrap", () => {
  it("should start the price alert scheduler", () => {
    const startScheduler = vi.fn();

    startPriceAlertProcessing({
      startScheduler,
    });

    expect(startScheduler).toHaveBeenCalledTimes(1);
  });

  it("should pass the price alert job to the scheduler", () => {
    const startScheduler = vi.fn();

    startPriceAlertProcessing({
      startScheduler,
    });

    expect(startScheduler).toHaveBeenCalledWith(
      expect.objectContaining({
        processActivePriceAlerts: expect.any(Function),
      }),
    );
  });

  it("should use the configured scheduler interval", () => {
    const startScheduler = vi.fn();

    startPriceAlertProcessing({
      startScheduler,
      intervalMs: 300_000,
    });

    expect(startScheduler).toHaveBeenCalledWith(
      expect.objectContaining({
        intervalMs: 300_000,
      }),
    );
  });
});