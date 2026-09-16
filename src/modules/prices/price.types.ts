export interface PriceStatistics {
  current: number;
  lowest: number;
  highest: number;
  average: number;
  currency: string;
}

export interface PriceQueryResult {
  id: string;
  productId: string;
  variantId: string | null;
  sellerId: string;
  amount: unknown;
  currency: string;
  productUrl: string | null;
  inStock: boolean;
  recordedAt: Date;
}