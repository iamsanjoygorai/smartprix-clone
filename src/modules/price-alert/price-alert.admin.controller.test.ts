import { describe, expect, it, vi } from "vitest";

import { processPriceAlerts } from "./price-alert.admin.controller";

describe("Price Alert Admin Controller", () => {
  it("should process active price alerts and return the job result", async () => {
    const runJob = vi.fn().mockResolvedValue({
      processed: 1,
      triggered: 1,
      triggeredAlerts: [],
      notifications: {
        attempted: 1,
        sent: 1,
        failed: 0,
        skipped: 0,
      },
    });

    const req = {} as any;

    const json = vi.fn();

    const res = {
      status: vi.fn().mockReturnThis(),
      json,
    } as any;

    await processPriceAlerts(req, res, runJob);

    expect(runJob).toHaveBeenCalledTimes(1);

    expect(json).toHaveBeenCalledWith({
      success: true,
      data: {
        processed: 1,
        triggered: 1,
        triggeredAlerts: [],
        notifications: {
          attempted: 1,
          sent: 1,
          failed: 0,
          skipped: 0,
        },
      },
    });
  });

  it("should return 500 when processing fails", async () => {
    const runJob = vi
      .fn()
      .mockRejectedValue(new Error("Processing failed"));

    const req = {} as any;

    const json = vi.fn();

    const res = {
      status: vi.fn().mockReturnThis(),
      json,
    } as any;

    await processPriceAlerts(req, res, runJob);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(json).toHaveBeenCalledWith({
      success: false,
      message: "Failed to process price alerts",
    });
  });
});