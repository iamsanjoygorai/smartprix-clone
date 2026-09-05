import prisma from "../db/prisma";

import type {
  CreateNewsInput,
  UpdateNewsInput,
} from "../validators/news.validator";

function createSlug(title: string) {
  return `${title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${Date.now()}`;
}

function extractFirstImageFromBlocks(
  blocks?: CreateNewsInput["blocks"] | UpdateNewsInput["blocks"],
): string | null {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  const sortedBlocks = [...blocks].sort(
    (a, b) => a.position - b.position,
  );

  for (const block of sortedBlocks) {
    if (block.type !== "rich-text") {
      continue;
    }

    const content = block.content as {
      html?: string;
    };

    const html = content?.html ?? "";

    const match = html.match(
      /<img[^>]+src=["']([^"']+)["']/i,
    );

    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

export const createNews = async (
  input: CreateNewsInput,
) => {
  const {
    title,
    authorName,
    featuredImage,
    status,
    allowLikes,
    allowComments,
    allowSharing,
    blocks,
    categoryIds,
  } = input;

  const slug = createSlug(title);
  const firstImage = extractFirstImageFromBlocks(blocks);

  return prisma.$transaction(async (tx) => {
    const news = await tx.news.create({
      data: {
        title,
        slug,
        authorName,
           featuredImage: firstImage,

        status,

        publishedAt:
          status === "PUBLISHED"
            ? new Date()
            : null,

        allowLikes,
        allowComments,
        allowSharing,
      },
    });

    // Create news blocks
    if (blocks && blocks.length > 0) {
      await tx.newsBlock.createMany({
        data: blocks.map((block, index) => ({
          newsId: news.id,
          type: block.type,
          position: index,
          content: block.content as any,
        })),
      });
    }

    // Create category relationships
    if (
      categoryIds &&
      categoryIds.length > 0
    ) {
      await tx.newsCategoryPost.createMany({
        data: categoryIds.map(
          (categoryId) => ({
            newsId: news.id,
            categoryId,
          }),
        ),
        skipDuplicates: true,
      });
    }

    return tx.news.findUnique({
      where: {
        id: news.id,
      },

      include: {
        blocks: {
          orderBy: {
            position: "asc",
          },
        },

        categories: {
          include: {
            category: true,
          },
        },
      },
    });
  });
};

export const getNewsById = async (
  id: string,
) => {
  return prisma.news.findUnique({
    where: {
      id,
    },

    include: {
      blocks: {
        orderBy: {
          position: "asc",
        },
      },

      categories: {
        include: {
          category: true,
        },
      },
    },
  });
};

export const getNewsBySlug = async (
  slug: string,
) => {
  return prisma.news.findUnique({
    where: {
      slug,
    },

    include: {
      blocks: {
        orderBy: {
          position: "asc",
        },
      },

      categories: {
        include: {
          category: true,
        },
      },
    },
  });
};

export const getAllNews = async () => {
  return prisma.news.findMany({
    orderBy: {
      createdAt: "desc",
    },

    include: {
      blocks: {
        orderBy: {
          position: "asc",
        },
      },

      categories: {
        include: {
          category: true,
        },
      },
    },
  });
};

export const updateNews = async (
  id: string,
  input: UpdateNewsInput,
) => {
  const existing =
    await prisma.news.findUnique({
      where: {
        id,
      },
    });

  if (!existing) {
    throw new Error("News not found");
  }

  const {
    title,
    authorName,
    featuredImage,
    status,
    allowLikes,
    allowComments,
    allowSharing,
    blocks,
    categoryIds,
  } = input;

  const firstImage =
  blocks !== undefined
    ? extractFirstImageFromBlocks(blocks)
    : undefined;

  return prisma.$transaction(async (tx) => {
    await tx.news.update({
      where: {
        id,
      },

      data: {
        ...(title !== undefined && {
          title,
        }),

        ...(authorName !== undefined && {
          authorName,
        }),

        ...(blocks !== undefined && {
  featuredImage: firstImage,
}),

        ...(status !== undefined && {
          status,

          publishedAt:
            status === "PUBLISHED"
              ? existing.publishedAt ??
                new Date()
              : null,
        }),

        ...(allowLikes !== undefined && {
          allowLikes,
        }),

        ...(allowComments !== undefined && {
          allowComments,
        }),

        ...(allowSharing !== undefined && {
          allowSharing,
        }),
      },
    });

    // Replace blocks
    if (blocks !== undefined) {
      await tx.newsBlock.deleteMany({
        where: {
          newsId: id,
        },
      });

      if (blocks.length > 0) {
        await tx.newsBlock.createMany({
          data: blocks.map(
            (block, index) => ({
              newsId: id,
              type: block.type,
              position: index,
              content: block.content as any,
            }),
          ),
        });
      }
    }

    // Replace categories
    if (categoryIds !== undefined) {
      await tx.newsCategoryPost.deleteMany({
        where: {
          newsId: id,
        },
      });

      if (categoryIds.length > 0) {
        await tx.newsCategoryPost.createMany({
          data: categoryIds.map(
            (categoryId) => ({
              newsId: id,
              categoryId,
            }),
          ),
          skipDuplicates: true,
        });
      }
    }

    return tx.news.findUnique({
      where: {
        id,
      },

      include: {
        blocks: {
          orderBy: {
            position: "asc",
          },
        },

        categories: {
          include: {
            category: true,
          },
        },
      },
    });
  });
};

export const deleteNews = async (
  id: string,
) => {
  const news =
    await prisma.news.findUnique({
      where: {
        id,
      },
    });

  if (!news) {
    throw new Error("News not found");
  }

  await prisma.news.delete({
    where: {
      id,
    },
  });

  return news;
};

export const deleteNewsBulk = async (ids: string[]) => {
  if (ids.length === 0) {
    throw new Error("No news posts selected");
  }

  const result = await prisma.news.deleteMany({
    where: {
      id: {
        in: ids,
      },
    },
  });

  return result.count;
};