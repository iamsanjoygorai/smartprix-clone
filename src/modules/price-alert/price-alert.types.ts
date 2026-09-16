export interface CreatePriceAlertInput {
  productId: string;
  targetPrice: number;
  currency?: string;
}

export interface UpdatePriceAlertInput {
  targetPrice?: number;
  isActive?: boolean;
}

export interface PriceAlertResponse {
  id: string;
  userId: string;
  productId: string;
  targetPrice: number;
  currency: string;
  isActive: boolean;
  triggeredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}