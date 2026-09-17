import prisma from "../../db/prisma";

import type {
  SpecificationDataType,
} from "./specification.types";

/* =========================================================
   TYPES
========================================================= */

export type SpecificationSeedOption = {
  label: string;
  value: string;
  sortOrder?: number;
};

export type SpecificationSeedDefinition = {
  name: string;
  slug: string;
  dataType: SpecificationDataType;
  unit?: string;

  isRequired?: boolean;
  isFilterable?: boolean;
  isComparable?: boolean;
  isSearchable?: boolean;

  sortOrder?: number;

  options?: SpecificationSeedOption[];
};

export type SpecificationSeedGroup = {
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;

  definitions: SpecificationSeedDefinition[];
};

export type CategorySchemaSeed = {
  category: {
    name: string;
    slug: string;
    description?: string;
  };

  schema: {
    name: string;
    slug: string;
    description?: string;
    version?: number;
    isActive?: boolean;

    groups: SpecificationSeedGroup[];
  };
};

/* =========================================================
   HELPERS
========================================================= */

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function text(
  name: string,
  options: Partial<
    Omit<SpecificationSeedDefinition, "name" | "slug" | "dataType">
  > = {},
): SpecificationSeedDefinition {
  return {
    name,
    slug: slugify(name),
    dataType: "TEXT",
    ...options,
  };
}

function longText(
  name: string,
  options: Partial<
    Omit<SpecificationSeedDefinition, "name" | "slug" | "dataType">
  > = {},
): SpecificationSeedDefinition {
  return {
    name,
    slug: slugify(name),
    dataType: "LONG_TEXT",
    ...options,
  };
}

function number(
  name: string,
  unit?: string,
  options: Partial<
    Omit<SpecificationSeedDefinition, "name" | "slug" | "dataType" | "unit">
  > = {},
): SpecificationSeedDefinition {
  return {
    name,
    slug: slugify(name),
    dataType: "NUMBER",
    unit,
    ...options,
  };
}

function decimal(
  name: string,
  unit?: string,
  options: Partial<
    Omit<SpecificationSeedDefinition, "name" | "slug" | "dataType" | "unit">
  > = {},
): SpecificationSeedDefinition {
  return {
    name,
    slug: slugify(name),
    dataType: "DECIMAL",
    unit,
    ...options,
  };
}

function boolean(
  name: string,
  options: Partial<
    Omit<SpecificationSeedDefinition, "name" | "slug" | "dataType">
  > = {},
): SpecificationSeedDefinition {
  return {
    name,
    slug: slugify(name),
    dataType: "BOOLEAN",
    ...options,
  };
}

function date(
  name: string,
  options: Partial<
    Omit<SpecificationSeedDefinition, "name" | "slug" | "dataType">
  > = {},
): SpecificationSeedDefinition {
  return {
    name,
    slug: slugify(name),
    dataType: "DATE",
    ...options,
  };
}

function select(
  name: string,
  options: SpecificationSeedOption[],
  config: Partial<
    Omit<
      SpecificationSeedDefinition,
      "name" | "slug" | "dataType" | "options"
    >
  > = {},
): SpecificationSeedDefinition {
  return {
    name,
    slug: slugify(name),
    dataType: "SELECT",
    options,
    ...config,
  };
}

function multiSelect(
  name: string,
  options: SpecificationSeedOption[],
  config: Partial<
    Omit<
      SpecificationSeedDefinition,
      "name" | "slug" | "dataType" | "options"
    >
  > = {},
): SpecificationSeedDefinition {
  return {
    name,
    slug: slugify(name),
    dataType: "MULTI_SELECT",
    options,
    ...config,
  };
}

function group(
  name: string,
  definitions: SpecificationSeedDefinition[],
  sortOrder: number,
): SpecificationSeedGroup {
  return {
    name,
    slug: slugify(name),
    sortOrder,
    definitions: definitions.map((definition, index) => ({
      ...definition,
      sortOrder: definition.sortOrder ?? index,
    })),
  };
}

/* =========================================================
   COMMON OPTIONS
========================================================= */

const yesNoOptions: SpecificationSeedOption[] = [
  {
    label: "Yes",
    value: "yes",
    sortOrder: 0,
  },
  {
    label: "No",
    value: "no",
    sortOrder: 1,
  },
];

/* =========================================================
   MOBILE & TABLETS
========================================================= */

const mobileTabletSchema: CategorySchemaSeed = {
  category: {
    name: "Mobile & Tablets",
    slug: "mobile-tablets",
  },

  schema: {
    name: "Mobile & Tablets Specification Schema",
    slug: "mobile-tablets",
    version: 1,
    isActive: true,

    groups: [
      group(
        "General",
        [
          text("Model", {
            isSearchable: true,
          }),

          text("Sim Type", {
            isFilterable: true,
          }),

          boolean("Dual Sim", {
            isFilterable: true,
          }),

          text("Sim Size", {
            isFilterable: true,
          }),

          boolean("eSIM Support", {
            isFilterable: true,
          }),

          text("Device Type", {
            isFilterable: true,
          }),

          date("Release Date", {
            isFilterable: true,
            isComparable: true,
          }),

          longText("In The Box"),
        ],
        0,
      ),

      group(
        "Design",
        [
          text("Dimensions"),

          number("Weight", "g", {
            isFilterable: true,
            isComparable: true,
          }),

          text("Colors", {
            isFilterable: true,
          }),
        ],
        1,
      ),

      group(
        "Display",
        [
          text("Type", {
            isFilterable: true,
            isComparable: true,
          }),

          boolean("Touch", {
            isFilterable: true,
          }),

          number("Size", "inch", {
            isFilterable: true,
            isComparable: true,
          }),

          text("Aspect Ratio", {
            isFilterable: true,
            isComparable: true,
          }),

          number("PPI", "ppi", {
            isFilterable: true,
            isComparable: true,
          }),

          number("Screen to Body Ratio", "%", {
            isFilterable: true,
            isComparable: true,
          }),

          text("Glass Type", {
            isFilterable: true,
          }),

          number("Brightness", "nits", {
            isFilterable: true,
            isComparable: true,
          }),

          boolean("HDR Support", {
            isFilterable: true,
          }),

          boolean("Adaptive Refresh Rate", {
            isFilterable: true,
          }),

          text("Color Gamut", {
            isFilterable: true,
          }),

          longText("Features"),

          text("Notch", {
            isFilterable: true,
          }),
        ],
        2,
      ),

      group(
        "Memory",
        [
          number("RAM", "GB", {
            isFilterable: true,
            isComparable: true,
          }),

          number("Storage", "GB", {
            isFilterable: true,
            isComparable: true,
          }),

          boolean("Card Slot", {
            isFilterable: true,
          }),
        ],
        3,
      ),

      group(
        "Connectivity",
        [
          boolean("GPRS", {
            isFilterable: true,
          }),

          boolean("EDGE", {
            isFilterable: true,
          }),

          boolean("3G", {
            isFilterable: true,
          }),

          boolean("4G", {
            isFilterable: true,
          }),

          boolean("5G", {
            isFilterable: true,
          }),

          text("5G Bands", {
            isFilterable: true,
          }),

          boolean("VoLTE", {
            isFilterable: true,
          }),

          text("Wifi", {
            isFilterable: true,
          }),

          text("Wifi Version", {
            isFilterable: true,
            isComparable: true,
          }),

          boolean("Ultra Wideband (UWB) Support", {
            isFilterable: true,
          }),

          text("Bluetooth", {
            isFilterable: true,
            isComparable: true,
          }),

          text("USB", {
            isFilterable: true,
          }),

          longText("USB Features"),

          boolean("NFC", {
            isFilterable: true,
          }),
        ],
        4,
      ),

      group(
        "Performance",
        [
          number("Geekbench Score", undefined, {
            isFilterable: true,
            isComparable: true,
          }),
        ],
        5,
      ),

      group(
        "Extra",
        [
          text("GPS", {
            isFilterable: true,
          }),

          boolean("Fingerprint Sensor", {
            isFilterable: true,
          }),

          boolean("Face Unlock", {
            isFilterable: true,
          }),

          longText("Sensors"),

          boolean("3.5mm Headphone Jack", {
            isFilterable: true,
          }),

          boolean("NFC", {
            isFilterable: true,
          }),

          longText("AI Features"),

          boolean("Water Resistance", {
            isFilterable: true,
          }),

          text("IP Rating", {
            isFilterable: true,
            isComparable: true,
          }),

          boolean("Dust Resistant", {
            isFilterable: true,
          }),

          longText("Extra Features"),
        ],
        6,
      ),

      group(
        "Camera",
        [
          text("Rear Camera", {
            isFilterable: true,
            isComparable: true,
          }),

          text("Camera Sensor"),

          boolean("Auto Focus", {
            isFilterable: true,
          }),

          longText("Features"),

          text("Video Recording", {
            isFilterable: true,
          }),

          text("Flash", {
            isFilterable: true,
          }),

          text("Front Camera", {
            isFilterable: true,
            isComparable: true,
          }),

          text("Front Video Recording", {
            isFilterable: true,
          }),
        ],
        7,
      ),

      group(
        "Technical",
        [
          text("OS", {
            isFilterable: true,
            isSearchable: true,
          }),

          text("Chipset", {
            isFilterable: true,
            isSearchable: true,
            isComparable: true,
          }),

          text("CPU", {
            isFilterable: true,
            isComparable: true,
          }),

          text("Fabrication Node", {
            isFilterable: true,
            isComparable: true,
          }),

          text("GPU", {
            isFilterable: true,
            isComparable: true,
          }),

          text("Java"),

          text("Browser"),
        ],
        8,
      ),

      group(
        "Multimedia",
        [
          boolean("Email"),

          boolean("Music"),

          boolean("Video"),

          boolean("FM Radio", {
            isFilterable: true,
          }),

          boolean("Document Reader"),
        ],
        9,
      ),

      group(
        "Battery",
        [
          text("Type", {
            isFilterable: true,
          }),

          number("Size", "mAh", {
            isFilterable: true,
            isComparable: true,
          }),

          text("Fast Charging", {
            isFilterable: true,
          }),

          boolean("Wireless Charging", {
            isFilterable: true,
          }),

          boolean("Reverse Wireless Charging", {
            isFilterable: true,
          }),

          number("Video Playback Time", "hours", {
            isFilterable: true,
            isComparable: true,
          }),
        ],
        10,
      ),
    ],
  },
};

/* =========================================================
   LAPTOPS
========================================================= */

const laptopSchema: CategorySchemaSeed = {
  category: {
    name: "Laptops",
    slug: "laptops",
  },

  schema: {
    name: "Laptops Specification Schema",
    slug: "laptops",
    version: 1,
    isActive: true,

    groups: [
      group(
        "General",
        [
          text("Series", {
            isSearchable: true,
          }),

          text("Model", {
            isSearchable: true,
          }),

          text("Utility", {
            isFilterable: true,
          }),

          text("OS", {
            isFilterable: true,
            isSearchable: true,
          }),

          text("Dimensions"),

          number("Weight", "kg", {
            isFilterable: true,
            isComparable: true,
          }),

          text("Warranty"),
        ],
        0,
      ),

      group(
        "Display",
        [
          text("Type", {
            isFilterable: true,
          }),

          boolean("Touch", {
            isFilterable: true,
          }),

          number("Size", "inch", {
            isFilterable: true,
            isComparable: true,
          }),

          text("Resolution", {
            isFilterable: true,
            isComparable: true,
          }),

          number("PPI", "ppi", {
            isFilterable: true,
            isComparable: true,
          }),

          number("Refresh Rate", "Hz", {
            isFilterable: true,
            isComparable: true,
          }),

          text("Aspect Ratio", {
            isFilterable: true,
          }),

          boolean("Anti Glare Screen", {
            isFilterable: true,
          }),

          longText("Features"),
        ],
        1,
      ),

      group(
        "Connectivity",
        [
          boolean("Ethernet", {
            isFilterable: true,
          }),

          text("WiFi", {
            isFilterable: true,
          }),

          text("Bluetooth", {
            isFilterable: true,
          }),

          text("USB Ports", {
            isFilterable: true,
          }),

          text("HDMI", {
            isFilterable: true,
          }),

          boolean("Card Reader", {
            isFilterable: true,
          }),

          boolean("Microphone In", {
            isFilterable: true,
          }),

          boolean("Headphone Jack", {
            isFilterable: true,
          }),
        ],
        2,
      ),

      group(
        "Input",
        [
          text("Camera"),

          text("Keyboard"),

          boolean("Keyboard Backlit", {
            isFilterable: true,
          }),

          text("Touchpad"),

          boolean("Inbuilt Microphone"),

          text("Speakers"),

          boolean("Optical Drive", {
            isFilterable: true,
          }),
        ],
        3,
      ),

      group(
        "Processor",
        [
          text("Processor", {
            isSearchable: true,
            isComparable: true,
          }),

          number("Speed", "GHz", {
            isFilterable: true,
            isComparable: true,
          }),

          number("Cores", undefined, {
            isFilterable: true,
            isComparable: true,
          }),

          number("Cache", "MB", {
            isFilterable: true,
            isComparable: true,
          }),

          text("Brand", {
            isFilterable: true,
            isSearchable: true,
          }),

          text("Series", {
            isFilterable: true,
            isSearchable: true,
          }),

          text("Model", {
            isFilterable: true,
            isSearchable: true,
          }),

          text("Generation", {
            isFilterable: true,
            isComparable: true,
          }),

          text("Process Node", {
            isFilterable: true,
            isComparable: true,
          }),
        ],
        4,
      ),

      group(
        "Graphics",
        [
          text("GPU", {
            isFilterable: true,
            isSearchable: true,
            isComparable: true,
          }),

          text("Brand", {
            isFilterable: true,
            isSearchable: true,
          }),
        ],
        5,
      ),

      group(
        "Memory",
        [
          number("RAM", "GB", {
            isFilterable: true,
            isComparable: true,
          }),

          number("RAM Bus Speed", "MHz", {
            isFilterable: true,
            isComparable: true,
          }),

          number("Solid State Drive", "GB", {
            isFilterable: true,
            isComparable: true,
          }),

          number("Max SSD Supported", "GB", {
            isFilterable: true,
            isComparable: true,
          }),

          text("SSD Interface", {
            isFilterable: true,
          }),
        ],
        6,
      ),

      group(
        "Battery",
        [
          text("Adapter Type", {
            isFilterable: true,
          }),
        ],
        7,
      ),

      group(
        "Extra",
        [
          longText("Included Software"),

          longText("Sales Package"),
        ],
        8,
      ),
    ],
  },
};

/* =========================================================
   TV
========================================================= */

const tvSchema: CategorySchemaSeed = {
  category: {
    name: "TV",
    slug: "tv",
  },

  schema: {
    name: "TV Specification Schema",
    slug: "tv",
    version: 1,
    isActive: true,

    groups: [
      group(
        "General",
        [
          text("Model", {
            isSearchable: true,
          }),

          text("Type", {
            isFilterable: true,
          }),

          text("Warranty"),

          longText("In The Box"),

          number("Launch Year", undefined, {
            isFilterable: true,
            isComparable: true,
          }),
        ],
        0,
      ),

      group(
        "Display",
        [
          number("Size (Diagonal)", "inch", {
            isFilterable: true,
            isComparable: true,
          }),

          text("Screen Resolution", {
            isFilterable: true,
            isComparable: true,
          }),

          text("Backlight Type", {
            isFilterable: true,
          }),

          number("Brightness", "nits", {
            isFilterable: true,
            isComparable: true,
          }),

          text("Contrast Ratio", {
            isFilterable: true,
            isComparable: true,
          }),

          number("Refresh Rate", "Hz", {
            isFilterable: true,
            isComparable: true,
          }),

          text("Aspect Ratio", {
            isFilterable: true,
          }),

          boolean("HDR", {
            isFilterable: true,
          }),

          text("HDR Format Types", {
            isFilterable: true,
          }),
        ],
        1,
      ),

      group(
        "Video",
        [
          text("Picture Processor", {
            isSearchable: true,
          }),
        ],
        2,
      ),

      group(
        "Audio",
        [
          number("Number Of Speakers", undefined, {
            isFilterable: true,
            isComparable: true,
          }),

          number("Total Speaker Output", "W", {
            isFilterable: true,
            isComparable: true,
          }),

          number("Output Per Speaker", "W", {
            isFilterable: true,
            isComparable: true,
          }),

          text("Sound Technology", {
            isFilterable: true,
          }),
        ],
        3,
      ),

      group(
        "Connectivity",
        [
          number("USB Ports", undefined, {
            isFilterable: true,
            isComparable: true,
          }),

          number("HDMI Ports", undefined, {
            isFilterable: true,
            isComparable: true,
          }),

          boolean("Built-In Chromecast", {
            isFilterable: true,
          }),

          boolean("Ethernet", {
            isFilterable: true,
          }),
        ],
        4,
      ),

      group(
        "Power Supply",
        [
          number("Power Consumption", "W", {
            isFilterable: true,
            isComparable: true,
          }),

          number("Power Consumption (Stand-by)", "W", {
            isFilterable: true,
            isComparable: true,
          }),
        ],
        5,
      ),

      group(
        "Smart TV Features",
        [
          boolean("Smart TV", {
            isFilterable: true,
          }),

          text("Operating System (OS)", {
            isFilterable: true,
            isSearchable: true,
          }),

          text("APP Store Type", {
            isFilterable: true,
          }),

          text("Wi-Fi", {
            isFilterable: true,
          }),

          text("Voice Assistant", {
            isFilterable: true,
          }),

          boolean("Bluetooth", {
            isFilterable: true,
          }),

          number("RAM", "GB", {
            isFilterable: true,
            isComparable: true,
          }),

          number("Storage", "GB", {
            isFilterable: true,
            isComparable: true,
          }),

          longText("Supported Apps"),
        ],
        6,
      ),
    ],
  },
};

/* =========================================================
   MOTORCYCLES
========================================================= */

const motorcycleSchema: CategorySchemaSeed = {
  category: {
    name: "Motorcycles",
    slug: "motorcycles",
  },

  schema: {
    name: "Motorcycles Specification Schema",
    slug: "motorcycles",
    version: 1,
    isActive: true,

    groups: [
      group(
        "General",
        [
          text("Model", {
            isSearchable: true,
          }),

          text("Type", {
            isFilterable: true,
          }),
        ],
        0,
      ),

      group(
        "Engine and Transmission Details",
        [
          text("Engine Type", {
            isFilterable: true,
          }),

          number("Engine Displacement", "cc", {
            isFilterable: true,
            isComparable: true,
          }),

          number("Cylinders", undefined, {
            isFilterable: true,
            isComparable: true,
          }),

          number("Valves/Cylinder", undefined, {
            isFilterable: true,
            isComparable: true,
          }),

          number("Maximum Power", "bhp", {
            isFilterable: true,
            isComparable: true,
          }),

          number("Maximum Torque", "Nm", {
            isFilterable: true,
            isComparable: true,
          }),

          text("Transmission Type", {
            isFilterable: true,
          }),

          text("Start Type", {
            isFilterable: true,
          }),

          text("Cooling System", {
            isFilterable: true,
          }),

          number("Bore", "mm", {
            isFilterable: true,
            isComparable: true,
          }),

          number("Stroke", "mm", {
            isFilterable: true,
            isComparable: true,
          }),

          decimal("Compression Ratio", undefined, {
            isFilterable: true,
            isComparable: true,
          }),

          text("Drive Type", {
            isFilterable: true,
          }),

          text("Clutch Type", {
            isFilterable: true,
          }),
        ],
        1,
      ),

      group(
        "Performance Details",
        [
          number("Top Speed", "km/h", {
            isFilterable: true,
            isComparable: true,
          }),

          number("Fuel Tank Capacity", "L", {
            isFilterable: true,
            isComparable: true,
          }),

          text("Fuel Type", {
            isFilterable: true,
          }),
        ],
        2,
      ),

      group(
        "Suspension and Braking Details",
        [
          text("Front Suspension", {
            isFilterable: true,
          }),

          text("Rear Suspension", {
            isFilterable: true,
          }),

          text("Shock Absorbers Type", {
            isFilterable: true,
          }),

          text("Brake Type", {
            isFilterable: true,
          }),

          text("Frame Details"),
        ],
        3,
      ),

      group(
        "Body Design Details",
        [
          number("Kerb Weight", "kg", {
            isFilterable: true,
            isComparable: true,
          }),

          number("Length", "mm", {
            isFilterable: true,
            isComparable: true,
          }),

          number("Width", "mm", {
            isFilterable: true,
            isComparable: true,
          }),

          number("Height", "mm", {
            isFilterable: true,
            isComparable: true,
          }),

          number("Ground Clearance", "mm", {
            isFilterable: true,
            isComparable: true,
          }),

          number("Wheel Base", "mm", {
            isFilterable: true,
            isComparable: true,
          }),

          number("Seating Capacity", undefined, {
            isFilterable: true,
            isComparable: true,
          }),

          number("Seat Height", "mm", {
            isFilterable: true,
            isComparable: true,
          }),

          text("Wheel Design", {
            isFilterable: true,
          }),

          text("Tyre Type", {
            isFilterable: true,
          }),

          text("Tyre Size Front", {
            isFilterable: true,
          }),

          text("Tyre Size Rear", {
            isFilterable: true,
          }),
        ],
        4,
      ),

      group(
        "Comfort and Convenience Details",
        [
          boolean("Cruise Control", {
            isFilterable: true,
          }),

          boolean("Side Stand", {
            isFilterable: true,
          }),

          boolean("Passenger Footrest", {
            isFilterable: true,
          }),
        ],
        5,
      ),

      group(
        "Safety Features",
        [
          boolean("Anti Lock Braking System (ABS)", {
            isFilterable: true,
          }),

          boolean("Traction Control", {
            isFilterable: true,
          }),

          boolean("Side Stand Indicator", {
            isFilterable: true,
          }),

          boolean("Side Stand Cut Off Switch", {
            isFilterable: true,
          }),

          boolean("Kill Switch", {
            isFilterable: true,
          }),
        ],
        6,
      ),

      group(
        "Lights and Indicators",
        [
          text("Headlamps", {
            isFilterable: true,
          }),

          boolean("Daytime Running Lights (DRLs)", {
            isFilterable: true,
          }),

          text("Tail Lights", {
            isFilterable: true,
          }),

          text("Brake Lights", {
            isFilterable: true,
          }),

          boolean("Gear Position Indicator", {
            isFilterable: true,
          }),

          boolean("Tachometer", {
            isFilterable: true,
          }),

          boolean("Speedometer", {
            isFilterable: true,
          }),

          boolean("Fuel Meter", {
            isFilterable: true,
          }),

          boolean("Odometer", {
            isFilterable: true,
          }),

          boolean("Tripmeter", {
            isFilterable: true,
          }),

          text("Turn Indicator Type", {
            isFilterable: true,
          }),

          boolean("Pass Light", {
            isFilterable: true,
          }),

          boolean("Clock", {
            isFilterable: true,
          }),

          boolean("Distance To Empty Indicator", {
            isFilterable: true,
          }),
        ],
        7,
      ),

      group(
        "Instrument Cluster Details",
        [
          text("Instrument Cluster", {
            isFilterable: true,
          }),
        ],
        8,
      ),
    ],
  },
};

/* =========================================================
   EXPORTED SEEDS
========================================================= */

export const CATEGORY_SCHEMA_SEEDS: CategorySchemaSeed[] = [
  mobileTabletSchema,
  laptopSchema,
  tvSchema,
  motorcycleSchema,
];

/* =========================================================
   VALIDATION
========================================================= */

function validateSeed(seed: CategorySchemaSeed): void {
  const groupSlugs = new Set<string>();

  for (const group of seed.schema.groups) {
    if (groupSlugs.has(group.slug)) {
      throw new Error(
        `Duplicate specification group slug: ${group.slug}`,
      );
    }

    groupSlugs.add(group.slug);

    const definitionSlugs = new Set<string>();

    for (const definition of group.definitions) {
      if (definitionSlugs.has(definition.slug)) {
        throw new Error(
          `Duplicate specification definition slug "${definition.slug}" in group "${group.name}"`,
        );
      }

      definitionSlugs.add(definition.slug);

      if (
        definition.dataType === "SELECT" ||
        definition.dataType === "MULTI_SELECT"
      ) {
        if (
          !definition.options ||
          definition.options.length === 0
        ) {
          throw new Error(
            `${definition.dataType} specification "${definition.name}" must have at least one option`,
          );
        }
      } else if (
        definition.options &&
        definition.options.length > 0
      ) {
        throw new Error(
          `Only SELECT and MULTI_SELECT specifications can have options: ${definition.name}`,
        );
      }
    }
  }
}

/* =========================================================
   SINGLE SCHEMA SEED
========================================================= */

export async function seedSpecificationSchema(
  seed: CategorySchemaSeed,
) {
  validateSeed(seed);

  return prisma.$transaction(async (tx) => {
    const category = await tx.category.upsert({
      where: {
        slug: seed.category.slug,
      },

      update: {
        name: seed.category.name,
        description: seed.category.description,
      },

      create: {
        name: seed.category.name,
        slug: seed.category.slug,
        description: seed.category.description,
      },
    });

    const schema =
      await tx.specificationSchema.upsert({
        where: {
          slug: seed.schema.slug,
        },

        update: {
          name: seed.schema.name,
          description: seed.schema.description,
          version: seed.schema.version ?? 1,
          isActive:
            seed.schema.isActive ?? true,
          categoryId: category.id,
        },

        create: {
          name: seed.schema.name,
          slug: seed.schema.slug,
          description: seed.schema.description,
          version: seed.schema.version ?? 1,
          isActive:
            seed.schema.isActive ?? true,
          categoryId: category.id,
        },
      });

    for (const groupSeed of seed.schema.groups) {
      const specificationGroup =
        await tx.specificationGroup.upsert({
          where: {
            schemaId_slug: {
              schemaId: schema.id,
              slug: groupSeed.slug,
            },
          },

          update: {
            name: groupSeed.name,
            description:
              groupSeed.description,
            sortOrder:
              groupSeed.sortOrder ?? 0,
          },

          create: {
            schemaId: schema.id,
            name: groupSeed.name,
            slug: groupSeed.slug,
            description:
              groupSeed.description,
            sortOrder:
              groupSeed.sortOrder ?? 0,
          },
        });

      for (const definitionSeed of groupSeed.definitions) {
        const definition =
          await tx.specificationDefinition.upsert(
            {
              where: {
                groupId_slug: {
                  groupId:
                    specificationGroup.id,
                  slug: definitionSeed.slug,
                },
              },

              update: {
                name: definitionSeed.name,
                dataType:
                  definitionSeed.dataType,
                unit: definitionSeed.unit,

                isRequired:
                  definitionSeed.isRequired ??
                  false,

                isFilterable:
                  definitionSeed.isFilterable ??
                  false,

                isComparable:
                  definitionSeed.isComparable ??
                  false,

                isSearchable:
                  definitionSeed.isSearchable ??
                  false,

                sortOrder:
                  definitionSeed.sortOrder ??
                  0,
              },

              create: {
                groupId:
                  specificationGroup.id,
                name: definitionSeed.name,
                slug: definitionSeed.slug,
                dataType:
                  definitionSeed.dataType,
                unit: definitionSeed.unit,

                isRequired:
                  definitionSeed.isRequired ??
                  false,

                isFilterable:
                  definitionSeed.isFilterable ??
                  false,

                isComparable:
                  definitionSeed.isComparable ??
                  false,

                isSearchable:
                  definitionSeed.isSearchable ??
                  false,

                sortOrder:
                  definitionSeed.sortOrder ??
                  0,
              },
            },
          );

        if (definitionSeed.options) {
          for (const optionSeed of definitionSeed.options) {
            await tx.specificationOption.upsert({
              where: {
                definitionId_value: {
                  definitionId: definition.id,
                  value: optionSeed.value,
                },
              },

              update: {
                label: optionSeed.label,
                sortOrder:
                  optionSeed.sortOrder ?? 0,
                isActive: true,
              },

              create: {
                definitionId: definition.id,
                label: optionSeed.label,
                value: optionSeed.value,
                sortOrder:
                  optionSeed.sortOrder ?? 0,
                isActive: true,
              },
            });
          }
        }
      }
    }

    return schema;
  });
}

/* =========================================================
   SEED ALL INITIAL SCHEMAS
========================================================= */

export async function seedAllSpecificationSchemas() {
  const results = [];

  for (const seed of CATEGORY_SCHEMA_SEEDS) {
    const result =
      await seedSpecificationSchema(seed);

    results.push(result);
  }

  return results;
}