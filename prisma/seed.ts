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



 


const specificationDefinitions = [
  // ─────────────────────────────────────────────
  // GENERAL
  // ─────────────────────────────────────────────

  ["Launch Date", "launch-date"],
  ["Announced Date", "announced-date"],
  ["Operating System", "operating-system"],
  ["SIM Type", "sim-type"],
  ["Number of SIMs", "number-of-sims"],
  ["Network", "network"],
  ["5G", "5g"],
  ["4G", "4g"],
  ["Model Number", "model-number"],

  // ─────────────────────────────────────────────
  // DESIGN
  // ─────────────────────────────────────────────
  ["Height", "height"],
  ["Width", "width"],
  ["Thickness", "thickness"],
  ["Weight", "weight"],
  ["Build Material", "build-material"],
  ["Frame Material", "frame-material"],
  ["Back Material", "back-material"],
  ["Water Resistance", "water-resistance"],
  ["IP Rating", "ip-rating"],
  ["Colors", "colors"],

  // ─────────────────────────────────────────────
  // DISPLAY
  // ─────────────────────────────────────────────
  ["Display Type", "display-type"],
  ["Screen Size", "screen-size"],
  ["Resolution", "resolution"],
  ["Resolution Type", "resolution-type"],
  ["Refresh Rate", "refresh-rate"],
  ["Touch Sampling Rate", "touch-sampling-rate"],
  ["Peak Brightness", "peak-brightness"],
  ["HDR", "hdr"],
  ["HDR10+", "hdr10-plus"],
  ["Display Protection", "display-protection"],
  ["Always On Display", "always-on-display"],
  ["Screen-to-Body Ratio", "screen-to-body-ratio"],

  // ─────────────────────────────────────────────
  // PERFORMANCE
  // ─────────────────────────────────────────────
  ["Processor", "processor"],
  ["CPU", "cpu"],
  ["Chipset", "chipset"],
  ["CPU Architecture", "cpu-architecture"],
  ["CPU Speed", "cpu-speed"],
  ["CPU Cores", "cpu-cores"],
  ["GPU", "gpu"],
  ["Cooling System", "cooling-system"],
  ["AnTuTu Score", "antutu-score"],

  // IMPORTANT:
  // These slugs must match the admin form.
  ["Geekbench Single Core", "geekbench-single"],
  ["Geekbench Multi Core", "geekbench-multi"],

  // ─────────────────────────────────────────────
  // MEMORY
  // ─────────────────────────────────────────────
  ["RAM", "ram"],
  ["Internal Storage", "internal-storage"],
  ["Storage Type", "storage-type"],
  ["Memory Card", "memory-card"],
  ["Expandable Storage", "expandable-storage"],

  // ─────────────────────────────────────────────
  // CAMERA
  // ─────────────────────────────────────────────
  ["Rear Camera", "rear-camera"],
  ["Main Camera", "main-camera"],
  ["Ultra Wide", "ultra-wide"],
  ["Telephoto", "telephoto"],
  ["Periscope", "periscope"],
  ["Macro", "macro"],
  ["OIS", "ois"],
  ["Autofocus", "autofocus"],
  ["Laser Autofocus", "laser-autofocus"],
  ["Flash", "flash"],
  ["Front Camera", "front-camera"],

  // ─────────────────────────────────────────────
  // VIDEO
  // ─────────────────────────────────────────────
  ["Rear Video", "rear-video"],
  ["Front Video", "front-video"],
  ["8K Video", "8k-video"],
  ["4K Video", "4k-video"],
  ["Slow Motion", "slow-motion"],
  ["Video Stabilization", "video-stabilization"],

  // ─────────────────────────────────────────────
  // CONNECTIVITY
  // ─────────────────────────────────────────────
  ["Wi-Fi", "wifi"],
  ["Wi-Fi Version", "wifi-version"],
  ["Bluetooth", "bluetooth"],
  ["Bluetooth Version", "bluetooth-version"],
  ["NFC", "nfc"],
  ["GPS", "gps"],
  ["USB Type", "usb-type"],
  ["USB Version", "usb-version"],
  ["USB OTG", "usb-otg"],
  ["Infrared", "infrared"],
  ["Headphone Jack", "headphone-jack"],

  // ─────────────────────────────────────────────
  // BATTERY
  // ─────────────────────────────────────────────
  ["Battery Capacity", "battery-capacity"],
  ["Battery Type", "battery-type"],
  ["Removable Battery", "removable-battery"],
  ["Fast Charging", "fast-charging"],
  ["Charging Wattage", "charging-wattage"],
  ["Wireless Charging", "wireless-charging"],
  ["Wireless Charging Wattage", "wireless-charging-wattage"],
  ["Reverse Wireless Charging", "reverse-wireless-charging"],

  // ─────────────────────────────────────────────
  // SOFTWARE
  // ─────────────────────────────────────────────
  ["Android Version", "android-version"],
  ["UI", "ui"],
  ["Major Android Updates", "major-android-updates"],
  ["Security Updates", "security-updates"],
  ["Update Support Until", "update-support-until"],

  // ─────────────────────────────────────────────
  // FEATURES
  // ─────────────────────────────────────────────
  ["Fingerprint Sensor", "fingerprint-sensor"],
  ["Face Unlock", "face-unlock"],
  ["Stereo Speakers", "stereo-speakers"],
  ["Dolby Atmos", "dolby-atmos"],
  ["Dual SIM", "dual-sim"],
  ["eSIM", "esim"],
  ["Desktop Mode", "desktop-mode"],
  ["FM Radio", "fm-radio"],

  // ─────────────────────────────────────────────
  // SENSORS
  // ─────────────────────────────────────────────
  ["Accelerometer", "accelerometer"],
  ["Gyroscope", "gyroscope"],
  ["Proximity", "proximity"],
  ["Compass", "compass"],
  ["Barometer", "barometer"],
  ["Ambient Light Sensor", "ambient-light-sensor"],

  // ─────────────────────────────────────────────
  // AI
  // ─────────────────────────────────────────────
  ["AI Assistant", "ai-assistant"],
  ["Circle to Search", "circle-to-search"],
  ["AI Eraser", "ai-eraser"],
  ["Generative Edit", "generative-edit"],
  ["Live Translate", "live-translate"],
  ["Interpreter", "interpreter"],
  ["Writing Assist", "writing-assist"],
  ["Note Assist", "note-assist"],
  ["Transcript Assist", "transcript-assist"],
  ["Browsing Assist", "browsing-assist"],
];

for (const [name, slug] of specificationDefinitions) {
  await prisma.specification.upsert({
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
        dataType: "text",
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
        group,
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

  const permissions = ROLE_PERMISSIONS[roleName];

  for (const permissionName of permissions) {
    const permission = await prisma.permission.findUnique({
      where: {
        name: permissionName,
      },
    });

    if (!permission) {
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