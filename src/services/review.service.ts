import prisma from "../db/prisma";

interface CreateReviewInput {
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  content?: string;
}

interface UpdateReviewInput {
  rating?: number;
  title?: string;
  content?: string;
}

export const createReview = async ({
  productId,
  userId,
  rating,
  title,
  content,
}: CreateReviewInput) => {
  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!product || !product.isActive) {
    throw new Error("Product not found");
  }

  const existingReview = await prisma.review.findFirst({
    where: {
      productId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (existingReview) {
    throw new Error(
      "You have already reviewed this product",
    );
  }

  return prisma.review.create({
    data: {
      productId,
      userId,
      rating,
      title: title?.trim() || null,
      content: content?.trim() || null,
      isPublished: true,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

export const getProductReviews = async (
  productId: string,
) => {
  return prisma.review.findMany({
    where: {
      productId,
      isPublished: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

export const updateReview = async (
  reviewId: string,
  userId: string,
  data: UpdateReviewInput,
) => {
  if (
    data.rating !== undefined &&
    (data.rating < 1 || data.rating > 5)
  ) {
    throw new Error("Rating must be between 1 and 5");
  }

  const review = await prisma.review.findUnique({
    where: {
      id: reviewId,
    },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!review) {
    throw new Error("Review not found");
  }

  if (review.userId !== userId) {
    throw new Error(
      "You can only edit your own review",
    );
  }

  return prisma.review.update({
    where: {
      id: reviewId,
    },
    data: {
      ...(data.rating !== undefined && {
        rating: data.rating,
      }),
      ...(data.title !== undefined && {
        title: data.title.trim() || null,
      }),
      ...(data.content !== undefined && {
        content: data.content.trim() || null,
      }),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

export const deleteReview = async (
  reviewId: string,
  userId: string,
) => {
  const review = await prisma.review.findUnique({
    where: {
      id: reviewId,
    },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!review) {
    throw new Error("Review not found");
  }

  if (review.userId !== userId) {
    throw new Error(
      "You can only delete your own review",
    );
  }

  return prisma.review.delete({
    where: {
      id: reviewId,
    },
  });
};