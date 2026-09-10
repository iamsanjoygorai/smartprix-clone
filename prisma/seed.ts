import { PrismaClient } from "@prisma/client";
import { PERMISSIONS } from "../src/config/permissions";
import { ROLES, ROLE_PERMISSIONS } from "../src/config/roles";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // ─────────────────────────────────────────────
  // CATEGORIES
  // ─────────────────────────────────────────────

  const mobiles = await prisma.category.upsert({
    where: { slug: "mobiles" },
    update: {},
    create: {
      name: "Mobiles",
      slug: "mobiles",
      description: "Mobile phones and smartphones",
    },
  });

  const laptops = await prisma.category.upsert({
    where: { slug: "laptops" },
    update: {},
    create: {
      name: "Laptops",
      slug: "laptops",
      description: "Laptops and notebooks",
    },
  });

  // ─────────────────────────────────────────────
  // BRANDS
  // ─────────────────────────────────────────────

  const samsung = await prisma.brand.upsert({
    where: { slug: "samsung" },
    update: {},
    create: {
      name: "Samsung",
      slug: "samsung",
    },
  });

  const apple = await prisma.brand.upsert({
    where: { slug: "apple" },
    update: {},
    create: {
      name: "Apple",
      slug: "apple",
    },
  });

  const oneplus = await prisma.brand.upsert({
    where: { slug: "oneplus" },
    update: {},
    create: {
      name: "OnePlus",
      slug: "oneplus",
    },
  });

  const lenovo = await prisma.brand.upsert({
    where: { slug: "lenovo" },
    update: {},
    create: {
      name: "Lenovo",
      slug: "lenovo",
    },
  });

  // ─────────────────────────────────────────────
  // SELLERS
  // ─────────────────────────────────────────────

  const amazon = await prisma.seller.upsert({
    where: { slug: "amazon" },
    update: {},
    create: {
      name: "Amazon",
      slug: "amazon",
      websiteUrl: "https://www.amazon.in",
    },
  });

  const flipkart = await prisma.seller.upsert({
    where: { slug: "flipkart" },
    update: {},
    create: {
      name: "Flipkart",
      slug: "flipkart",
      websiteUrl: "https://www.flipkart.com",
    },
  });

  // ─────────────────────────────────────────────
  // PRODUCTS
  // ─────────────────────────────────────────────

  const galaxyS25 = await prisma.product.upsert({
    where: { slug: "samsung-galaxy-s25" },
    update: {},
    create: {
      name: "Samsung Galaxy S25",
      slug: "samsung-galaxy-s25",
      description: "Samsung flagship smartphone with a premium design.",
      shortDescription: "Premium Samsung smartphone",
      categoryId: mobiles.id,
      brandId: samsung.id,
      releaseDate: new Date("2025-02-01"),
    },
  });

  const iphone16 = await prisma.product.upsert({
    where: { slug: "apple-iphone-16" },
    update: {},
    create: {
      name: "Apple iPhone 16",
      slug: "apple-iphone-16",
      description: "Apple smartphone featuring the latest generation hardware.",
      shortDescription: "Next-generation iPhone",
      categoryId: mobiles.id,
      brandId: apple.id,
      releaseDate: new Date("2024-09-20"),
    },
  });

  const oneplus13 = await prisma.product.upsert({
    where: { slug: "oneplus-13" },
    update: {},
    create: {
      name: "OnePlus 13",
      slug: "oneplus-13",
      description: "High-performance OnePlus flagship smartphone.",
      shortDescription: "Powerful OnePlus flagship",
      categoryId: mobiles.id,
      brandId: oneplus.id,
      releaseDate: new Date("2025-01-10"),
    },
  });

  const lenovoIdeaPad = await prisma.product.upsert({
    where: { slug: "lenovo-ideapad-slim-5" },
    update: {},
    create: {
      name: "Lenovo IdeaPad Slim 5",
      slug: "lenovo-ideapad-slim-5",
      description: "Slim everyday laptop for work, study and entertainment.",
      shortDescription: "Slim everyday laptop",
      categoryId: laptops.id,
      brandId: lenovo.id,
    },
  });

  // ─────────────────────────────────────────────
  // PRODUCT VARIANTS
  // ─────────────────────────────────────────────

  const s25Variant = await prisma.productVariant.upsert({
    where: { sku: "S25-256-BLK" },
    update: {},
    create: {
      productId: galaxyS25.id,
      name: "Galaxy S25 12GB/256GB",
      sku: "S25-256-BLK",
      color: "Black",
      storage: "256GB",
      ram: "12GB",
    },
  });

  const iphoneVariant = await prisma.productVariant.upsert({
    where: { sku: "IP16-128-BLK" },
    update: {},
    create: {
      productId: iphone16.id,
      name: "iPhone 16 128GB",
      sku: "IP16-128-BLK",
      color: "Black",
      storage: "128GB",
    },
  });

  const oneplusVariant = await prisma.productVariant.upsert({
    where: { sku: "OP13-256-BLK" },
    update: {},
    create: {
      productId: oneplus13.id,
      name: "OnePlus 13 12GB/256GB",
      sku: "OP13-256-BLK",
      color: "Black",
      storage: "256GB",
      ram: "12GB",
    },
  });


    // ─────────────────────────────────────────────
  // SPECIFICATIONS
  // ─────────────────────────────────────────────

  const display = await prisma.specification.upsert({
    where: { slug: "display" },
    update: {},
    create: {
      name: "Display",
      slug: "display",
      dataType: "text",
    },
  });

  const ram = await prisma.specification.upsert({
    where: { slug: "ram" },
    update: {},
    create: {
      name: "RAM",
      slug: "ram",
      unit: "GB",
      dataType: "number",
    },
  });

  const storage = await prisma.specification.upsert({
    where: { slug: "storage" },
    update: {},
    create: {
      name: "Storage",
      slug: "storage",
      unit: "GB",
      dataType: "number",
    },
  });

  const processor = await prisma.specification.upsert({
    where: { slug: "processor" },
    update: {},
    create: {
      name: "Processor",
      slug: "processor",
      dataType: "text",
    },
  });

  const battery = await prisma.specification.upsert({
    where: { slug: "battery" },
    update: {},
    create: {
      name: "Battery",
      slug: "battery",
      unit: "mAh",
      dataType: "number",
    },
  });

  const camera = await prisma.specification.upsert({
    where: { slug: "camera" },
    update: {},
    create: {
      name: "Camera",
      slug: "camera",
      dataType: "text",
    },
  });



 


// ─────────────────────────────────────────────
// FULL SPECIFICATION DEFINITIONS
// ─────────────────────────────────────────────

type SpecificationDefinition = {
  name: string;
  slug: string;
  group: string;
  column: "LEFT" | "RIGHT";
  groupOrder: number;
  sortOrder: number;
  dataType?: string;
  unit?: string;
};

const specificationDefinitions: SpecificationDefinition[] = [
  // =========================================================
  // LEFT COLUMN
  // =========================================================

  // ─────────────────────────────────────────────
  // GENERAL
  // ─────────────────────────────────────────────
  {
    name: "Model",
    slug: "model",
    group: "General",
    column: "LEFT",
    groupOrder: 1,
    sortOrder: 1,
  },
  {
    name: "Model Number",
    slug: "model-number",
    group: "General",
    column: "LEFT",
    groupOrder: 1,
    sortOrder: 2,
  },
  {
    name: "Launch Date",
    slug: "launch-date",
    group: "General",
    column: "LEFT",
    groupOrder: 1,
    sortOrder: 3,
  },
  {
    name: "Announced Date",
    slug: "announced-date",
    group: "General",
    column: "LEFT",
    groupOrder: 1,
    sortOrder: 4,
  },
  {
    name: "Sim Type",
    slug: "sim-type",
    group: "General",
    column: "LEFT",
    groupOrder: 1,
    sortOrder: 5,
  },
  {
    name: "Number of SIMs",
    slug: "number-of-sims",
    group: "General",
    column: "LEFT",
    groupOrder: 1,
    sortOrder: 6,
  },
  {
    name: "Dual SIM",
    slug: "dual-sim",
    dataType: "boolean",
    group: "General",
    column: "LEFT",
    groupOrder: 1,
    sortOrder: 7,
  },
  {
    name: "SIM Size",
    slug: "sim-size",
    group: "General",
    column: "LEFT",
    groupOrder: 1,
    sortOrder: 8,
  },
  {
    name: "eSIM",
    slug: "esim",
    dataType: "boolean",
    group: "General",
    column: "LEFT",
    groupOrder: 1,
    sortOrder: 9,
  },
  {
    name: "Device Type",
    slug: "device-type",
    group: "General",
    column: "LEFT",
    groupOrder: 1,
    sortOrder: 10,
  },
  {
    name: "Network",
    slug: "network",
    group: "General",
    column: "LEFT",
    groupOrder: 1,
    sortOrder: 11,
  },

  // ─────────────────────────────────────────────
  // DESIGN
  // ─────────────────────────────────────────────
  {
    name: "Dimensions",
    slug: "dimensions",
    group: "Design",
    column: "LEFT",
    groupOrder: 2,
    sortOrder: 1,
  },
  {
    name: "Height",
    slug: "height",
    group: "Design",
    column: "LEFT",
    groupOrder: 2,
    sortOrder: 2,
  },
  {
    name: "Width",
    slug: "width",
    group: "Design",
    column: "LEFT",
    groupOrder: 2,
    sortOrder: 3,
  },
  {
    name: "Thickness",
    slug: "thickness",
    group: "Design",
    column: "LEFT",
    groupOrder: 2,
    sortOrder: 4,
  },
  {
    name: "Weight",
    slug: "weight",
    unit: "g",
    dataType: "number",
    group: "Design",
    column: "LEFT",
    groupOrder: 2,
    sortOrder: 5,
  },
  {
    name: "Build Material",
    slug: "build-material",
    group: "Design",
    column: "LEFT",
    groupOrder: 2,
    sortOrder: 6,
  },
  {
    name: "Frame Material",
    slug: "frame-material",
    group: "Design",
    column: "LEFT",
    groupOrder: 2,
    sortOrder: 7,
  },
  {
    name: "Back Material",
    slug: "back-material",
    group: "Design",
    column: "LEFT",
    groupOrder: 2,
    sortOrder: 8,
  },
  {
    name: "Colors",
    slug: "colors",
    group: "Design",
    column: "LEFT",
    groupOrder: 2,
    sortOrder: 9,
  },

  // ─────────────────────────────────────────────
  // DISPLAY
  // ─────────────────────────────────────────────
  {
    name: "Display Type",
    slug: "display-type",
    group: "Display",
    column: "LEFT",
    groupOrder: 3,
    sortOrder: 1,
  },
  {
    name: "Display",
    slug: "display",
    group: "Display",
    column: "LEFT",
    groupOrder: 3,
    sortOrder: 2,
  },
  {
    name: "Touch",
    slug: "touch",
    dataType: "boolean",
    group: "Display",
    column: "LEFT",
    groupOrder: 3,
    sortOrder: 3,
  },
  {
    name: "Screen Size",
    slug: "screen-size",
    group: "Display",
    column: "LEFT",
    groupOrder: 3,
    sortOrder: 4,
  },
  {
    name: "Resolution",
    slug: "resolution",
    group: "Display",
    column: "LEFT",
    groupOrder: 3,
    sortOrder: 5,
  },
  {
    name: "Resolution Type",
    slug: "resolution-type",
    group: "Display",
    column: "LEFT",
    groupOrder: 3,
    sortOrder: 6,
  },
  {
    name: "Refresh Rate",
    slug: "refresh-rate",
    group: "Display",
    column: "LEFT",
    groupOrder: 3,
    sortOrder: 7,
  },
  {
    name: "Touch Sampling Rate",
    slug: "touch-sampling-rate",
    group: "Display",
    column: "LEFT",
    groupOrder: 3,
    sortOrder: 8,
  },
  {
    name: "Aspect Ratio",
    slug: "aspect-ratio",
    group: "Display",
    column: "LEFT",
    groupOrder: 3,
    sortOrder: 9,
  },
  {
    name: "PPI",
    slug: "ppi",
    group: "Display",
    column: "LEFT",
    groupOrder: 3,
    sortOrder: 10,
  },
  {
    name: "Peak Brightness",
    slug: "peak-brightness",
    group: "Display",
    column: "LEFT",
    groupOrder: 3,
    sortOrder: 11,
  },
  {
    name: "HDR",
    slug: "hdr",
    dataType: "boolean",
    group: "Display",
    column: "LEFT",
    groupOrder: 3,
    sortOrder: 12,
  },
  {
    name: "HDR10+",
    slug: "hdr10-plus",
    dataType: "boolean",
    group: "Display",
    column: "LEFT",
    groupOrder: 3,
    sortOrder: 13,
  },
  {
    name: "Display Protection",
    slug: "display-protection",
    group: "Display",
    column: "LEFT",
    groupOrder: 3,
    sortOrder: 14,
  },
  {
    name: "Glass Type",
    slug: "glass-type",
    group: "Display",
    column: "LEFT",
    groupOrder: 3,
    sortOrder: 15,
  },
  {
    name: "Always On Display",
    slug: "always-on-display",
    dataType: "boolean",
    group: "Display",
    column: "LEFT",
    groupOrder: 3,
    sortOrder: 16,
  },
  {
    name: "Screen-to-Body Ratio",
    slug: "screen-to-body-ratio",
    group: "Display",
    column: "LEFT",
    groupOrder: 3,
    sortOrder: 17,
  },
  {
    name: "Foldable Display",
    slug: "foldable-display",
    dataType: "boolean",
    group: "Display",
    column: "LEFT",
    groupOrder: 3,
    sortOrder: 18,
  },
  {
    name: "Dual Display",
    slug: "dual-display",
    dataType: "boolean",
    group: "Display",
    column: "LEFT",
    groupOrder: 3,
    sortOrder: 19,
  },

  // ─────────────────────────────────────────────
  // MEMORY
  // ─────────────────────────────────────────────
  {
    name: "RAM",
    slug: "ram",
    unit: "GB",
    dataType: "number",
    group: "Memory",
    column: "LEFT",
    groupOrder: 4,
    sortOrder: 1,
  },
  {
    name: "Storage",
    slug: "storage",
    unit: "GB",
    dataType: "number",
    group: "Memory",
    column: "LEFT",
    groupOrder: 4,
    sortOrder: 2,
  },
  {
    name: "Internal Storage",
    slug: "internal-storage",
    group: "Memory",
    column: "LEFT",
    groupOrder: 4,
    sortOrder: 3,
  },
  {
    name: "Storage Type",
    slug: "storage-type",
    group: "Memory",
    column: "LEFT",
    groupOrder: 4,
    sortOrder: 4,
  },
  {
    name: "Memory Card",
    slug: "memory-card",
    group: "Memory",
    column: "LEFT",
    groupOrder: 4,
    sortOrder: 5,
  },
  {
    name: "Expandable Storage",
    slug: "expandable-storage",
    group: "Memory",
    column: "LEFT",
    groupOrder: 4,
    sortOrder: 6,
  },

  // ─────────────────────────────────────────────
  // CONNECTIVITY
  // ─────────────────────────────────────────────
  {
    name: "GPRS",
    slug: "gprs",
    dataType: "boolean",
    group: "Connectivity",
    column: "LEFT",
    groupOrder: 5,
    sortOrder: 1,
  },
  {
    name: "EDGE",
    slug: "edge",
    dataType: "boolean",
    group: "Connectivity",
    column: "LEFT",
    groupOrder: 5,
    sortOrder: 2,
  },
  {
    name: "3G",
    slug: "3g",
    dataType: "boolean",
    group: "Connectivity",
    column: "LEFT",
    groupOrder: 5,
    sortOrder: 3,
  },
  {
    name: "4G",
    slug: "4g",
    dataType: "boolean",
    group: "Connectivity",
    column: "LEFT",
    groupOrder: 5,
    sortOrder: 4,
  },
  {
    name: "5G",
    slug: "5g",
    dataType: "boolean",
    group: "Connectivity",
    column: "LEFT",
    groupOrder: 5,
    sortOrder: 5,
  },
  {
    name: "5G Bands",
    slug: "5g-bands",
    group: "Connectivity",
    column: "LEFT",
    groupOrder: 5,
    sortOrder: 6,
  },
  {
    name: "VoLTE",
    slug: "volte",
    dataType: "boolean",
    group: "Connectivity",
    column: "LEFT",
    groupOrder: 5,
    sortOrder: 7,
  },
  {
    name: "Vo5G",
    slug: "vo5g",
    dataType: "boolean",
    group: "Connectivity",
    column: "LEFT",
    groupOrder: 5,
    sortOrder: 8,
  },
  {
    name: "Wi-Fi",
    slug: "wifi",
    group: "Connectivity",
    column: "LEFT",
    groupOrder: 5,
    sortOrder: 9,
  },
  {
    name: "Wi-Fi Version",
    slug: "wifi-version",
    group: "Connectivity",
    column: "LEFT",
    groupOrder: 5,
    sortOrder: 10,
  },
  {
    name: "Bluetooth",
    slug: "bluetooth",
    group: "Connectivity",
    column: "LEFT",
    groupOrder: 5,
    sortOrder: 11,
  },
  {
    name: "Bluetooth Version",
    slug: "bluetooth-version",
    group: "Connectivity",
    column: "LEFT",
    groupOrder: 5,
    sortOrder: 12,
  },
  {
    name: "NFC",
    slug: "nfc",
    dataType: "boolean",
    group: "Connectivity",
    column: "LEFT",
    groupOrder: 5,
    sortOrder: 13,
  },
  {
    name: "UWB Support",
    slug: "uwb-support",
    dataType: "boolean",
    group: "Connectivity",
    column: "LEFT",
    groupOrder: 5,
    sortOrder: 14,
  },
  {
    name: "USB Type",
    slug: "usb-type",
    group: "Connectivity",
    column: "LEFT",
    groupOrder: 5,
    sortOrder: 15,
  },
  {
    name: "USB Version",
    slug: "usb-version",
    group: "Connectivity",
    column: "LEFT",
    groupOrder: 5,
    sortOrder: 16,
  },
  {
    name: "USB OTG",
    slug: "usb-otg",
    dataType: "boolean",
    group: "Connectivity",
    column: "LEFT",
    groupOrder: 5,
    sortOrder: 17,
  },
  {
    name: "USB Features",
    slug: "usb-features",
    group: "Connectivity",
    column: "LEFT",
    groupOrder: 5,
    sortOrder: 18,
  },
  {
    name: "Infrared",
    slug: "infrared",
    dataType: "boolean",
    group: "Connectivity",
    column: "LEFT",
    groupOrder: 5,
    sortOrder: 19,
  },

  // =========================================================
  // RIGHT COLUMN
  // =========================================================

  // ─────────────────────────────────────────────
  // EXTRA
  // ─────────────────────────────────────────────
  {
    name: "Fingerprint Sensor",
    slug: "fingerprint-sensor",
    dataType: "boolean",
    group: "Extra",
    column: "RIGHT",
    groupOrder: 1,
    sortOrder: 1,
  },
  {
    name: "Face Unlock",
    slug: "face-unlock",
    dataType: "boolean",
    group: "Extra",
    column: "RIGHT",
    groupOrder: 1,
    sortOrder: 2,
  },
  {
    name: "Sensors",
    slug: "sensors",
    group: "Extra",
    column: "RIGHT",
    groupOrder: 1,
    sortOrder: 3,
  },
  {
    name: "AI Features",
    slug: "ai-features",
    group: "Extra",
    column: "RIGHT",
    groupOrder: 1,
    sortOrder: 4,
  },
  {
    name: "Water Resistance",
    slug: "water-resistance",
    dataType: "boolean",
    group: "Extra",
    column: "RIGHT",
    groupOrder: 1,
    sortOrder: 5,
  },
  {
    name: "IP Rating",
    slug: "ip-rating",
    group: "Extra",
    column: "RIGHT",
    groupOrder: 1,
    sortOrder: 6,
  },
  {
    name: "Dust Resistant",
    slug: "dust-resistant",
    dataType: "boolean",
    group: "Extra",
    column: "RIGHT",
    groupOrder: 1,
    sortOrder: 7,
  },
  {
    name: "3.5mm Headphone Jack",
    slug: "headphone-jack",
    dataType: "boolean",
    group: "Extra",
    column: "RIGHT",
    groupOrder: 1,
    sortOrder: 8,
  },
  {
    name: "GPS",
    slug: "gps",
    group: "Extra",
    column: "RIGHT",
    groupOrder: 1,
    sortOrder: 9,
  },
  {
    name: "Extra Features",
    slug: "extra-features",
    group: "Extra",
    column: "RIGHT",
    groupOrder: 1,
    sortOrder: 10,
  },

  // ─────────────────────────────────────────────
  // CAMERA
  // ─────────────────────────────────────────────
  {
    name: "Rear Camera",
    slug: "rear-camera",
    group: "Camera",
    column: "RIGHT",
    groupOrder: 2,
    sortOrder: 1,
  },
  {
    name: "Main Camera",
    slug: "main-camera",
    group: "Camera",
    column: "RIGHT",
    groupOrder: 2,
    sortOrder: 2,
  },
  {
    name: "Ultra Wide",
    slug: "ultra-wide",
    group: "Camera",
    column: "RIGHT",
    groupOrder: 2,
    sortOrder: 3,
  },
  {
    name: "Telephoto",
    slug: "telephoto",
    group: "Camera",
    column: "RIGHT",
    groupOrder: 2,
    sortOrder: 4,
  },
  {
    name: "Periscope",
    slug: "periscope",
    group: "Camera",
    column: "RIGHT",
    groupOrder: 2,
    sortOrder: 5,
  },
  {
    name: "Macro",
    slug: "macro",
    group: "Camera",
    column: "RIGHT",
    groupOrder: 2,
    sortOrder: 6,
  },
  {
    name: "OIS",
    slug: "ois",
    dataType: "boolean",
    group: "Camera",
    column: "RIGHT",
    groupOrder: 2,
    sortOrder: 7,
  },
  {
    name: "Autofocus",
    slug: "autofocus",
    dataType: "boolean",
    group: "Camera",
    column: "RIGHT",
    groupOrder: 2,
    sortOrder: 8,
  },
  {
    name: "Laser Autofocus",
    slug: "laser-autofocus",
    dataType: "boolean",
    group: "Camera",
    column: "RIGHT",
    groupOrder: 2,
    sortOrder: 9,
  },
  {
    name: "Flash",
    slug: "flash",
    dataType: "boolean",
    group: "Camera",
    column: "RIGHT",
    groupOrder: 2,
    sortOrder: 10,
  },
  {
    name: "Front Camera",
    slug: "front-camera",
    group: "Camera",
    column: "RIGHT",
    groupOrder: 2,
    sortOrder: 11,
  },
  {
    name: "Camera Features",
    slug: "camera-features",
    group: "Camera",
    column: "RIGHT",
    groupOrder: 2,
    sortOrder: 12,
  },
  {
    name: "Rear Video",
    slug: "rear-video",
    group: "Camera",
    column: "RIGHT",
    groupOrder: 2,
    sortOrder: 13,
  },
  {
    name: "Front Video",
    slug: "front-video",
    group: "Camera",
    column: "RIGHT",
    groupOrder: 2,
    sortOrder: 14,
  },
  {
    name: "8K Video",
    slug: "8k-video",
    group: "Camera",
    column: "RIGHT",
    groupOrder: 2,
    sortOrder: 15,
  },
  {
    name: "4K Video",
    slug: "4k-video",
    group: "Camera",
    column: "RIGHT",
    groupOrder: 2,
    sortOrder: 16,
  },
  {
    name: "Slow Motion",
    slug: "slow-motion",
    group: "Camera",
    column: "RIGHT",
    groupOrder: 2,
    sortOrder: 17,
  },
  {
    name: "Video Stabilization",
    slug: "video-stabilization",
    group: "Camera",
    column: "RIGHT",
    groupOrder: 2,
    sortOrder: 18,
  },

  // ─────────────────────────────────────────────
  // TECHNICAL
  // ─────────────────────────────────────────────
  {
    name: "OS",
    slug: "os",
    group: "Technical",
    column: "RIGHT",
    groupOrder: 3,
    sortOrder: 1,
  },
  {
    name: "Operating System",
    slug: "operating-system",
    group: "Technical",
    column: "RIGHT",
    groupOrder: 3,
    sortOrder: 2,
  },
  {
    name: "Android Version",
    slug: "android-version",
    group: "Technical",
    column: "RIGHT",
    groupOrder: 3,
    sortOrder: 3,
  },
  {
    name: "Custom UI",
    slug: "ui",
    group: "Technical",
    column: "RIGHT",
    groupOrder: 3,
    sortOrder: 4,
  },
  {
    name: "Major Android Updates",
    slug: "major-android-updates",
    group: "Technical",
    column: "RIGHT",
    groupOrder: 3,
    sortOrder: 5,
  },
  {
    name: "Security Updates",
    slug: "security-updates",
    group: "Technical",
    column: "RIGHT",
    groupOrder: 3,
    sortOrder: 6,
  },
  {
    name: "Update Support Until",
    slug: "update-support-until",
    group: "Technical",
    column: "RIGHT",
    groupOrder: 3,
    sortOrder: 7,
  },
  {
    name: "Java",
    slug: "java",
    dataType: "boolean",
    group: "Technical",
    column: "RIGHT",
    groupOrder: 3,
    sortOrder: 8,
  },
  {
    name: "Browser",
    slug: "browser",
    dataType: "boolean",
    group: "Technical",
    column: "RIGHT",
    groupOrder: 3,
    sortOrder: 9,
  },
  {
    name: "Processor",
    slug: "processor",
    group: "Technical",
    column: "RIGHT",
    groupOrder: 3,
    sortOrder: 10,
  },
  {
    name: "CPU",
    slug: "cpu",
    group: "Technical",
    column: "RIGHT",
    groupOrder: 3,
    sortOrder: 11,
  },
  {
    name: "Chipset",
    slug: "chipset",
    group: "Technical",
    column: "RIGHT",
    groupOrder: 3,
    sortOrder: 12,
  },
  {
    name: "CPU Architecture",
    slug: "cpu-architecture",
    group: "Technical",
    column: "RIGHT",
    groupOrder: 3,
    sortOrder: 13,
  },
  {
    name: "CPU Speed",
    slug: "cpu-speed",
    group: "Technical",
    column: "RIGHT",
    groupOrder: 3,
    sortOrder: 14,
  },
  {
    name: "CPU Cores",
    slug: "cpu-cores",
    group: "Technical",
    column: "RIGHT",
    groupOrder: 3,
    sortOrder: 15,
  },
  {
    name: "GPU",
    slug: "gpu",
    group: "Technical",
    column: "RIGHT",
    groupOrder: 3,
    sortOrder: 16,
  },
  {
    name: "NPU",
    slug: "npu",
    group: "Technical",
    column: "RIGHT",
    groupOrder: 3,
    sortOrder: 17,
  },
  {
    name: "Cooling System",
    slug: "cooling-system",
    group: "Technical",
    column: "RIGHT",
    groupOrder: 3,
    sortOrder: 18,
  },
  {
    name: "AnTuTu Score",
    slug: "antutu-score",
    group: "Technical",
    column: "RIGHT",
    groupOrder: 3,
    sortOrder: 19,
  },
  {
    name: "Geekbench Single Core",
    slug: "geekbench-single",
    group: "Technical",
    column: "RIGHT",
    groupOrder: 3,
    sortOrder: 20,
  },
  {
    name: "Geekbench Multi Core",
    slug: "geekbench-multi",
    group: "Technical",
    column: "RIGHT",
    groupOrder: 3,
    sortOrder: 21,
  },

  // ─────────────────────────────────────────────
  // MULTIMEDIA
  // ─────────────────────────────────────────────
  {
    name: "Email",
    slug: "email",
    dataType: "boolean",
    group: "Multimedia",
    column: "RIGHT",
    groupOrder: 4,
    sortOrder: 1,
  },
  {
    name: "Music",
    slug: "music",
    dataType: "boolean",
    group: "Multimedia",
    column: "RIGHT",
    groupOrder: 4,
    sortOrder: 2,
  },
  {
    name: "Video",
    slug: "video",
    dataType: "boolean",
    group: "Multimedia",
    column: "RIGHT",
    groupOrder: 4,
    sortOrder: 3,
  },
  {
    name: "FM Radio",
    slug: "fm-radio",
    dataType: "boolean",
    group: "Multimedia",
    column: "RIGHT",
    groupOrder: 4,
    sortOrder: 4,
  },
  {
    name: "Speaker Type",
    slug: "speaker-type",
    group: "Multimedia",
    column: "RIGHT",
    groupOrder: 4,
    sortOrder: 5,
  },
  {
    name: "Stereo Speakers",
    slug: "stereo-speakers",
    dataType: "boolean",
    group: "Multimedia",
    column: "RIGHT",
    groupOrder: 4,
    sortOrder: 6,
  },
  {
    name: "Dolby Atmos",
    slug: "dolby-atmos",
    dataType: "boolean",
    group: "Multimedia",
    column: "RIGHT",
    groupOrder: 4,
    sortOrder: 7,
  },
  {
    name: "Document Reader",
    slug: "document-reader",
    dataType: "boolean",
    group: "Multimedia",
    column: "RIGHT",
    groupOrder: 4,
    sortOrder: 8,
  },

  // ─────────────────────────────────────────────
  // BATTERY
  // ─────────────────────────────────────────────
  {
    name: "Battery",
    slug: "battery",
    unit: "mAh",
    dataType: "number",
    group: "Battery",
    column: "RIGHT",
    groupOrder: 5,
    sortOrder: 1,
  },
  {
    name: "Battery Capacity",
    slug: "battery-capacity",
    unit: "mAh",
    dataType: "number",
    group: "Battery",
    column: "RIGHT",
    groupOrder: 5,
    sortOrder: 2,
  },
  {
    name: "Battery Type",
    slug: "battery-type",
    group: "Battery",
    column: "RIGHT",
    groupOrder: 5,
    sortOrder: 3,
  },
  {
    name: "Removable Battery",
    slug: "removable-battery",
    dataType: "boolean",
    group: "Battery",
    column: "RIGHT",
    groupOrder: 5,
    sortOrder: 4,
  },
  {
    name: "Fast Charging",
    slug: "fast-charging",
    dataType: "boolean",
    group: "Battery",
    column: "RIGHT",
    groupOrder: 5,
    sortOrder: 5,
  },
  {
    name: "Charging Wattage",
    slug: "charging-wattage",
    group: "Battery",
    column: "RIGHT",
    groupOrder: 5,
    sortOrder: 6,
  },
  {
    name: "Wireless Charging",
    slug: "wireless-charging",
    dataType: "boolean",
    group: "Battery",
    column: "RIGHT",
    groupOrder: 5,
    sortOrder: 7,
  },
  {
    name: "Wireless Charging Wattage",
    slug: "wireless-charging-wattage",
    group: "Battery",
    column: "RIGHT",
    groupOrder: 5,
    sortOrder: 8,
  },
  {
    name: "Reverse Charging",
    slug: "reverse-charging",
    dataType: "boolean",
    group: "Battery",
    column: "RIGHT",
    groupOrder: 5,
    sortOrder: 9,
  },
  {
    name: "Reverse Wireless Charging",
    slug: "reverse-wireless-charging",
    dataType: "boolean",
    group: "Battery",
    column: "RIGHT",
    groupOrder: 5,
    sortOrder: 10,
  },
  {
    name: "Video Playback Time",
    slug: "video-playback-time",
    unit: "hours",
    dataType: "number",
    group: "Battery",
    column: "RIGHT",
    groupOrder: 5,
    sortOrder: 11,
  },

  // ─────────────────────────────────────────────
  // AI FEATURES
  // ─────────────────────────────────────────────
  {
    name: "AI Assistant",
    slug: "ai-assistant",
    group: "Extra",
    column: "RIGHT",
    groupOrder: 1,
    sortOrder: 20,
  },
  {
    name: "Circle to Search",
    slug: "circle-to-search",
    group: "Extra",
    column: "RIGHT",
    groupOrder: 1,
    sortOrder: 21,
  },
  {
    name: "AI Eraser",
    slug: "ai-eraser",
    group: "Extra",
    column: "RIGHT",
    groupOrder: 1,
    sortOrder: 22,
  },
  {
    name: "Generative Edit",
    slug: "generative-edit",
    group: "Extra",
    column: "RIGHT",
    groupOrder: 1,
    sortOrder: 23,
  },
  {
    name: "Live Translate",
    slug: "live-translate",
    group: "Extra",
    column: "RIGHT",
    groupOrder: 1,
    sortOrder: 24,
  },
  {
    name: "Interpreter",
    slug: "interpreter",
    group: "Extra",
    column: "RIGHT",
    groupOrder: 1,
    sortOrder: 25,
  },
  {
    name: "Writing Assist",
    slug: "writing-assist",
    group: "Extra",
    column: "RIGHT",
    groupOrder: 1,
    sortOrder: 26,
  },
  {
    name: "Note Assist",
    slug: "note-assist",
    group: "Extra",
    column: "RIGHT",
    groupOrder: 1,
    sortOrder: 27,
  },
  {
    name: "Transcript Assist",
    slug: "transcript-assist",
    group: "Extra",
    column: "RIGHT",
    groupOrder: 1,
    sortOrder: 28,
  },
  {
    name: "Browsing Assist",
    slug: "browsing-assist",
    group: "Extra",
    column: "RIGHT",
    groupOrder: 1,
    sortOrder: 29,
  },
];

for (const spec of specificationDefinitions) {
  await prisma.specification.upsert({
    where: {
      slug: spec.slug,
    },

    update: {
      name: spec.name,
      dataType: spec.dataType ?? "text",
      unit: spec.unit ?? null,
      group: spec.group,
      column: spec.column,
      groupOrder: spec.groupOrder,
      sortOrder: spec.sortOrder,
    },

    create: {
      name: spec.name,
      slug: spec.slug,
      dataType: spec.dataType ?? "text",
      unit: spec.unit ?? null,
      group: spec.group,
      column: spec.column,
      groupOrder: spec.groupOrder,
      sortOrder: spec.sortOrder,
    },
  });
}



// ─────────────────────────────────────────────
// ASUS LAPTOP SPECIFICATIONS
// ─────────────────────────────────────────────

const asusProduct = await prisma.product.findUnique({
  where: {
    slug:
      "asus-chromebook-cx15-intel-celeron-dual-core-n50-4-gb-64-gb-emmc-storage-chrome-os-cx1505cta-s70256-chromebook-laptop-15-6-inch-pure-grey-1-6-kg-1788845835890",
  },
});

if (asusProduct) {
  const asusSpecifications = [
    // GENERAL
    ["Series", "series", "Chromebook CX15", "General"],
    ["Model", "model", "CX1505CTA-S70256", "General"],
    ["Utility", "utility", "Everyday Use", "General"],
    ["Device Type", "device-type", "Netbook", "General"],
    ["OS", "os", "Chrome", "General"],
    ["Dimensions", "dimensions", "359.5 x 232.2 x 20.1 mm", "General"],
    ["Weight", "weight", "1.6 kg", "General"],

    // DISPLAY
    ["Touch", "touch", "No", "Display"],
    ["Size", "size", "15.6 inches", "Display"],
    ["Resolution", "resolution", "1920 x 1080 pixels", "Display"],
    ["PPI", "ppi", "~141 PPI", "Display"],
    ["Refresh Rate", "refresh-rate", "60 Hz", "Display"],
    ["Anti Glare Screen", "anti-glare-screen", "Yes", "Display"],
    ["Features", "features", "300 nits", "Display"],

    // CONNECTIVITY
    ["Ethernet", "ethernet", "No", "Connectivity"],
    [
      "WiFi",
      "wifi",
      "Wi-Fi 6 (802.11ax Dual Band) 2*2",
      "Connectivity",
    ],
    ["Bluetooth", "bluetooth", "v5.4", "Connectivity"],
    [
      "USB Ports",
      "usb-ports",
      "1 x USB Type-C, 1 x USB 3.0",
      "Connectivity",
    ],
    ["HDMI", "hdmi", "1 x HDMI 1.4 Port", "Connectivity"],
    ["Microphone In", "microphone-in", "Yes", "Connectivity"],
    ["Headphone Jack", "headphone-jack", "Yes", "Connectivity"],

    // INPUT
    ["Camera", "camera", "Yes", "Input"],
    ["Keyboard", "keyboard", "Chiclet Keyboard", "Input"],
    ["Touchpad", "touchpad", "Yes", "Input"],
    ["Inbuilt Microphone", "inbuilt-microphone", "Built-in microphone", "Input"],
    ["Speakers", "speakers", "Built-in speaker", "Input"],
    ["Optical Drive", "optical-drive", "No", "Input"],

    // PROCESSOR
    ["Processor", "processor", "Intel Celeron N50", "Processor"],
    ["Cache", "cache", "6 MB", "Processor"],
    ["Brand", "processor-brand", "Intel", "Processor"],
    ["Series", "processor-series", "Celeron", "Processor"],
    ["Model", "processor-model", "N50", "Processor"],

    // GRAPHICS
    ["GPU", "gpu", "Intel Integrated UHD", "Graphics"],
    ["Brand", "graphics-brand", "Intel", "Graphics"],

    // MEMORY
    ["RAM", "ram", "4 GB LPDDR5", "Memory"],
    ["eMMC Storage", "emmc-storage", "64 GB", "Memory"],

    // BATTERY
    ["Battery", "battery", "3 Cell Battery", "Battery"],

    // EXTRA
    ["Included Software", "included-software", "MyASUS", "Extra"],
    [
      "Sales Package",
      "sales-package",
      "1 x Laptop, 1 x Power Adaptor, 1 x User Guide, 1 x Warranty Documents",
      "Extra",
    ],
  ] as const;

  for (const [name, slug, value, group] of asusSpecifications) {
    const specification = await prisma.specification.upsert({
      where: {
        slug,
      },
      update: {
        name,
        dataType: "text",
      },
      create: {
        name,
        slug,
        group,
        dataType: "text",
      },
    });

    const existingValue = await prisma.specificationValue.findFirst({
      where: {
        specificationId: specification.id,
        value,
      },
    });

    const specificationValue =
      existingValue ??
      (await prisma.specificationValue.create({
        data: {
          specificationId: specification.id,
          value,
        },
      }));

    await prisma.productSpecification.upsert({
      where: {
        productId_specificationId: {
          productId: asusProduct.id,
          specificationId: specification.id,
        },
      },
      update: {
        valueId: specificationValue.id,
        customValue: null,
      },
      create: {
        productId: asusProduct.id,
        specificationId: specification.id,
        valueId: specificationValue.id,
      },
    });
  }

  console.log("💻 ASUS laptop specifications seeded successfully!");
}

  // ─────────────────────────────────────────────
  // SPECIFICATION VALUES
  // ─────────────────────────────────────────────

  const displayS25 = await prisma.specificationValue.create({
    data: {
      specificationId: display.id,
      value: "6.2-inch AMOLED 120Hz",
    },
  });

  const displayIphone16 = await prisma.specificationValue.create({
    data: {
      specificationId: display.id,
      value: "6.1-inch OLED 60Hz",
    },
  });

  const displayOneplus13 = await prisma.specificationValue.create({
    data: {
      specificationId: display.id,
      value: "6.82-inch AMOLED 120Hz",
    },
  });

  // ─────────────────────────────────────────────
  // PRODUCT SPECIFICATIONS
  // ─────────────────────────────────────────────

  await prisma.productSpecification.upsert({
    where: {
      productId_specificationId: {
        productId: galaxyS25.id,
        specificationId: display.id,
      },
    },
    update: {
      valueId: displayS25.id,
    },
    create: {
      productId: galaxyS25.id,
      specificationId: display.id,
      valueId: displayS25.id,
    },
  });

  await prisma.productSpecification.upsert({
    where: {
      productId_specificationId: {
        productId: galaxyS25.id,
        specificationId: ram.id,
      },
    },
    update: {
      customValue: "12",
    },
    create: {
      productId: galaxyS25.id,
      specificationId: ram.id,
      customValue: "12",
    },
  });

  await prisma.productSpecification.upsert({
    where: {
      productId_specificationId: {
        productId: galaxyS25.id,
        specificationId: storage.id,
      },
    },
    update: {
      customValue: "256",
    },
    create: {
      productId: galaxyS25.id,
      specificationId: storage.id,
      customValue: "256",
    },
  });

  await prisma.productSpecification.upsert({
    where: {
      productId_specificationId: {
        productId: galaxyS25.id,
        specificationId: processor.id,
      },
    },
    update: {
      customValue: "Snapdragon 8 Elite",
    },
    create: {
      productId: galaxyS25.id,
      specificationId: processor.id,
      customValue: "Snapdragon 8 Elite",
    },
  });

  await prisma.productSpecification.upsert({
    where: {
      productId_specificationId: {
        productId: galaxyS25.id,
        specificationId: battery.id,
      },
    },
    update: {
      customValue: "4000",
    },
    create: {
      productId: galaxyS25.id,
      specificationId: battery.id,
      customValue: "4000",
    },
  });

  await prisma.productSpecification.upsert({
    where: {
      productId_specificationId: {
        productId: galaxyS25.id,
        specificationId: camera.id,
      },
    },
    update: {
      customValue: "50MP + 12MP + 10MP",
    },
    create: {
      productId: galaxyS25.id,
      specificationId: camera.id,
      customValue: "50MP + 12MP + 10MP",
    },
  });

  await prisma.productSpecification.upsert({
    where: {
      productId_specificationId: {
        productId: iphone16.id,
        specificationId: display.id,
      },
    },
    update: {
      valueId: displayIphone16.id,
    },
    create: {
      productId: iphone16.id,
      specificationId: display.id,
      valueId: displayIphone16.id,
    },
  });

  await prisma.productSpecification.upsert({
    where: {
      productId_specificationId: {
        productId: iphone16.id,
        specificationId: storage.id,
      },
    },
    update: {
      customValue: "128",
    },
    create: {
      productId: iphone16.id,
      specificationId: storage.id,
      customValue: "128",
    },
  });

  await prisma.productSpecification.upsert({
    where: {
      productId_specificationId: {
        productId: iphone16.id,
        specificationId: processor.id,
      },
    },
    update: {
      customValue: "Apple A18",
    },
    create: {
      productId: iphone16.id,
      specificationId: processor.id,
      customValue: "Apple A18",
    },
  });

  await prisma.productSpecification.upsert({
    where: {
      productId_specificationId: {
        productId: iphone16.id,
        specificationId: battery.id,
      },
    },
    update: {
      customValue: "3561",
    },
    create: {
      productId: iphone16.id,
      specificationId: battery.id,
      customValue: "3561",
    },
  });

  await prisma.productSpecification.upsert({
    where: {
      productId_specificationId: {
        productId: iphone16.id,
        specificationId: camera.id,
      },
    },
    update: {
      customValue: "48MP + 12MP",
    },
    create: {
      productId: iphone16.id,
      specificationId: camera.id,
      customValue: "48MP + 12MP",
    },
  });

  await prisma.productSpecification.upsert({
    where: {
      productId_specificationId: {
        productId: oneplus13.id,
        specificationId: display.id,
      },
    },
    update: {
      valueId: displayOneplus13.id,
    },
    create: {
      productId: oneplus13.id,
      specificationId: display.id,
      valueId: displayOneplus13.id,
    },
  });

  await prisma.productSpecification.upsert({
    where: {
      productId_specificationId: {
        productId: oneplus13.id,
        specificationId: ram.id,
      },
    },
    update: {
      customValue: "12",
    },
    create: {
      productId: oneplus13.id,
      specificationId: ram.id,
      customValue: "12",
    },
  });

  await prisma.productSpecification.upsert({
    where: {
      productId_specificationId: {
        productId: oneplus13.id,
        specificationId: storage.id,
      },
    },
    update: {
      customValue: "256",
    },
    create: {
      productId: oneplus13.id,
      specificationId: storage.id,
      customValue: "256",
    },
  });

  await prisma.productSpecification.upsert({
    where: {
      productId_specificationId: {
        productId: oneplus13.id,
        specificationId: processor.id,
      },
    },
    update: {
      customValue: "Snapdragon 8 Elite",
    },
    create: {
      productId: oneplus13.id,
      specificationId: processor.id,
      customValue: "Snapdragon 8 Elite",
    },
  });

  await prisma.productSpecification.upsert({
    where: {
      productId_specificationId: {
        productId: oneplus13.id,
        specificationId: battery.id,
      },
    },
    update: {
      customValue: "6000",
    },
    create: {
      productId: oneplus13.id,
      specificationId: battery.id,
      customValue: "6000",
    },
  });

  await prisma.productSpecification.upsert({
    where: {
      productId_specificationId: {
        productId: oneplus13.id,
        specificationId: camera.id,
      },
    },
    update: {
      customValue: "50MP + 50MP + 50MP",
    },
    create: {
      productId: oneplus13.id,
      specificationId: camera.id,
      customValue: "50MP + 50MP + 50MP",
    },
  });


    const specificationCount =
    await prisma.productSpecification.count();

  console.log(
    `📊 Product specifications seeded: ${specificationCount}`,
  );

  // ─────────────────────────────────────────────
  // PRICES
  // ─────────────────────────────────────────────

  await prisma.price.createMany({
    data: [
      {
        productId: galaxyS25.id,
        variantId: s25Variant.id,
        sellerId: amazon.id,
        amount: 74999,
        currency: "INR",
        inStock: true,
        productUrl: "https://www.amazon.in",
      },
      {
        productId: galaxyS25.id,
        variantId: s25Variant.id,
        sellerId: flipkart.id,
        amount: 73999,
        currency: "INR",
        inStock: true,
        productUrl: "https://www.flipkart.com",
      },
      {
        productId: iphone16.id,
        variantId: iphoneVariant.id,
        sellerId: amazon.id,
        amount: 69999,
        currency: "INR",
        inStock: true,
        productUrl: "https://www.amazon.in",
      },
      {
        productId: iphone16.id,
        variantId: iphoneVariant.id,
        sellerId: flipkart.id,
        amount: 67999,
        currency: "INR",
        inStock: true,
        productUrl: "https://www.flipkart.com",
      },
      {
        productId: oneplus13.id,
        variantId: oneplusVariant.id,
        sellerId: amazon.id,
        amount: 69999,
        currency: "INR",
        inStock: true,
        productUrl: "https://www.amazon.in",
      },
      {
        productId: oneplus13.id,
        variantId: oneplusVariant.id,
        sellerId: flipkart.id,
        amount: 68999,
        currency: "INR",
        inStock: true,
        productUrl: "https://www.flipkart.com",
      },
      {
        productId: lenovoIdeaPad.id,
        sellerId: amazon.id,
        amount: 64990,
        currency: "INR",
        inStock: true,
        productUrl: "https://www.amazon.in",
      },
    ],
  });


    // ─────────────────────────────────────────────
  // RBAC — ROLES & PERMISSIONS
  // ─────────────────────────────────────────────

  console.log("🔐 Seeding roles and permissions...");

  // Create permissions
  for (const permissionName of Object.values(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: {
        name: permissionName,
      },
      update: {},
      create: {
        name: permissionName,
      },
    });
  }

  // Create roles and assign permissions

for (const roleName of Object.values(ROLES)) {
  const role = await prisma.role.upsert({
    where: {
      name: roleName,
    },
    update: {},
    create: {
      name: roleName,
      description: `${roleName} role`,
    },
  });

  const permissions = ROLE_PERMISSIONS[roleName] ?? [];

  console.log(
    `🔐 Seeding role: ${roleName} (${permissions.length} permissions)`,
  );

  for (const permissionName of permissions) {
    const permission = await prisma.permission.findUnique({
      where: {
        name: permissionName,
      },
    });

    if (!permission) {
      console.warn(
        `⚠️ Permission "${permissionName}" not found. Skipping.`,
      );
      continue;
    }

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });
  }
}

console.log("✅ Roles and permissions seeded successfully!");
console.log("✅ Database seed completed successfully!");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });