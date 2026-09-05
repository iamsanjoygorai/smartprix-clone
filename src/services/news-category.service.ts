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
      parent: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          posts: true,
          children: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getNewsCategoryById(
  id: string
) {
  return prisma.newsCategory.findUnique({
    where: { id },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
        },
      },
      children: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
        orderBy: {
          name: "asc",
        },
      },
      _count: {
        select: {
          posts: true,
          children: true,
        },
      },
    },
  });
}

export async function createNewsCategory(
  name: string,
  description?: string,
  parentId?: string | null
) {
  const slug = createSlug(name);

  return prisma.newsCategory.create({
    data: {
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      parentId: parentId || null,
    },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          posts: true,
          children: true,
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