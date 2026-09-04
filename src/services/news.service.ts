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
  } = input;

  const slug = createSlug(title);

  return prisma.$transaction(async (tx) => {
    const news = await tx.news.create({
      data: {
        title,
        slug,
        authorName,
        featuredImage,
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
    },
  });
};


export const updateNews = async (
  id: string,
  input: UpdateNewsInput,
) => {
  const existing = await prisma.news.findUnique({
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
  } = input;

  return prisma.$transaction(async (tx) => {
    await tx.news.update({
      where: {
        id,
      },
      data: {
        ...(title !== undefined && { title }),

        ...(authorName !== undefined && {
          authorName,
        }),

        ...(featuredImage !== undefined && {
          featuredImage,
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

    if (blocks !== undefined) {
      await tx.newsBlock.deleteMany({
        where: {
          newsId: id,
        },
      });

      if (blocks.length > 0) {
        await tx.newsBlock.createMany({
          data: blocks.map((block, index) => ({
            newsId: id,
            type: block.type,
            position: index,
            content: block.content as any,
          })),
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
      },
    });
  });
};


export const deleteNews = async (
  id: string,
) => {
  const news = await prisma.news.findUnique({
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