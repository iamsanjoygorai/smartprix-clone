import prisma from "../db/prisma";
import type { CreateProductInput } from "../validators/product.validator";

/* ============================================================
   DESCRIPTION CLEANER
   ============================================================ */

const cleanDescription = (html: string): string => {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
};

/* ============================================================
   EXTRACT FIRST MATCH
   ============================================================ */

const extractFirst = (
  text: string,
  patterns: RegExp[],
): string | undefined => {
  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return undefined;
};

/* ============================================================
   AUTOMATIC MOBILE SPECIFICATION PARSER
   ============================================================ */

const extractSpecificationsFromDescription = (
  description: string,
): Record<string, string> => {
  const text = cleanDescription(description);

  const detected: Record<string, string> = {};

  /* ==========================================================
     NETWORK
     ========================================================== */

  const network = extractFirst(text, [
    /\b(5G\s*(?:\/|,|and)\s*4G)\b/i,
    /\b(4G\s*(?:\/|,|and)\s*3G)\b/i,
    /\b(5G)\b/i,
    /\b(4G)\b/i,
  ]);

  if (network) {
    detected["network"] = network;
  }

  /* ==========================================================
     4G
     ========================================================== */

  if (/\b4G\b/i.test(text)) {
    detected["4g"] = "Yes";
  }

  /* ==========================================================
     5G
     ========================================================== */

  if (/\b5G\b/i.test(text)) {
    detected["5g"] = "Yes";
  }

  /* ==========================================================
     OPERATING SYSTEM
     ========================================================== */

  const operatingSystem = extractFirst(text, [
    /\b(iOS\s+\d+(?:\.\d+)?)\b/i,
    /\b(Android\s+\d+(?:\.\d+)?)\b/i,
    /\b(HarmonyOS\s+\d+(?:\.\d+)?)\b/i,
    /\b(HyperOS\s+\d+(?:\.\d+)?)\b/i,
    /\b(One UI\s+\d+(?:\.\d+)?)\b/i,
  ]);

  if (operatingSystem) {
    detected["operating-system"] = operatingSystem;
  }

  /* ==========================================================
     OS VERSION
     ========================================================== */

  const osVersion = extractFirst(text, [
    /\biOS\s+(\d+(?:\.\d+)?)\b/i,
    /\bAndroid\s+(\d+(?:\.\d+)?)\b/i,
    /\bHarmonyOS\s+(\d+(?:\.\d+)?)\b/i,
    /\bHyperOS\s+(\d+(?:\.\d+)?)\b/i,
    /\bOne UI\s+(\d+(?:\.\d+)?)\b/i,
  ]);

  if (osVersion) {
    detected["os-version"] = osVersion;
  }

  /* ==========================================================
     CHIPSET
     ========================================================== */

  const chipset = extractFirst(text, [
    /\b(Apple\s+A\d+(?:\s+(?:Pro|Max|Ultra))?)\b/i,

    /\b(Qualcomm\s+Snapdragon\s+[\w\s-]+?)(?=\s+(?:with|and|,|\.|$))/i,

    /\b(Snapdragon\s+[\w\s-]+?)(?=\s+(?:with|and|,|\.|$))/i,

    /\b(MediaTek\s+Dimensity\s+[\w\s-]+?)(?=\s+(?:with|and|,|\.|$))/i,

    /\b(MediaTek\s+Helio\s+[\w\s-]+?)(?=\s+(?:with|and|,|\.|$))/i,

    /\b(Exynos\s+[\w-]+)\b/i,

    /\b(Tensor\s+G\d+)\b/i,

    /\b(Kirin\s+[\w-]+)\b/i,

    /\b(Unisoc\s+[\w-]+)\b/i,
  ]);

  if (chipset) {
    detected["chipset"] = chipset;
  }

  /* ==========================================================
     PROCESSOR
     ========================================================== */

  const processor = extractFirst(text, [
    /\b(Apple\s+A\d+(?:\s+(?:Pro|Max|Ultra))?)\b/i,

    /\b(Qualcomm\s+Snapdragon\s+[\w\s-]+?)(?=\s+(?:with|and|,|\.|$))/i,

    /\b(Snapdragon\s+[\w\s-]+?)(?=\s+(?:with|and|,|\.|$))/i,

    /\b(MediaTek\s+Dimensity\s+[\w\s-]+?)(?=\s+(?:with|and|,|\.|$))/i,

    /\b(MediaTek\s+Helio\s+[\w\s-]+?)(?=\s+(?:with|and|,|\.|$))/i,

    /\b(Exynos\s+[\w-]+)\b/i,

    /\b(Tensor\s+G\d+)\b/i,

    /\b(Kirin\s+[\w-]+)\b/i,

    /\b(Unisoc\s+[\w-]+)\b/i,
  ]);

  if (processor) {
    detected["processor"] = processor;
  }

  /* ==========================================================
     RAM
     ========================================================== */

  const ram = extractFirst(text, [
    /\b(\d+(?:\.\d+)?)\s*GB\s*RAM\b/i,
    /\bRAM\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*GB\b/i,
    /\b(\d+(?:\.\d+)?)\s*GB\s+of\s+RAM\b/i,
    /\bwith\s+(\d+(?:\.\d+)?)\s*GB\s+RAM\b/i,
  ]);

  if (ram) {
    detected["ram"] = ram;
  }

  /* ==========================================================
     STORAGE
     ========================================================== */

  const storageMatch = text.match(
    /\b(\d+(?:\.\d+)?)\s*(GB|TB)\s+(?:internal\s+)?storage\b/i,
  );

  if (storageMatch) {
    let value = Number(storageMatch[1]);

    if (storageMatch[2].toUpperCase() === "TB") {
      value *= 1024;
    }

    detected["storage"] = String(value);
  } else {
    const alternativeStorage = extractFirst(text, [
      /\bstorage\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:GB|TB)\b/i,
      /\b(\d+(?:\.\d+)?)\s*(?:GB|TB)\s+ROM\b/i,
    ]);

    if (alternativeStorage) {
      detected["storage"] = alternativeStorage;
    }
  }

  /* ==========================================================
     DISPLAY TYPE

     IMPORTANT:
     More specific display technologies must come BEFORE
     generic AMOLED/OLED/LCD detection.
     ========================================================== */

  const displayType = extractFirst(text, [
    /\b(Dynamic\s+AMOLED\s+2X)\b/i,
    /\b(Dynamic\s+AMOLED)\b/i,
    /\b(Super\s+AMOLED\s+Plus)\b/i,
    /\b(Super\s+AMOLED)\b/i,
    /\b(LTPO\s+AMOLED)\b/i,
    /\b(LTPO\s+OLED)\b/i,
    /\b(P-?OLED)\b/i,
    /\b(POLED)\b/i,
    /\b(AMOLED)\b/i,
    /\b(OLED)\b/i,
    /\b(IPS\s+LCD)\b/i,
    /\b(TFT\s+LCD)\b/i,
    /\b(LCD)\b/i,
  ]);

  if (displayType) {
    detected["display-type"] = displayType;
  }

  /* ==========================================================
     SCREEN SIZE
     ========================================================== */

  const screenSize = extractFirst(text, [
    /\b(\d+(?:\.\d+)?)\s*inches?\b/i,
    /\b(\d+(?:\.\d+)?)\s*inch\b/i,
    /\b(\d+(?:\.\d+)?)"\b/i,
  ]);

  if (screenSize) {
    detected["screen-size"] = `${screenSize} inches`;
  }

  /* ==========================================================
     REFRESH RATE
     ========================================================== */

  const refreshRate = extractFirst(text, [
    /\b(\d+(?:\.\d+)?)\s*Hz\s+refresh\s+rate\b/i,
    /\brefresh\s+rate\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*Hz\b/i,
    /\b(\d+(?:\.\d+)?)\s*Hz\b/i,
  ]);

  if (refreshRate) {
    detected["refresh-rate"] = `${refreshRate} Hz`;
  }

  /* ==========================================================
     RESOLUTION
     ========================================================== */

  const resolution = extractFirst(text, [
    /\b(\d{3,5}\s*[x×]\s*\d{3,5}\s*px)\b/i,
    /\b(\d{3,5}\s*[x×]\s*\d{3,5})\b/i,
    /\b(Full HD\+?)\b/i,
    /\b(QHD\+?)\b/i,
    /\b(2K)\b/i,
    /\b(4K)\b/i,
  ]);

  if (resolution) {
    detected["resolution"] = resolution;
  }

  /* ==========================================================
     MAIN / REAR CAMERA

     Supports:
     50 MP + 50 MP Dual rear camera
     50 MP + 12 MP + 10 MP Triple rear camera
     200 MP main camera
     ========================================================== */

  const mainCamera = extractFirst(text, [
    /\b((?:\d+(?:\.\d+)?\s*MP)(?:\s*\+\s*\d+(?:\.\d+)?\s*MP){1,3})\s+(?:Dual|Triple|Quad)?\s*rear\s+camera\b/i,

    /\b((?:\d+(?:\.\d+)?\s*MP)(?:\s*\+\s*\d+(?:\.\d+)?\s*MP){1,3})\s+(?:Dual|Triple|Quad)?\s+camera\b/i,

    /\b(\d+(?:\.\d+)?\s*MP)\s+(?:main|primary|rear)\s+camera\b/i,

    /\brear\s+camera\s*[:\-]?\s*((?:\d+(?:\.\d+)?\s*MP)(?:\s*\+\s*\d+(?:\.\d+)?\s*MP){0,3})\b/i,
  ]);

  if (mainCamera) {
    detected["main-camera"] = mainCamera;
  }

  /* ==========================================================
     FRONT CAMERA

     Supports:
     10 MP front camera
     10 MP + 10 MP Dual front camera
     32 MP selfie camera
     ========================================================== */

  const frontCamera = extractFirst(text, [
    /\b((?:\d+(?:\.\d+)?\s*MP)(?:\s*\+\s*\d+(?:\.\d+)?\s*MP){1,3})\s+(?:Dual|Triple|Quad)?\s*front\s+camera\b/i,

    /\b(\d+(?:\.\d+)?\s*MP)\s+(?:front|selfie)\s+camera\b/i,

    /\b(?:front|selfie)\s+camera\s*[:\-]?\s*((?:\d+(?:\.\d+)?\s*MP)(?:\s*\+\s*\d+(?:\.\d+)?\s*MP){0,3})\b/i,
  ]);

  if (frontCamera) {
    detected["front-camera"] = frontCamera;
  }

  /* ==========================================================
     BATTERY CAPACITY
     ========================================================== */

  const batteryCapacity = extractFirst(text, [
    /\b(\d+(?:,\d+)?)\s*mAh\s+Battery\b/i,
    /\bBattery\s*[:\-]?\s*(\d+(?:,\d+)?)\s*mAh\b/i,
    /\b(\d+(?:,\d+)?)\s*mAh\b/i,
  ]);

  if (batteryCapacity) {
    detected["battery-capacity"] = batteryCapacity.replace(/,/g, "");
  }

  /* ==========================================================
     FAST CHARGING / CHARGING WATTAGE
     ========================================================== */

  const chargingWattage = extractFirst(text, [
    /\b(\d+(?:\.\d+)?)\s*W\s+(?:fast\s+)?charging\b/i,
    /\bfast\s+charging\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*W\b/i,
    /\b(\d+(?:\.\d+)?)\s*W\s+charging\b/i,
  ]);

  if (chargingWattage) {
    detected["fast-charging"] = `${chargingWattage}W`;
    detected["charging-wattage"] = chargingWattage;
  } else if (/\bfast\s+charging\b/i.test(text)) {
    detected["fast-charging"] = "Yes";
  }

  /* ==========================================================
     WIRELESS CHARGING
     ========================================================== */

  const wirelessWattage = extractFirst(text, [
    /\b(\d+(?:\.\d+)?)\s*W\s+wireless\s+charging\b/i,
    /\bwireless\s+charging\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*W\b/i,
  ]);

  if (wirelessWattage) {
    detected["wireless-charging"] = "Yes";
    detected["wireless-charging-wattage"] = wirelessWattage;
  } else if (/\bwireless\s+charging\b/i.test(text)) {
    detected["wireless-charging"] = "Yes";
  }

  /* ==========================================================
     REVERSE WIRELESS CHARGING
     ========================================================== */

  if (/\breverse\s+wireless\s+charging\b/i.test(text)) {
    detected["reverse-wireless-charging"] = "Yes";
  }

  /* ==========================================================
     NFC
     ========================================================== */

  if (/\bNFC\b/i.test(text)) {
    detected["nfc"] = "Yes";
  }

  /* ==========================================================
     IP RATING
     ========================================================== */

  const ipRating = extractFirst(text, [
    /\b(IP\d{2,3})\s+Rating\b/i,
    /\b(IP\d{2,3})\b/i,
  ]);

  if (ipRating) {
    detected["ip-rating"] = ipRating.toUpperCase();
  }

  /* ==========================================================
     USB OTG
     ========================================================== */

  if (
    /\bUSB\s+OTG\b/i.test(text) ||
    /\bUSB\s+on[-\s]?the[-\s]?go\b/i
  ) {
    detected["usb-otg"] = "Yes";
  }

  /* ==========================================================
     USB TYPE
     ========================================================== */

  const usbType = extractFirst(text, [
    /\b(USB[-\s]?Type[-\s]?C)\b/i,
    /\b(Type[-\s]?C)\s+USB\b/i,
  ]);

  if (usbType) {
    detected["usb-type"] = "USB Type-C";
  }

  /* ==========================================================
     OIS
     ========================================================== */

  if (
    /\bOIS\b/i.test(text) ||
    /\boptical\s+image\s+stabilization\b/i.test(text)
  ) {
    detected["ois"] = "Yes";
  }

  /* ==========================================================
     AUTOFOCUS
     ========================================================== */

  if (
    /\bautofocus\b/i.test(text) ||
    /\bauto\s+focus\b/i.test(text)
  ) {
    detected["autofocus"] = "Yes";
  }

  /* ==========================================================
     DUAL SIM
     ========================================================== */

  if (/\bdual\s+SIM\b/i.test(text)) {
    detected["dual-sim"] = "Yes";
    detected["number-of-sims"] = "2";
  }

  /* ==========================================================
     eSIM
     ========================================================== */

  if (/\beSIM\b/i.test(text)) {
    detected["esim"] = "Yes";
  }

  /* ==========================================================
     BLUETOOTH
     ========================================================== */

  const bluetooth = extractFirst(text, [
    /\bBluetooth\s*(?:v|version)?\s*(\d+(?:\.\d+)?)\b/i,
  ]);

  if (bluetooth) {
    detected["bluetooth"] = `v${bluetooth}`;
    detected["bluetooth-version"] = bluetooth;
  }

  /* ==========================================================
     WIFI
     ========================================================== */

  const wifi = extractFirst(text, [
    /\b(Wi[-\s]?Fi\s+\d+(?:\.\d+)?)\b/i,
    /\b(Wi[-\s]?Fi\s+[a-z0-9-]+)\b/i,
  ]);

  if (wifi) {
    detected["wifi"] = wifi.replace(/\s+/g, " ").trim();
  }

  /* ==========================================================
     GPS
     ========================================================== */

  if (/\bGPS\b/i.test(text)) {
    detected["gps"] = "Yes";
  }

  /* ==========================================================
     MEMORY CARD
     ========================================================== */

  if (
    /\bmemory\s+card\b/i.test(text) ||
    /\bexpandable\s+storage\b/i.test(text) ||
    /\bmicroSD\b/i.test(text) ||
    /\bmicro\s*SD\b/i.test(text)
  ) {
    detected["memory-card"] = "Yes";
    detected["expandable-storage"] = "Yes";
  }

  /* ==========================================================
     STEREO SPEAKERS
     ========================================================== */

  if (/\bstereo\s+speakers?\b/i.test(text)) {
    detected["stereo-speakers"] = "Yes";
  }

  /* ==========================================================
     DOLBY ATMOS
     ========================================================== */

  if (/\bDolby\s+Atmos\b/i.test(text)) {
    detected["dolby-atmos"] = "Yes";
  }

  /* ==========================================================
     HDR10+
     ========================================================== */

  if (/\bHDR10\+\b/i.test(text)) {
    detected["hdr10-plus"] = "Yes";
    detected["hdr"] = "Yes";
  } else if (/\bHDR\b/i.test(text)) {
    detected["hdr"] = "Yes";
  }

  /* ==========================================================
     RETURN
     ========================================================== */

  return detected;
};

/* ============================================================
   MERGE AUTOMATIC + MANUAL SPECIFICATIONS
   ============================================================ */

const buildFinalSpecifications = (
  description: string,
  manualSpecifications: Record<string, string>,
): Record<string, string> => {
  const automaticSpecifications =
    extractSpecificationsFromDescription(description);

  const cleanedManualSpecifications: Record<string, string> = {};

  for (const [slug, value] of Object.entries(
    manualSpecifications ?? {},
  )) {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      cleanedManualSpecifications[slug] = String(value).trim();
    }
  }

  /*
   * Automatic values first.
   *
   * Manual values second.
   *
   * Therefore manual values always win.
   */

  return {
    ...automaticSpecifications,
    ...cleanedManualSpecifications,
  };
};

/* ============================================================
   CREATE PRODUCT
   ============================================================ */

export const createAdminProduct = async (
  input: CreateProductInput,
) => {
  const {
    name,
    description,
    brandSlug,
    categorySlug,
    images,
    price,
    sellerSlug,
    specifications,
  } = input;

  /* ==========================================================
     BRAND
     ========================================================== */

  const brand = await prisma.brand.findUnique({
    where: {
      slug: brandSlug,
    },
  });

  if (!brand) {
    throw new Error("Brand not found");
  }

  /* ==========================================================
     CATEGORY
     ========================================================== */

  const category = await prisma.category.findUnique({
    where: {
      slug: categorySlug,
    },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  /* ==========================================================
     SELLER
     ========================================================== */

  const seller = await prisma.seller.findUnique({
    where: {
      slug: sellerSlug,
    },
  });

  if (!seller) {
    throw new Error("Seller not found");
  }

  /* ==========================================================
     SLUG
     ========================================================== */

  const slug = `${name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${Date.now()}`;

  /* ==========================================================
     FINAL SPECIFICATIONS
     ========================================================== */

  const finalSpecifications = buildFinalSpecifications(
    description ?? "",
    specifications ?? {},
  );

  console.log(
    "\n==============================================",
  );

  console.log(
    "AUTOMATIC + MANUAL PRODUCT SPECIFICATIONS",
  );

  console.log(
    "==============================================",
  );

  console.log(finalSpecifications);

  console.log(
    "==============================================\n",
  );

  /* ==========================================================
     DATABASE TRANSACTION
     ========================================================== */

  return prisma.$transaction(async (tx) => {
    /* ========================================================
       CREATE PRODUCT
       ======================================================== */

    const product = await tx.product.create({
      data: {
        name,
        slug,
        description,
        brandId: brand.id,
        categoryId: category.id,
        isActive: true,
      },
    });

    /* ========================================================
       CREATE IMAGES
       ======================================================== */

    if (images && images.length > 0) {
      for (const [index, image] of images.entries()) {
        await tx.productImage.create({
          data: {
            productId: product.id,
            url: image,
            sortOrder: index,
            isPrimary: index === 0,
          },
        });
      }
    }

    /* ========================================================
       CREATE PRICE
       ======================================================== */

    await tx.price.create({
      data: {
        productId: product.id,
        sellerId: seller.id,
        amount: price,
        currency: "INR",
        inStock: true,
      },
    });

    /* ========================================================
       CREATE SPECIFICATIONS
       ======================================================== */

    for (const [
      specificationSlug,
      specificationValue,
    ] of Object.entries(finalSpecifications)) {
      if (
        specificationValue === undefined ||
        specificationValue === null ||
        String(specificationValue).trim() === ""
      ) {
        continue;
      }

      /* ======================================================
         FIND SPECIFICATION DEFINITION
         ====================================================== */

      const specification =
        await tx.specification.findUnique({
          where: {
            slug: specificationSlug,
          },
        });

      /* ======================================================
         AUTOMATIC SPEC NOT IN DB
         ====================================================== */

      if (!specification) {
        const wasManuallyEntered =
          Object.prototype.hasOwnProperty.call(
            specifications ?? {},
            specificationSlug,
          );

        if (wasManuallyEntered) {
          throw new Error(
            `Specification not found: ${specificationSlug}`,
          );
        }

        console.warn(
          `Skipping automatic specification "${specificationSlug}" because it does not exist in the database.`,
        );

        continue;
      }

      /* ======================================================
         NORMALIZE VALUE
         ====================================================== */

      const normalizedValue =
        String(specificationValue).trim();

      /* ======================================================
         FIND EXISTING VALUE
         ====================================================== */

      let value =
        await tx.specificationValue.findFirst({
          where: {
            specificationId: specification.id,
            value: normalizedValue,
          },
        });

      /* ======================================================
         CREATE VALUE
         ====================================================== */

      if (!value) {
        value =
          await tx.specificationValue.create({
            data: {
              specificationId: specification.id,
              value: normalizedValue,
            },
          });
      }

      /* ======================================================
         CREATE PRODUCT SPECIFICATION
         ====================================================== */

      await tx.productSpecification.create({
        data: {
          productId: product.id,
          specificationId: specification.id,
          valueId: value.id,
        },
      });
    }

    /* ========================================================
       RETURN COMPLETE PRODUCT
       ======================================================== */

    return tx.product.findUnique({
      where: {
        id: product.id,
      },
      include: {
        brand: true,

        category: true,

        images: {
          orderBy: {
            sortOrder: "asc",
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

        prices: {
          include: {
            seller: true,
          },
        },
      },
    });
  });
};