export interface AnalyticsOverview {
  users: {
    total: number;
    active: number;
  };

  products: {
    total: number;
    active: number;
  };

  reviews: {
    total: number;
    published: number;
  };
}

export interface AnalyticsUsers {
  total: number;
  active: number;
  disabled: number;
  deleted: number;
}

export interface AnalyticsUserGrowthPoint {
  date: string;
  count: number;
}

export interface AnalyticsUserGrowth {
  range: string;
  total: number;
  series: AnalyticsUserGrowthPoint[];
}

export interface AnalyticsProducts {
  total: number;
  active: number;
  inactive: number;
}

export interface AnalyticsProductGrowthPoint {
  date: string;
  count: number;
}

export interface AnalyticsProductGrowth {
  range: string;
  total: number;
  series: AnalyticsProductGrowthPoint[];
}

export interface AnalyticsTopProduct {
  productId: string;
  productName: string;
  slug: string;
  eventCount: number;
}

export interface AnalyticsTopProducts {
  range: string;
  totalEvents: number;
  products: AnalyticsTopProduct[];
}

export interface AnalyticsSearchTerm {
  query: string;
  count: number;
}

export interface AnalyticsSearches {
  range: string;
  totalSearches: number;
  uniqueSearches: number;
  topSearches: AnalyticsSearchTerm[];
}

export interface AnalyticsEngagementEvent {
  eventType: string;
  count: number;
}

export interface AnalyticsEngagement {
  range: string;
  totalEvents: number;
  uniqueProductsViewed: number;
  events: AnalyticsEngagementEvent[];
}

export interface AnalyticsActivityItem {
  action: string;
  count: number;
}

export interface AnalyticsActivity {
  range: string;
  totalActivities: number;
  activities: AnalyticsActivityItem[];
}