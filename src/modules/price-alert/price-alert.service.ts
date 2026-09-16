import prisma from "../../db/prisma";

import type {
  CreatePriceAlertInput,
  UpdatePriceAlertInput,
} from "./price-alert.types";

/* =========================================================
   CREATE PRICE ALERT
========================================================= */

export const createPriceAlert = async (
  userId: string,
  input: CreatePriceAlertInput,
) => {
  const product = await prisma.product.findUnique({
    where: {
      id: input.productId,
    },
    select: {
      id: true,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  return prisma.priceAlert.create({
    data: {
      userId,
      productId: input.productId,
      targetPrice: input.targetPrice,
      currency: input.currency ?? "INR",
    },
  });
};

/* =========================================================
   GET USER PRICE ALERTS
========================================================= */

export const getUserPriceAlerts = async (
  userId: string,
) => {
  return prisma.priceAlert.findMany({
    where: {
      userId,
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          brand: {
            select: {
              id: true,
              name: true,
            },
          },
          images: {
            where: {
              isPrimary: true,
            },
            take: 1,
            select: {
              id: true,
              url: true,
              altText: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

/* =========================================================
   GET SINGLE USER PRICE ALERT
========================================================= */

export const getUserPriceAlert = async (
  userId: string,
  alertId: string,
) => {
  return prisma.priceAlert.findFirst({
    where: {
      id: alertId,
      userId,
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          brand: {
            select: {
              id: true,
              name: true,
            },
          },
          images: {
            where: {
              isPrimary: true,
            },
            take: 1,
            select: {
              id: true,
              url: true,
              altText: true,
            },
          },
        },
      },
    },
  });
};

/* =========================================================
   UPDATE PRICE ALERT
========================================================= */

export const updatePriceAlert = async (
  userId: string,
  alertId: string,
  input: UpdatePriceAlertInput,
) => {
  const existingAlert =
    await prisma.priceAlert.findFirst({
      where: {
        id: alertId,
        userId,
      },
      select: {
        id: true,
      },
    });

  if (!existingAlert) {
    throw new Error("Price alert not found");
  }

  return prisma.priceAlert.update({
    where: {
      id: alertId,
    },
    data: {
      ...(input.targetPrice !== undefined && {
        targetPrice: input.targetPrice,
      }),

      ...(input.isActive !== undefined && {
        isActive: input.isActive,
      }),

      // If the user changes the target price
      // after the alert was triggered, allow the
      // alert to become triggerable again.
      ...(input.targetPrice !== undefined && {
        triggeredAt: null,
      }),
    },
  });
};

/* =========================================================
   DELETE PRICE ALERT
========================================================= */

export const deletePriceAlert = async (
  userId: string,
  alertId: string,
) => {
  const existingAlert =
    await prisma.priceAlert.findFirst({
      where: {
        id: alertId,
        userId,
      },
      select: {
        id: true,
      },
    });

  if (!existingAlert) {
    throw new Error("Price alert not found");
  }

  await prisma.priceAlert.delete({
    where: {
      id: alertId,
    },
  });
};