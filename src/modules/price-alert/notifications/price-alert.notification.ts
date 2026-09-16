import { sendPriceAlertEmail } from "../../../services/email.service";

export type TriggeredPriceAlert = {
  alertId: string;
  userId: string;
  email: string | null;
  productName: string;
  productSlug: string;
  targetPrice: number;
  currentPrice: number;
  currency: string;
};

export type PriceAlertNotificationResult = {
  attempted: number;
  sent: number;
  failed: number;
  skipped: number;
};

/**
 * Sends notifications for alerts that were successfully triggered.
 *
 * Notification failures are intentionally isolated from the Price Alert
 * Engine. The alert has already been triggered and will not be triggered
 * repeatedly because of an SMTP failure.
 */
export const sendPriceAlertNotifications = async (
  alerts: TriggeredPriceAlert[],
): Promise<PriceAlertNotificationResult> => {
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const alert of alerts) {
    if (!alert.email) {
      skipped++;
      continue;
    }

    try {
      await sendPriceAlertEmail({
        email: alert.email,
        productName: alert.productName,
        productSlug: alert.productSlug,
        targetPrice: alert.targetPrice,
        currentPrice: alert.currentPrice,
        currency: alert.currency,
      });

      sent++;
    } catch (error) {
      failed++;

      console.error(
        `Failed to send Price Alert notification for alert ${alert.alertId}:`,
        error,
      );
    }
  }

  return {
    attempted: alerts.length,
    sent,
    failed,
    skipped,
  };
};