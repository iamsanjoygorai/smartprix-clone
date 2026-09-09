import prisma from "../db/prisma";
import { Prisma } from "@prisma/client";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const toStringArray = (value: unknown): string[] => {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeSearchText = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const getSearchTokens = (value: string): string[] => {
  return normalizeSearchText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
};

const specificationSlugs: Record<string, string[]> = {
  display: [
    "display",
    "display-type",
    "screen",
    "screen-type",
  ],

  screenSize: [
    "screen-size",
    "display-size",
    "display-size-inches",
  ],

  screenResolution: [
    "screen-resolution",
    "display-resolution",
    "resolution",
  ],

  rearCamera: [
    "rear-camera",
    "primary-camera",
    "main-camera",
    "camera",
  ],

  frontCamera: [
    "front-camera",
    "selfie-camera",
  ],

  cpu: [
    "cpu",
    "processor",
    "chipset",
  ],

  ram: [
    "ram",
    "memory",
  ],

  battery: [
    "battery",
    "battery-capacity",
    "battery-size",
  ],

  connectivity: [
    "connectivity",
    "network",
  ],

  features: [
    "features",
    "feature",
  ],

  operatingSystem: [
    "operating-system",
    "os",
  ],

  androidVersion: [
    "android-version",
    "android",
  ],

  inbuiltMemory: [
    "inbuilt-memory",
    "internal-storage",
    "storage",
    "rom",
  ],

  aspectRatio: [
    "aspect-ratio",
    "screen-aspect-ratio",
  ],

  refreshRate: [
    "refresh-rate",
    "screen-refresh-rate",
  ],

  cpuManufacturer: [
    "cpu-manufacturer",
    "processor-manufacturer",
    "chipset-manufacturer",
  ],

  gpuManufacturer: [
    "gpu-manufacturer",
    "graphics-processor",
    "gpu",
  ],

  ipRating: [
    "ip-rating",
    "water-resistance",
    "waterproof-rating",
  ],

  design: [
    "design",
    "phone-design",
  ],

  type: [
    "type",
    "phone-type",
    "device-type",
  ],
};

const laptopSpecificationSlugs: Record<string, string[]> = {
  processor: [
    "processor",
    "cpu",
    "chipset",
  ],

  ram: [
    "ram",
    "memory",
    "system-memory",
  ],

  storage: [
    "storage",
    "internal-storage",
    "inbuilt-storage",
    "ssd",
    "hard-disk",
    "hdd",
  ],

  graphics: [
    "graphics",
    "gpu",
    "graphics-processor",
    "graphic-card",
    "dedicated-graphics",
  ],

  screenSize: [
    "screen-size",
    "display-size",
    "display-size-inches",
    "screen",
  ],

  display: [
    "display",
    "screen",
    "display-type",
    "screen-type",
  ],

  operatingSystem: [
    "operating-system",
    "os",
  ],
};

// ─────────────────────────────────────────────
// SPECIFICATION SQL HELPERS
// ─────────────────────────────────────────────

const specificationText = Prisma.sql`
  LOWER(
    COALESCE(
      sv."value",
      ps."customValue",
      ''
    )
  )
`;

const specificationNumber = Prisma.sql`
  NULLIF(
    regexp_replace(
      COALESCE(
        sv."value",
        ps."customValue",
        ''
      ),
      '[^0-9.]+',
      '',
      'g'
    ),
    ''
  )::numeric
`;

const makeSpecificationCondition = (
  slugs: string[],
  condition: Prisma.Sql,
) => {
  return Prisma.sql`
    EXISTS (
      SELECT 1
      FROM "ProductSpecification" ps
      INNER JOIN "Specification" s
        ON s."id" = ps."specificationId"
      LEFT JOIN "SpecificationValue" sv
        ON sv."id" = ps."valueId"
      WHERE ps."productId" = p."id"
        AND s."slug" IN (${Prisma.join(slugs)})
        AND (${condition})
    )
  `;
};

const textEquals = (
  slugs: string[],
  values: string[],
) => {
  if (values.length === 0) {
    return null;
  }

  const conditions = values.map((value) =>
    makeSpecificationCondition(
      slugs,
      Prisma.sql`
        ${specificationText} = ${value.toLowerCase()}
      `,
    ),
  );

  return Prisma.sql`
    (${Prisma.join(conditions, " OR ")})
  `;
};

const textContains = (
  slugs: string[],
  values: string[],
) => {
  if (values.length === 0) {
    return null;
  }

  const conditions = values.map((value) =>
    makeSpecificationCondition(
      slugs,
      Prisma.sql`
        ${specificationText} LIKE ${`%${value.toLowerCase()}%`}
      `,
    ),
  );

  return Prisma.sql`
    (${Prisma.join(conditions, " OR ")})
  `;
};

const numericAtLeast = (
  slugs: string[],
  values: number[],
) => {
  if (values.length === 0) {
    return null;
  }

  const conditions = values.map((value) =>
    makeSpecificationCondition(
      slugs,
      Prisma.sql`
        ${specificationNumber} >= ${value}
      `,
    ),
  );

  return Prisma.sql`
    (${Prisma.join(conditions, " OR ")})
  `;
};

const numericRange = (
  slugs: string[],
  ranges: Array<[number, number | null]>,
) => {
  if (ranges.length === 0) {
    return null;
  }

  const conditions = ranges.map(([min, max]) => {
    const numberCondition =
      max === null
        ? Prisma.sql`
            ${specificationNumber} >= ${min}
          `
        : Prisma.sql`
            ${specificationNumber} >= ${min}
            AND ${specificationNumber} <= ${max}
          `;

    return makeSpecificationCondition(
      slugs,
      numberCondition,
    );
  });

  return Prisma.sql`
    (${Prisma.join(conditions, " OR ")})
  `;
};


// fuzzy-search function
const findSimilarProductIds = async (
  search: string,
): Promise<string[]> => {
  const normalizedSearch = normalizeSearchText(search);

  if (!normalizedSearch) {
    return [];
  }

  const rows = await prisma.$queryRaw<
  Array<{
    id: string;
    score: number;
  }>
>`
  WITH product_search AS (
    SELECT
      p."id",

      LOWER(COALESCE(p."name", '')) AS product_name,
      LOWER(COALESCE(b."name", '')) AS brand_name,

      LOWER(
        COALESCE(
          (
            SELECT STRING_AGG(
              CONCAT_WS(
                ' ',
                pv."name",
                pv."sku",
                pv."color",
                pv."storage",
                pv."ram"
              ),
              ' '
            )
            FROM "ProductVariant" pv
            WHERE pv."productId" = p."id"
          ),
          ''
        )
      ) AS variants

    FROM "Product" p

    INNER JOIN "Brand" b
      ON b."id" = p."brandId"

    WHERE p."isActive" = true
  ),

  scored AS (
    SELECT
      ps."id",

      (
        /* Exact product name */
        CASE
          WHEN ps.product_name ILIKE ${`%${normalizedSearch}%`}
          THEN 100
          ELSE 0
        END

        +

        /* Exact brand */
        CASE
          WHEN ps.brand_name ILIKE ${`%${normalizedSearch}%`}
          THEN 90
          ELSE 0
        END

        +

        /* Fuzzy product name */
        word_similarity(
          ${normalizedSearch},
          ps.product_name
        ) * 100

        +

        /* Fuzzy brand */
        word_similarity(
          ${normalizedSearch},
          ps.brand_name
        ) * 80

        +

        /* Fuzzy variants */
        word_similarity(
          ${normalizedSearch},
          ps.variants
        ) * 40

      ) AS score

    FROM product_search ps
  )

  SELECT
    "id",
    score
  FROM scored

  WHERE score >= 25

  ORDER BY score DESC

  LIMIT 500
`;

  return rows.map((row) => row.id);
};


// ─────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────


export const getProducts = async (
  query: Record<string, unknown>,
) => {
  // ─────────────────────────────────────────────
  // BASIC QUERY PARAMETERS
  // ─────────────────────────────────────────────

  const search =
    typeof query.search === "string" &&
    query.search.trim()
      ? query.search.trim()
      : undefined;

  const brands = toStringArray(query.brands);

  const category =
    typeof query.category === "string" &&
    query.category.trim()
      ? query.category.trim()
      : undefined;

  const minPrice = toNumber(query.minPrice);
  const maxPrice = toNumber(query.maxPrice);

  // ─────────────────────────────────────────────
  // NEW FILTER PARAMETERS
  // ─────────────────────────────────────────────

  const displays = toStringArray(query.displays);

  // ─────────────────────────────────────────────
// LAPTOP FILTER PARAMETERS
// ─────────────────────────────────────────────

const processors = toStringArray(
  query.processors,
);

const rams = toStringArray(
  query.rams,
);

const storages = toStringArray(
  query.storages,
);

const gpus = toStringArray(
  query.gpus,
);

  const availability = toStringArray(
    query.availability,
  );

  const types = toStringArray(query.types);

  const launchedWithin = toStringArray(
    query.launchedWithin,
  );

  const design = toStringArray(query.design);

  const screenSizes = toStringArray(
    query.screenSizes,
  );

  const screenResolution = toStringArray(
    query.screenResolution,
  );

  const rearCamera = toStringArray(
    query.rearCamera,
  );

  const frontCamera = toStringArray(
    query.frontCamera,
  );

  const cpu = toStringArray(query.cpu);

  const ram = toStringArray(query.ram);

  const batterySize = toStringArray(
    query.batterySize,
  );

  const connectivity = toStringArray(
    query.connectivity,
  );

  const features = toStringArray(
    query.features,
  );

  const operatingSystem = toStringArray(
    query.operatingSystem,
  );

  const androidVersion = toStringArray(
    query.androidVersion,
  );

  const inbuiltMemory = toStringArray(
    query.inbuiltMemory,
  );

  const priceDrop = toStringArray(
    query.priceDrop,
  );

  const aspectRatio = toStringArray(
    query.aspectRatio,
  );

  const refreshRate = toStringArray(
    query.refreshRate,
  );

  const cpuManufacturer = toStringArray(
    query.cpuManufacturer,
  );

  const gpuManufacturer = toStringArray(
    query.gpuManufacturer,
  );

  const ipRating = toStringArray(
    query.ipRating,
  );

  // ─────────────────────────────────────────────
  // PAGINATION
  // ─────────────────────────────────────────────

  const pageValue =
    typeof query.page === "string"
      ? Number(query.page)
      : 1;

  const limitValue =
    typeof query.limit === "string"
      ? Number(query.limit)
      : 20;

  const page =
    Number.isFinite(pageValue) &&
    pageValue > 0
      ? Math.floor(pageValue)
      : 1;

  const limit =
    Number.isFinite(limitValue) &&
    limitValue > 0 &&
    limitValue <= 100
      ? Math.floor(limitValue)
      : 20;

  const skip = (page - 1) * limit;

  // ─────────────────────────────────────────────
// SORTING
// ─────────────────────────────────────────────

// Frontend uses `sortBy`.
// Keep `sort` as a fallback for backward compatibility.
const sort =
  typeof query.sortBy === "string"
    ? query.sortBy
    : typeof query.sort === "string"
      ? query.sort
      : "relevance";

const normalizedSort = [
  "relevance",
  "score",
  "price-low",
  "price-high",
  "newest",
  "oldest",
  "name_asc",
  "name_desc",
].includes(sort)
  ? sort
  : "relevance";

  console.log("SORT DEBUG:", {
  requestedSort: sort,
  normalizedSort,
});


  // ─────────────────────────────────────────────
  // COMMON PRISMA FILTERS
  // ─────────────────────────────────────────────

  const commonWhere: Prisma.ProductWhereInput = {
    isActive: true,

  ...(category
      ? {
          category: {
            slug: category,
          },
        }
      : {}),

    ...(minPrice !== undefined ||
    maxPrice !== undefined
      ? {
          prices: {
            some: {
              inStock: true,
              amount: {
                ...(minPrice !== undefined
                  ? {
                      gte: minPrice,
                    }
                  : {}),
                ...(maxPrice !== undefined
                  ? {
                      lte: maxPrice,
                    }
                  : {}),
              },
            },
          },
        }
      : {}),
  };

  // ─────────────────────────────────────────────
  // BRAND FILTER
  // ─────────────────────────────────────────────

  const where: Prisma.ProductWhereInput = {
    ...commonWhere,

    ...(brands.length > 0
      ? {
          brand: {
            slug: {
              in: brands,
            },
          },
        }
      : {}),
  };


  // ─────────────────────────────────────────────
// SIMILAR / FUZZY SEARCH
// ─────────────────────────────────────────────

let similarProductIds: string[] | null = null;

if (search) {
  similarProductIds =
    await findSimilarProductIds(search);

  where.id = {
    in: similarProductIds,
  };
}


  // ─────────────────────────────────────────────
  // AVAILABILITY
  // ─────────────────────────────────────────────

  if (availability.includes("exclude-out-of-stock")) {
    where.prices = {
      some: {
        inStock: true,
      },
    };
  }

  if (availability.includes("upcoming")) {
    where.releaseDate = {
      gt: new Date(),
    };
  }

  if (availability.includes("exclude-upcoming")) {
    where.releaseDate = {
      lte: new Date(),
    };
  }

  // Exclude global products.
  //
  // Your schema does not currently contain a dedicated
  // "global" boolean/field, so this is intentionally
  // handled later if a global specification is present.
  if (availability.includes("exclude-global")) {
    const globalCondition = textEquals(
      ["availability", "market", "region"],
      ["global"],
    );

    if (globalCondition) {
      where.AND = [
        ...(where.AND
          ? Array.isArray(where.AND)
            ? where.AND
            : [where.AND]
          : []),
        {
          NOT: {
            // handled through raw ID filtering below
          },
        },
      ];
    }
  }

  // ─────────────────────────────────────────────
  // SQL SPECIFICATION FILTERS
  // ─────────────────────────────────────────────

  const sqlConditions: Prisma.Sql[] = [];

  // ─────────────────────────────────────────────
  // DISPLAY
  // ─────────────────────────────────────────────

  // ─────────────────────────────────────────────
// DISPLAY
// ─────────────────────────────────────────────

if (displays.length > 0) {
  if (category === "laptops") {
    // Laptop display filter represents screen-size ranges.
    const ranges: Array<
      [number, number | null]
    > = [];

    for (const value of displays) {
      switch (value) {
        case '13 - 14"':
        case "13-14":
        case "13-14-inch":
          ranges.push([13, 14]);
          break;

        case '15 - 15.6"':
        case "15-15.6":
        case "15-15.6-inch":
          ranges.push([15, 15.6]);
          break;

        case '16"':
        case "16":
        case "16-inch":
          ranges.push([16, 16]);
          break;

        case '17" and above':
        case "17-above":
        case "17-inch-above":
          ranges.push([17, null]);
          break;
      }
    }

    const screenSizeCondition = numericRange(
      laptopSpecificationSlugs.screenSize,
      ranges,
    );

    if (screenSizeCondition) {
      sqlConditions.push(screenSizeCondition);
    }
  } else {
    // Existing mobile display behaviour.
    const displayCondition = textContains(
      specificationSlugs.display,
      displays,
    );

    if (displayCondition) {
      sqlConditions.push(displayCondition);
    }
  }
}

  // ─────────────────────────────────────────────
  // TYPES
  // ─────────────────────────────────────────────

  if (types.length > 0) {
    const typeCondition = textContains(
      specificationSlugs.type,
      types,
    );

    if (typeCondition) {
      sqlConditions.push(typeCondition);
    }
  }

  // ─────────────────────────────────────────────
  // DESIGN
  // ─────────────────────────────────────────────

  if (design.length > 0) {
    const designCondition = textContains(
      specificationSlugs.design,
      design.map((value) =>
        value.replace(/-/g, " "),
      ),
    );

    if (designCondition) {
      sqlConditions.push(designCondition);
    }
  }

  // ─────────────────────────────────────────────
  // SCREEN SIZE
  // ─────────────────────────────────────────────

  if (screenSizes.length > 0) {
    const ranges: Array<
      [number, number | null]
    > = [];

    for (const value of screenSizes) {
      switch (value) {
        case "4-inch-below":
          ranges.push([0, 4]);
          break;

        case "4-4.7-inch":
          ranges.push([4, 4.7]);
          break;

        case "5-5.5-inch":
          ranges.push([5, 5.5]);
          break;

        case "5-6-inch":
          ranges.push([5, 6]);
          break;

        case "6-6.5-inch":
          ranges.push([6, 6.5]);
          break;

        case "6.5-inch-above":
          ranges.push([6.5, null]);
          break;
      }
    }

    const screenSizeCondition = numericRange(
      specificationSlugs.screenSize,
      ranges,
    );

    if (screenSizeCondition) {
      sqlConditions.push(screenSizeCondition);
    }
  }

  // ─────────────────────────────────────────────
  // SCREEN RESOLUTION
  // ─────────────────────────────────────────────

  if (screenResolution.length > 0) {
    const resolutionMap: Record<
      string,
      string[]
    > = {
      "4096x2160": ["4096", "2160"],
      "2048x1536": ["2048", "1536"],
      "1920x1080": ["1920", "1080"],
      "1280x720": ["1280", "720"],
    };

    const resolutionConditions: Prisma.Sql[] = [];

    for (const value of screenResolution) {
      const parts = resolutionMap[value];

      if (!parts) continue;

      resolutionConditions.push(
        makeSpecificationCondition(
          specificationSlugs.screenResolution,
          Prisma.sql`
            ${specificationText} LIKE ${`%${parts[0]}%`}
            AND ${specificationText} LIKE ${`%${parts[1]}%`}
          `,
        ),
      );
    }

    if (
      screenResolution.includes("high-ppi")
    ) {
      resolutionConditions.push(
        makeSpecificationCondition(
          specificationSlugs.screenResolution,
          Prisma.sql`
            ${specificationText} LIKE '%ppi%'
          `,
        ),
      );
    }

    if (resolutionConditions.length > 0) {
      sqlConditions.push(
        Prisma.sql`
          (${Prisma.join(
            resolutionConditions,
            " OR ",
          )})
        `,
      );
    }
  }

  // ─────────────────────────────────────────────
  // REAR CAMERA
  // ─────────────────────────────────────────────

  if (rearCamera.length > 0) {
    const conditions: Prisma.Sql[] = [];

    for (const value of rearCamera) {
      switch (value) {
        case "rear-camera":
          conditions.push(
            makeSpecificationCondition(
              specificationSlugs.rearCamera,
              Prisma.sql`
                ${specificationText} NOT LIKE '%no rear%'
              `,
            ),
          );
          break;

        case "dual-camera":
          conditions.push(
            makeSpecificationCondition(
              specificationSlugs.rearCamera,
              Prisma.sql`
                ${specificationText} LIKE '%dual%'
              `,
            ),
          );
          break;

        case "triple-camera":
          conditions.push(
            makeSpecificationCondition(
              specificationSlugs.rearCamera,
              Prisma.sql`
                ${specificationText} LIKE '%triple%'
              `,
            ),
          );
          break;

        case "quad-camera":
          conditions.push(
            makeSpecificationCondition(
              specificationSlugs.rearCamera,
              Prisma.sql`
                ${specificationText} LIKE '%quad%'
              `,
            ),
          );
          break;

        case "no-rear-camera":
          conditions.push(
            makeSpecificationCondition(
              specificationSlugs.rearCamera,
              Prisma.sql`
                ${specificationText} LIKE '%no%'
              `,
            ),
          );
          break;

        case "autofocus":
          conditions.push(
            makeSpecificationCondition(
              specificationSlugs.rearCamera,
              Prisma.sql`
                ${specificationText} LIKE '%autofocus%'
              `,
            ),
          );
          break;

        case "flash":
          conditions.push(
            makeSpecificationCondition(
              specificationSlugs.rearCamera,
              Prisma.sql`
                ${specificationText} LIKE '%flash%'
              `,
            ),
          );
          break;

        case "ois":
          conditions.push(
            makeSpecificationCondition(
              specificationSlugs.rearCamera,
              Prisma.sql`
                ${specificationText} LIKE '%ois%'
              `,
            ),
          );
          break;
      }
    }

    const thresholds: Record<
      string,
      number
    > = {
      "5mp-above": 5,
      "13mp-above": 13,
      "16mp-above": 16,
      "20mp-above": 20,
      "48mp-above": 48,
      "64mp-above": 64,
      "108mp-above": 108,
      "200mp-above": 200,
    };

    for (const value of rearCamera) {
      const threshold = thresholds[value];

      if (threshold !== undefined) {
        const condition = numericAtLeast(
          specificationSlugs.rearCamera,
          [threshold],
        );

        if (condition) {
          conditions.push(condition);
        }
      }
    }

    if (conditions.length > 0) {
      sqlConditions.push(
        Prisma.sql`
          (${Prisma.join(
            conditions,
            " OR ",
          )})
        `,
      );
    }
  }

  // ─────────────────────────────────────────────
  // FRONT CAMERA
  // ─────────────────────────────────────────────

  if (frontCamera.length > 0) {
    const conditions: Prisma.Sql[] = [];

    for (const value of frontCamera) {
      switch (value) {
        case "front-camera":
          conditions.push(
            makeSpecificationCondition(
              specificationSlugs.frontCamera,
              Prisma.sql`
                ${specificationText} NOT LIKE '%no%'
              `,
            ),
          );
          break;

        case "dual-front-camera":
          conditions.push(
            makeSpecificationCondition(
              specificationSlugs.frontCamera,
              Prisma.sql`
                ${specificationText} LIKE '%dual%'
              `,
            ),
          );
          break;

        case "front-camera-flash":
          conditions.push(
            makeSpecificationCondition(
              specificationSlugs.frontCamera,
              Prisma.sql`
                ${specificationText} LIKE '%flash%'
              `,
            ),
          );
          break;

        case "front-camera-autofocus":
          conditions.push(
            makeSpecificationCondition(
              specificationSlugs.frontCamera,
              Prisma.sql`
                ${specificationText} LIKE '%autofocus%'
              `,
            ),
          );
          break;
      }
    }

    const thresholds: Record<
      string,
      number
    > = {
      "front-5mp-above": 5,
      "front-8mp-above": 8,
      "front-12mp-above": 12,
      "front-16mp-above": 16,
      "front-32mp-above": 32,
    };

    for (const value of frontCamera) {
      const threshold = thresholds[value];

      if (threshold !== undefined) {
        const condition = numericAtLeast(
          specificationSlugs.frontCamera,
          [threshold],
        );

        if (condition) {
          conditions.push(condition);
        }
      }
    }

    if (conditions.length > 0) {
      sqlConditions.push(
        Prisma.sql`
          (${Prisma.join(
            conditions,
            " OR ",
          )})
        `,
      );
    }
  }

  // ─────────────────────────────────────────────
  // CPU
  // ─────────────────────────────────────────────

  if (cpu.length > 0) {
    const conditions: Prisma.Sql[] = [];

    const coreOptions: Record<
      string,
      string
    > = {
      "quad-core": "quad",
      "octa-core": "octa",
      "deca-core": "deca",
    };

    for (const value of cpu) {
      if (coreOptions[value]) {
        conditions.push(
          makeSpecificationCondition(
            specificationSlugs.cpu,
            Prisma.sql`
              ${specificationText}
              LIKE ${`%${coreOptions[value]}%`}
            `,
          ),
        );
      }
    }

    const ghzThresholds: Record<
      string,
      number
    > = {
      "1.4ghz-above": 1.4,
      "2ghz-above": 2,
      "2.3ghz-above": 2.3,
      "3ghz-above": 3,
    };

    for (const value of cpu) {
      const threshold = ghzThresholds[value];

      if (threshold !== undefined) {
        const condition = numericAtLeast(
          specificationSlugs.cpu,
          [threshold],
        );

        if (condition) {
          conditions.push(condition);
        }
      }
    }

    if (conditions.length > 0) {
      sqlConditions.push(
        Prisma.sql`
          (${Prisma.join(
            conditions,
            " OR ",
          )})
        `,
      );
    }
  }

  // ─────────────────────────────────────────────
  // RAM
  // ─────────────────────────────────────────────

  if (ram.length > 0) {
    const thresholds: Record<
      string,
      number
    > = {
      "2gb-above": 2,
      "3gb-above": 3,
      "4gb-above": 4,
      "6gb-above": 6,
      "8gb-above": 8,
      "12gb-above": 12,
    };

    const values = ram
      .map((value) => thresholds[value])
      .filter(
        (value): value is number =>
          value !== undefined,
      );

    const condition = numericAtLeast(
      specificationSlugs.ram,
      values,
    );

    if (condition) {
      sqlConditions.push(condition);
    }
  }

  // ─────────────────────────────────────────────
  // BATTERY
  // ─────────────────────────────────────────────

  if (batterySize.length > 0) {
    const conditions: Prisma.Sql[] = [];

    const thresholds: Record<
      string,
      number
    > = {
      "4000mah-above": 4000,
      "5000mah-above": 5000,
      "6000mah-above": 6000,
      "7000mah-above": 7000,
    };

    for (const value of batterySize) {
      const threshold = thresholds[value];

      if (threshold !== undefined) {
        const condition = numericAtLeast(
          specificationSlugs.battery,
          [threshold],
        );

        if (condition) {
          conditions.push(condition);
        }
      }

      if (value === "removable-battery") {
        conditions.push(
          makeSpecificationCondition(
            specificationSlugs.battery,
            Prisma.sql`
              ${specificationText}
              LIKE '%removable%'
            `,
          ),
        );
      }

      if (value === "fast-charging") {
        conditions.push(
          makeSpecificationCondition(
            [
              ...specificationSlugs.battery,
              "charging",
              "fast-charging",
            ],
            Prisma.sql`
              ${specificationText}
              LIKE '%fast%'
            `,
          ),
        );
      }

      if (value === "long-battery-backup") {
        conditions.push(
          makeSpecificationCondition(
            specificationSlugs.battery,
            Prisma.sql`
              ${specificationText}
              LIKE '%long%'
            `,
          ),
        );
      }
    }

    if (conditions.length > 0) {
      sqlConditions.push(
        Prisma.sql`
          (${Prisma.join(
            conditions,
            " OR ",
          )})
        `,
      );
    }
  }

  // ─────────────────────────────────────────────
  // CONNECTIVITY
  // ─────────────────────────────────────────────

  if (connectivity.length > 0) {
    const conditions = connectivity.map(
      (value) => {
        const searchValue =
          value === "3.5mm-jack"
            ? "3.5"
            : value.replace(/-/g, " ");

        return makeSpecificationCondition(
          specificationSlugs.connectivity,
          Prisma.sql`
            ${specificationText}
            LIKE ${`%${searchValue}%`}
          `,
        );
      },
    );

    sqlConditions.push(
      Prisma.sql`
        (${Prisma.join(
          conditions,
          " OR ",
        )})
      `,
    );
  }

  // ─────────────────────────────────────────────
  // FEATURES
  // ─────────────────────────────────────────────

  if (features.length > 0) {
    const conditions = features.map(
      (value) => {
        const searchValue =
          value.replace(/-/g, " ");

        return makeSpecificationCondition(
          specificationSlugs.features,
          Prisma.sql`
            ${specificationText}
            LIKE ${`%${searchValue}%`}
          `,
        );
      },
    );

    sqlConditions.push(
      Prisma.sql`
        (${Prisma.join(
          conditions,
          " OR ",
        )})
      `,
    );
  }

  // ─────────────────────────────────────────────
  // OPERATING SYSTEM
  // ─────────────────────────────────────────────

  if (operatingSystem.length > 0) {
    const condition = textContains(
      specificationSlugs.operatingSystem,
      operatingSystem,
    );

    if (condition) {
      sqlConditions.push(condition);
    }
  }

  // ─────────────────────────────────────────────
  // ANDROID VERSION
  // ─────────────────────────────────────────────

  if (androidVersion.length > 0) {
    const thresholds = androidVersion
      .map((value) => {
        const match =
          value.match(/android-(\d+)/);

        return match
          ? Number(match[1])
          : undefined;
      })
      .filter(
        (value): value is number =>
          value !== undefined,
      );

    const condition = numericAtLeast(
      specificationSlugs.androidVersion,
      thresholds,
    );

    if (condition) {
      sqlConditions.push(condition);
    }
  }

  // ─────────────────────────────────────────────
  // INBUILT MEMORY
  // ─────────────────────────────────────────────

  if (inbuiltMemory.length > 0) {
    const thresholds: Record<
      string,
      number
    > = {
      "32gb-above": 32,
      "64gb-above": 64,
      "128gb-above": 128,
      "256gb-above": 256,
      "512gb-above": 512,
    };

    const values = inbuiltMemory
      .map((value) => thresholds[value])
      .filter(
        (value): value is number =>
          value !== undefined,
      );

    const condition = numericAtLeast(
      specificationSlugs.inbuiltMemory,
      values,
    );

    if (condition) {
      sqlConditions.push(condition);
    }
  }

  // ─────────────────────────────────────────────
  // ASPECT RATIO
  // ─────────────────────────────────────────────

  if (aspectRatio.length > 0) {
    const condition = textEquals(
      specificationSlugs.aspectRatio,
      aspectRatio.map((value) =>
        value.replace("-", ":"),
      ),
    );

    if (condition) {
      sqlConditions.push(condition);
    }
  }

  // ─────────────────────────────────────────────
  // REFRESH RATE
  // ─────────────────────────────────────────────

  if (refreshRate.length > 0) {
    const values = refreshRate.map(
      (value) =>
        value.replace("hz", "") + "hz",
    );

    const condition = textContains(
      specificationSlugs.refreshRate,
      values,
    );

    if (condition) {
      sqlConditions.push(condition);
    }
  }

  // ─────────────────────────────────────────────
  // CPU MANUFACTURER
  // ─────────────────────────────────────────────

  if (cpuManufacturer.length > 0) {
    const condition = textContains(
      specificationSlugs.cpuManufacturer,
      cpuManufacturer.map((value) =>
        value.replace(/-/g, " "),
      ),
    );

    if (condition) {
      sqlConditions.push(condition);
    }
  }

  // ─────────────────────────────────────────────
// LAPTOP PROCESSOR
// ─────────────────────────────────────────────

if (
  category === "laptops" &&
  processors.length > 0
) {
  const conditions = processors.map(
    (value) => {
      const normalizedValue = value
        .replace(/\s+/g, " ")
        .trim();

      return makeSpecificationCondition(
        laptopSpecificationSlugs.processor,
        Prisma.sql`
          ${specificationText}
          LIKE ${`%${normalizedValue}%`}
        `,
      );
    },
  );

  if (conditions.length > 0) {
    sqlConditions.push(
      Prisma.sql`
        (${Prisma.join(
          conditions,
          " OR ",
        )})
      `,
    );
  }
}


// ─────────────────────────────────────────────
// LAPTOP RAM
// ─────────────────────────────────────────────

if (
  category === "laptops" &&
  rams.length > 0
) {
  const thresholds = rams
    .map((value) => {
      const match =
        value.match(/(\d+(?:\.\d+)?)\s*gb/i);

      return match
        ? Number(match[1])
        : undefined;
    })
    .filter(
      (value): value is number =>
        value !== undefined,
    );

  const ramCondition = numericAtLeast(
    laptopSpecificationSlugs.ram,
    thresholds,
  );

  if (ramCondition) {
    sqlConditions.push(ramCondition);
  }
}


// ─────────────────────────────────────────────
// LAPTOP STORAGE
// ─────────────────────────────────────────────

if (
  category === "laptops" &&
  storages.length > 0
) {
  const conditions: Prisma.Sql[] = [];

  for (const value of storages) {
    const normalizedValue = value
      .replace(/\s+/g, " ")
      .trim();

    const match = normalizedValue.match(
      /(\d+(?:\.\d+)?)\s*(tb|gb)/i,
    );

    if (match) {
      const amount = Number(match[1]);
      const unit = match[2].toLowerCase();

      const gbAmount =
        unit === "tb"
          ? amount * 1024
          : amount;

      conditions.push(
        makeSpecificationCondition(
          laptopSpecificationSlugs.storage,
          Prisma.sql`
            (
              ${specificationText}
              LIKE ${`%${normalizedValue}%`}
            )
            OR
            (
              ${specificationNumber}
              >= ${gbAmount}
              AND
              ${specificationText}
              LIKE '%ssd%'
            )
          `,
        ),
      );
    } else {
      conditions.push(
        makeSpecificationCondition(
          laptopSpecificationSlugs.storage,
          Prisma.sql`
            ${specificationText}
            LIKE ${`%${normalizedValue}%`}
          `,
        ),
      );
    }
  }

  if (conditions.length > 0) {
    sqlConditions.push(
      Prisma.sql`
        (${Prisma.join(
          conditions,
          " OR ",
        )})
      `,
    );
  }
}


// ─────────────────────────────────────────────
// LAPTOP GRAPHICS / GPU
// ─────────────────────────────────────────────

if (
  category === "laptops" &&
  gpus.length > 0
) {
  const conditions = gpus.map(
    (value) => {
      const normalizedValue = value
        .replace(/\s+/g, " ")
        .trim();

      return makeSpecificationCondition(
        laptopSpecificationSlugs.graphics,
        Prisma.sql`
          ${specificationText}
          LIKE ${`%${normalizedValue}%`}
        `,
      );
    },
  );

  if (conditions.length > 0) {
    sqlConditions.push(
      Prisma.sql`
        (${Prisma.join(
          conditions,
          " OR ",
        )})
      `,
    );
  }
}

  // ─────────────────────────────────────────────
  // GPU MANUFACTURER
  // ─────────────────────────────────────────────

  if (gpuManufacturer.length > 0) {
    const condition = textContains(
      specificationSlugs.gpuManufacturer,
      gpuManufacturer.map((value) =>
        value.replace(/-/g, " "),
      ),
    );

    if (condition) {
      sqlConditions.push(condition);
    }
  }

  // ─────────────────────────────────────────────
  // IP RATING
  // ─────────────────────────────────────────────

  if (ipRating.length > 0) {
    const condition = textContains(
      specificationSlugs.ipRating,
      ipRating,
    );

    if (condition) {
      sqlConditions.push(condition);
    }
  }

  // ─────────────────────────────────────────────
  // LAUNCHED WITHIN
  // ─────────────────────────────────────────────

  if (launchedWithin.length > 0) {
    const now = new Date();

    const dates: Date[] = [];

    for (const value of launchedWithin) {
      const months =
        value === "3-months"
          ? 3
          : value === "6-months"
            ? 6
            : value === "12-months"
              ? 12
              : null;

      if (months !== null) {
        const date = new Date(now);
        date.setMonth(
          date.getMonth() - months,
        );
        dates.push(date);
      }
    }

    if (dates.length > 0) {
      const earliestDate = new Date(
        Math.min(
          ...dates.map((date) =>
            date.getTime(),
          ),
        ),
      );

      where.releaseDate = {
        gte: earliestDate,
        lte: now,
      };
    }
  }

  // ─────────────────────────────────────────────
  // APPLY SQL SPECIFICATION FILTERS
  // ─────────────────────────────────────────────

  let filteredProductIds: string[] | null =
    null;

  if (sqlConditions.length > 0) {
    const sqlWhere = Prisma.sql`
      ${Prisma.join(
        sqlConditions,
        " AND ",
      )}
    `;

    const rows = await prisma.$queryRaw<
      Array<{ id: string }>
    >`
      SELECT p."id"
      FROM "Product" p
      WHERE p."isActive" = true
        AND ${sqlWhere}
    `;

    // ─────────────────────────────────────────────
// APPLY SQL SPECIFICATION FILTERS
// ─────────────────────────────────────────────

if (sqlConditions.length > 0) {
  const sqlWhere = Prisma.sql`
    ${Prisma.join(
      sqlConditions,
      " AND ",
    )}
  `;

  const rows = await prisma.$queryRaw<
    Array<{ id: string }>
  >`
    SELECT p."id"
    FROM "Product" p
    WHERE p."isActive" = true
      AND ${sqlWhere}
  `;

  filteredProductIds = rows.map(
    (row) => row.id,
  );

  // Intersect specification results
  // with fuzzy-search results.
  if (similarProductIds !== null) {
    const similarIdSet = new Set(
      similarProductIds,
    );

    filteredProductIds =
      filteredProductIds.filter(
        (id) => similarIdSet.has(id),
      );
  }

  where.id = {
    in: filteredProductIds,
  };
}

    if (sqlConditions.length > 0) {
  const sqlWhere = Prisma.sql`
    ${Prisma.join(
      sqlConditions,
      " AND ",
    )}
  `;

  const rows = await prisma.$queryRaw<
    Array<{ id: string }>
  >`
    SELECT p."id"
    FROM "Product" p
    WHERE p."isActive" = true
      AND ${sqlWhere}
  `;

  filteredProductIds = rows.map(
    (row) => row.id,
  );

  // Intersect specification results
  // with fuzzy-search results.
  if (similarProductIds !== null) {
    const similarIdSet = new Set(
      similarProductIds,
    );

    filteredProductIds =
      filteredProductIds.filter((id) =>
        similarIdSet.has(id),
      );
  }

  where.id = {
    in: filteredProductIds,
  };
}
  }

  // ─────────────────────────────────────────────
  // TOTAL
  // ─────────────────────────────────────────────

  const total = await prisma.product.count({
    where,
  });

  // ─────────────────────────────────────────────
  // BRAND COUNTS
  // ─────────────────────────────────────────────

  const brandCountRows =
  await prisma.product.groupBy({
    by: ["brandId"],
    where: commonWhere,
      _count: {
        _all: true,
      },
    });

  const brandIds = brandCountRows
    .map((item) => item.brandId)
    .filter(
      (id): id is string =>
        id !== null,
    );

  const brandRecords =
    brandIds.length > 0
      ? await prisma.brand.findMany({
          where: {
            id: {
              in: brandIds,
            },
          },
          select: {
            id: true,
            slug: true,
          },
        })
      : [];

  const brandMap = new Map(
    brandRecords.map((brand) => [
      brand.id,
      brand.slug,
    ]),
  );

  const brandCounts: Record<
    string,
    number
  > = {};

  for (const row of brandCountRows) {
    if (!row.brandId) continue;

    const slug = brandMap.get(
      row.brandId,
    );

    if (!slug) continue;

    brandCounts[slug] =
      row._count._all;
  }

  // ─────────────────────────────────────────────
  // PRODUCTS
  // ─────────────────────────────────────────────

  // ─────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────

let products;

// ─────────────────────────────────────────────
// RELEVANCE SORT
// ─────────────────────────────────────────────

if (
  similarProductIds !== null &&
  similarProductIds.length > 0 &&
  normalizedSort === "relevance"
) {
  // First get all IDs that satisfy the normal
  // Prisma filters.
  const matchingProducts =
    await prisma.product.findMany({
      where,
      select: {
        id: true,
      },
    });

  const matchingIdSet = new Set(
    matchingProducts.map(
      (product) => product.id,
    ),
  );

  // Preserve fuzzy-search ranking.
  const rankedIds =
    similarProductIds.filter((id) =>
      matchingIdSet.has(id),
    );

  const paginatedIds = rankedIds.slice(
    skip,
    skip + limit,
  );

  if (paginatedIds.length === 0) {
    products = [];
  } else {
    const fetchedProducts =
      await prisma.product.findMany({
        where: {
          id: {
            in: paginatedIds,
          },
        },
        include: {
          brand: true,
          category: true,

          reviews: {
            where: {
              isPublished: true,
            },
            select: {
              rating: true,
            },
          },

          images: {
            orderBy: {
              sortOrder: "asc",
            },
          },

          variants: true,

          prices: {
            where: {
              inStock: true,
            },
            include: {
              seller: true,
              variant: true,
            },
            orderBy: {
              amount: "asc",
            },
          },

          specifications: {
            include: {
              specification: true,
              value: true,
            },
            orderBy: {
              specification: {
                name: "asc",
              },
            },
          },
        },
      });

    // Prisma does not guarantee the order of
    // `WHERE id IN (...)`, so restore the
    // relevance order manually.
    const productMap = new Map(
      fetchedProducts.map((product) => [
        product.id,
        product,
      ]),
    );

    products = paginatedIds
      .map((id) => productMap.get(id))
      .filter(
        (
          product,
        ): product is NonNullable<
          typeof product
        > => Boolean(product),
      );
  }
} else {
  // ─────────────────────────────────────────────
  // SERVER-SIDE SORTING
  // ─────────────────────────────────────────────

  /*
   * For price and popularity sorting we must
   * calculate the values from related tables.
   *
   * Sorting is performed BEFORE pagination.
   */

  const sortableProducts =
    await prisma.product.findMany({
      where,

      select: {
        id: true,
        name: true,
        releaseDate: true,
        createdAt: true,

        prices: {
          where: {
            inStock: true,
          },
          select: {
            amount: true,
          },
        },

        reviews: {
          where: {
            isPublished: true,
          },
          select: {
            rating: true,
          },
        },

        _count: {
          select: {
            favorites: true,
          },
        },
      },
    });

  // ─────────────────────────────────────────────
  // CALCULATE SORT VALUE
  // ─────────────────────────────────────────────

  const sortedIds = sortableProducts
    .map((product) => {
      // Lowest available price.
      const prices = product.prices.map(
        (price) => Number(price.amount),
      );

      const lowestPrice =
        prices.length > 0
          ? Math.min(...prices)
          : Number.POSITIVE_INFINITY;

      // Average published review rating.
      const ratings =
        product.reviews
          .map((review) => review.rating)
          .filter(
            (rating) =>
              Number.isFinite(rating),
          );

      const averageRating =
        ratings.length > 0
          ? ratings.reduce(
              (sum, rating) =>
                sum + rating,
              0,
            ) / ratings.length
          : 0;

      /*
       * Popularity score:
       *
       * Rating is weighted strongly,
       * review count provides confidence,
       * favorites provide an additional
       * popularity signal.
       *
       * This is an internal ranking score.
       */
      const reviewCount =
        product.reviews.length;

      const favoriteCount =
        product._count.favorites;

      const popularityScore =
        averageRating * 20 +
        reviewCount * 2 +
        favoriteCount;

      return {
        id: product.id,
        name: product.name,
        releaseDate:
          product.releaseDate,
        createdAt:
          product.createdAt,
        lowestPrice,
        popularityScore,
      };
    })
    .sort((a, b) => {
      switch (normalizedSort) {
        // ─────────────────────────────────────
        // POPULARITY
        // ─────────────────────────────────────

        case "score":
          if (
            b.popularityScore !==
            a.popularityScore
          ) {
            return (
              b.popularityScore -
              a.popularityScore
            );
          }

          // Tie-breaker: newest product first.
          return (
            (b.releaseDate?.getTime() ??
              b.createdAt.getTime()) -
            (a.releaseDate?.getTime() ??
              a.createdAt.getTime())
          );

        // ─────────────────────────────────────
        // PRICE LOW → HIGH
        // ─────────────────────────────────────

        case "price-low":
          if (
            a.lowestPrice !==
            b.lowestPrice
          ) {
            return (
              a.lowestPrice -
              b.lowestPrice
            );
          }

          return a.name.localeCompare(
            b.name,
          );

        // ─────────────────────────────────────
        // PRICE HIGH → LOW
        // ─────────────────────────────────────

        case "price-high":
          if (
            a.lowestPrice !==
            b.lowestPrice
          ) {
            return (
              b.lowestPrice -
              a.lowestPrice
            );
          }

          return a.name.localeCompare(
            b.name,
          );

        // ─────────────────────────────────────
        // NEWEST
        // ─────────────────────────────────────

        case "newest":
          return (
            (b.releaseDate?.getTime() ??
              b.createdAt.getTime()) -
            (a.releaseDate?.getTime() ??
              a.createdAt.getTime())
          );

        // ─────────────────────────────────────
        // OLDEST
        // ─────────────────────────────────────

        case "oldest":
          return (
            (a.releaseDate?.getTime() ??
              a.createdAt.getTime()) -
            (b.releaseDate?.getTime() ??
              b.createdAt.getTime())
          );

        // ─────────────────────────────────────
        // NAME A → Z
        // ─────────────────────────────────────

        case "name_asc":
          return a.name.localeCompare(
            b.name,
          );

        // ─────────────────────────────────────
        // NAME Z → A
        // ─────────────────────────────────────

        case "name_desc":
          return b.name.localeCompare(
            a.name,
          );

        // ─────────────────────────────────────
        // RELEVANCE / DEFAULT
        // ─────────────────────────────────────

        case "relevance":
        default:
          return (
            b.createdAt.getTime() -
            a.createdAt.getTime()
          );
      }
    })
    .map((product) => product.id);

  // ─────────────────────────────────────────────
  // PAGINATE AFTER SORTING
  // ─────────────────────────────────────────────

 console.log(
  "SORT RESULT:",
  normalizedSort,
  sortableProducts
    .map((product) => {
      const prices = product.prices
        .map((price) => Number(price.amount))
        .filter((price) => Number.isFinite(price));

      const lowestPrice =
        prices.length > 0
          ? Math.min(...prices)
          : null;

      return {
        name: product.name,
        price: lowestPrice,
        releaseDate: product.releaseDate,
        createdAt: product.createdAt,
      };
    })
    .sort((a, b) => {
      if (
        normalizedSort === "price-low" ||
        normalizedSort === "price-high"
      ) {
        if (a.price === null) return 1;
        if (b.price === null) return -1;

        return normalizedSort === "price-low"
          ? a.price - b.price
          : b.price - a.price;
      }

      return 0;
    })
    .slice(0, 10),
);

  const paginatedIds = sortedIds.slice(
    skip,
    skip + limit,
  );

  if (paginatedIds.length === 0) {
    products = [];
  } else {
    // ───────────────────────────────────────────
    // FETCH ONLY THE CURRENT PAGE
    // ───────────────────────────────────────────

    const fetchedProducts =
      await prisma.product.findMany({
        where: {
          id: {
            in: paginatedIds,
          },
        },

        include: {
          brand: true,
          category: true,

          reviews: {
            where: {
              isPublished: true,
            },
            select: {
              rating: true,
            },
          },

          images: {
            orderBy: {
              sortOrder: "asc",
            },
          },

          variants: true,

          prices: {
            where: {
              inStock: true,
            },
            include: {
              seller: true,
              variant: true,
            },
            orderBy: {
              amount: "asc",
            },
          },

          specifications: {
            include: {
              specification: true,
              value: true,
            },
            orderBy: {
              specification: {
                name: "asc",
              },
            },
          },
        },
      });

    // Restore our calculated sort order.
    const productMap = new Map(
      fetchedProducts.map((product) => [
        product.id,
        product,
      ]),
    );

    products = paginatedIds
      .map((id) => productMap.get(id))
      .filter(
        (
          product,
        ): product is NonNullable<
          typeof product
        > => Boolean(product),
      );
  }
}

  // ─────────────────────────────────────────────
  // PAGINATION
  // ─────────────────────────────────────────────

  const totalPages =
    total === 0
      ? 0
      : Math.ceil(
          total / limit,
        );

  // ─────────────────────────────────────────────
  // RESPONSE
  // ─────────────────────────────────────────────

  return {
    products,

    pagination: {
      page,
      limit,
      total,
      totalPages,

      hasNextPage:
        totalPages > 0 &&
        page < totalPages,

      hasPreviousPage:
        page > 1 &&
        page <= totalPages,
    },

    brandCounts,
  };
};



export const getProductBySlug = async (slug: string) => {
return prisma.product.findUnique({
where: {
slug,
},
include: {
brand: true,
category: true,
images: {
orderBy: {
sortOrder: "asc",
},
},
variants: {
include: {
prices: {
include: {
seller: true,
},
orderBy: {
amount: "asc",
},
},
},
},
prices: {
include: {
seller: true,
variant: true,
},
orderBy: {
amount: "asc",
},
},
specifications: {
include: {
specification: true,
value: true,
},
orderBy: {
specification: {
name: "asc",
},
},
},
},
});
};

export const getProductPrices = async (productId: string) => {
return prisma.price.findMany({
where: {
productId,
inStock: true,
},
include: {
seller: true,
variant: true,
},
orderBy: {
amount: "asc",
},
});
};

export const getProductPriceHistory = async (
productId: string,
) => {
return prisma.price.findMany({
where: {
productId,
},
include: {
seller: true,
variant: true,
},
orderBy: {
recordedAt: "desc",
},
});
};

export const getProductSpecifications = async (
productId: string,
) => {
return prisma.productSpecification.findMany({
where: {
productId,
},
include: {
specification: true,
value: true,
},
orderBy: {
specification: {
name: "asc",
},
},
});
};
