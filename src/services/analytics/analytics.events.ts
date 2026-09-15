export const ANALYTICS_EVENTS = {
  PRODUCT_VIEW: "PRODUCT_VIEW",
} as const;

export type AnalyticsEventType =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];