import app from "./app";
import { env } from "./config/env";

import { startPriceAlertProcessing } from "./modules/price-alert/price-alert.bootstrap";

const priceAlertScheduler = startPriceAlertProcessing({
  intervalMs: env.PRICE_ALERT_INTERVAL_MS,
});

const server = app.listen(env.PORT, () => {
  console.log(
    `🚀 Smartprix Clone API running on http://localhost:${env.PORT}`,
  );

  console.log(
    `⏰ Price Alert Engine interval: ${env.PRICE_ALERT_INTERVAL_MS}ms`,
  );
});

const shutdown = (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  // Stop creating new Price Alert processing cycles.
  priceAlertScheduler.stop();

  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));