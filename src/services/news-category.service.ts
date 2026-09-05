import prisma from "../db/prisma";

function createSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function getAllNewsCategories() {
  return prisma.newsCategory.findMany({
    include: {
      _count: {
        select: {
          posts: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getNewsCategoryById(id: string) {
  return prisma.newsCategory.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });
}

export async function createNewsCategory(
  name: string,
  description?: string
) {
  const slug = createSlug(name);

  return prisma.newsCategory.create({
    data: {
      name: name.trim(),
      slug,
      description: description?.trim() || null,
    },
    include: {
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });
}

export async function updateNewsCategory(
  id: string,
  name: string,
  description?: string
) {
  const slug = createSlug(name);

  return prisma.newsCategory.update({
    where: { id },
    data: {
      name: name.trim(),
      slug,
      description: description?.trim() || null,
    },
    include: {
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });
}

export async function deleteNewsCategory(id: string) {
  return prisma.newsCategory.delete({
    where: { id },
  });
}