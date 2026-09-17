import type {
  CreateSpecificationSchemaInput,
} from "./specification.service";

type FieldConfig = {
  name: string;
  slug: string;
  dataType: string;
  unit?: string;
  isRequired?: boolean;
  isFilterable?: boolean;
  isComparable?: boolean;
  isSearchable?: boolean;
};

type GroupConfig = {
  name: string;
  slug: string;
  definitions: FieldConfig[];
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function field(
  name: string,
  options: Omit<FieldConfig, "name" | "slug" | "dataType"> & {
    dataType?: string;
  } = {},
): FieldConfig {
  const {
    dataType,
    ...rest
  } = options;

  return {
    name,
    slug: slugify(name),
    dataType: dataType ?? "TEXT",
    ...rest,
  };
}

function group(
  name: string,
  definitions: FieldConfig[],
): GroupConfig {
  return {
    name,
    slug: slugify(name),
    definitions,
  };
}

/* =========================================================
   MOBILE & TABLETS
========================================================= */

export const mobileTabletsSchema: CreateSpecificationSchemaInput = {
  categoryId: "REPLACE_WITH_MOBILE_CATEGORY_ID",
  name: "Mobile & Tablets",
  slug: "mobile-tablets",
  description:
    "Specification schema for mobile phones and tablets",

  groups: [
    group("General", [
      field("Model", {
        isSearchable: true,
      }),

      field("Sim Type"),

      field("Dual Sim", {
        dataType: "BOOLEAN",
        isFilterable: true,
      }),

      field("Sim Size"),

      field("eSIM Support", {
        dataType: "BOOLEAN",
        isFilterable: true,
      }),

      field("Device Type", {
        isFilterable: true,
      }),

      field("Release Date", {
        dataType: "DATE",
        isFilterable: true,
      }),

      field("In The Box", {
        dataType: "LONG_TEXT",
      }),
    ]),

    group("Design", [
      field("Dimensions"),

      field("Weight", {
        dataType: "DECIMAL",
        unit: "g",
        isFilterable: true,
        isComparable: true,
      }),

      field("Colors", {
        dataType: "MULTI_SELECT",
        isFilterable: true,
      }),
    ]),

    group("Display", [
      field("Type", {
        isFilterable: true,
        isComparable: true,
      }),

      field("Touch", {
        dataType: "BOOLEAN",
        isFilterable: true,
      }),

      field("Size", {
        dataType: "DECIMAL",
        unit: "inch",
        isFilterable: true,
        isComparable: true,
      }),

      field("Aspect Ratio", {
        isFilterable: true,
        isComparable: true,
      }),

      field("PPI", {
        dataType: "NUMBER",
        unit: "ppi",
        isFilterable: true,
        isComparable: true,
      }),

      field("Screen to Body Ratio", {
        dataType: "DECIMAL",
        unit: "%",
        isFilterable: true,
        isComparable: true,
      }),

      field("Glass Type"),

      field("Brightness", {
        dataType: "NUMBER",
        unit: "nits",
        isFilterable: true,
        isComparable: true,
      }),

      field("HDR Support", {
        dataType: "BOOLEAN",
        isFilterable: true,
      }),

      field("Adaptive Refresh Rate", {
        dataType: "BOOLEAN",
        isFilterable: true,
      }),

      field("Color Gamut"),

      field("Features", {
        dataType: "LONG_TEXT",
      }),

      field("Notch"),
    ]),

    group("Memory", [
      field("RAM", {
        dataType: "NUMBER",
        unit: "GB",
        isFilterable: true,
        isComparable: true,
      }),

      field("Storage", {
        dataType: "NUMBER",
        unit: "GB",
        isFilterable: true,
        isComparable: true,
      }),

      field("Card Slot", {
        dataType: "BOOLEAN",
        isFilterable: true,
      }),
    ]),

    group("Connectivity", [
      field("GPRS", {
        dataType: "BOOLEAN",
      }),

      field("EDGE", {
        dataType: "BOOLEAN",
      }),

      field("3G", {
        dataType: "BOOLEAN",
        isFilterable: true,
      }),

      field("4G", {
        dataType: "BOOLEAN",
        isFilterable: true,
      }),

      field("5G", {
        dataType: "BOOLEAN",
        isFilterable: true,
      }),

      field("5G Bands"),

      field("VoLTE", {
        dataType: "BOOLEAN",
      }),

      field("Wifi"),

      field("Wifi Version"),

      field("Ultra Wideband (UWB) Support", {
        dataType: "BOOLEAN",
      }),

      field("Bluetooth"),

      field("USB"),

      field("USB Features", {
        dataType: "LONG_TEXT",
      }),
    ]),

    group("Performance", [
      field("Geekbench Score", {
        dataType: "NUMBER",
        isFilterable: true,
        isComparable: true,
      }),
    ]),

    group("Extra", [
      field("GPS", {
        dataType: "BOOLEAN",
      }),

      field("Fingerprint Sensor", {
        dataType: "BOOLEAN",
        isFilterable: true,
      }),

      field("Face Unlock", {
        dataType: "BOOLEAN",
      }),

      field("Sensors", {
        dataType: "LONG_TEXT",
      }),

      field("3.5mm Headphone Jack", {
        dataType: "BOOLEAN",
        isFilterable: true,
      }),

      field("NFC", {
        dataType: "BOOLEAN",
        isFilterable: true,
      }),

      field("AI Features", {
        dataType: "LONG_TEXT",
      }),

      field("Water Resistance", {
        dataType: "BOOLEAN",
        isFilterable: true,
      }),

      field("IP Rating", {
        isFilterable: true,
        isComparable: true,
      }),

      field("Dust Resistant", {
        dataType: "BOOLEAN",
      }),

      field("Extra Features", {
        dataType: "LONG_TEXT",
      }),
    ]),

    group("Camera", [
      field("Rear Camera", {
        dataType: "LONG_TEXT",
      }),

      field("Camera Sensor", {
        dataType: "LONG_TEXT",
      }),

      field("Auto Focus", {
        dataType: "BOOLEAN",
      }),

      field("Features", {
        dataType: "LONG_TEXT",
      }),

      field("Video Recording", {
        dataType: "LONG_TEXT",
      }),

      field("Flash"),

      field("Front Camera", {
        dataType: "LONG_TEXT",
      }),

      field("Front Video Recording", {
        dataType: "LONG_TEXT",
      }),
    ]),

    group("Technical", [
      field("OS", {
        isFilterable: true,
      }),

      field("Chipset", {
        isSearchable: true,
      }),

      field("CPU"),

      field("Fabrication Node"),

      field("GPU"),

      field("Java"),

      field("Browser"),
    ]),

    group("Multimedia", [
      field("Email", {
        dataType: "BOOLEAN",
      }),

      field("Music", {
        dataType: "BOOLEAN",
      }),

      field("Video", {
        dataType: "BOOLEAN",
      }),

      field("FM Radio", {
        dataType: "BOOLEAN",
      }),

      field("Document Reader", {
        dataType: "BOOLEAN",
      }),
    ]),

    group("Battery", [
      field("Type"),

      field("Size", {
        dataType: "NUMBER",
        unit: "mAh",
        isFilterable: true,
        isComparable: true,
      }),

      field("Fast Charging"),

      field("Wireless Charging", {
        dataType: "BOOLEAN",
        isFilterable: true,
      }),

      field("Reverse Wireless Charging", {
        dataType: "BOOLEAN",
      }),

      field("Video Playback Time"),
    ]),
  ],
};

/* =========================================================
   LAPTOPS
========================================================= */

export const laptopsSchema: CreateSpecificationSchemaInput = {
  categoryId: "REPLACE_WITH_LAPTOP_CATEGORY_ID",
  name: "Laptops",
  slug: "laptops",
  description: "Specification schema for laptops",

  groups: [
    group("General", [
      field("Series"),

      field("Model", {
        isSearchable: true,
      }),

      field("Utility"),

      field("OS", {
        isFilterable: true,
      }),

      field("Dimensions"),

      field("Weight", {
        dataType: "DECIMAL",
        unit: "kg",
        isFilterable: true,
        isComparable: true,
      }),

      field("Warranty"),
    ]),

    group("Display", [
      field("Type", {
        isFilterable: true,
      }),

      field("Touch", {
        dataType: "BOOLEAN",
        isFilterable: true,
      }),

      field("Size", {
        dataType: "DECIMAL",
        unit: "inch",
        isFilterable: true,
        isComparable: true,
      }),

      field("Resolution", {
        isFilterable: true,
        isComparable: true,
      }),

      field("PPI", {
        dataType: "NUMBER",
        unit: "ppi",
        isComparable: true,
      }),

      field("Refresh Rate", {
        dataType: "NUMBER",
        unit: "Hz",
        isFilterable: true,
        isComparable: true,
      }),

      field("Aspect Ratio"),

      field("Anti Glare Screen", {
        dataType: "BOOLEAN",
        isFilterable: true,
      }),

      field("Features", {
        dataType: "LONG_TEXT",
      }),
    ]),

    group("Connectivity", [
      field("Ethernet", {
        dataType: "BOOLEAN",
      }),

      field("WiFi"),

      field("Bluetooth"),

      field("USB Ports"),

      field("HDMI"),

      field("Card Reader", {
        dataType: "BOOLEAN",
      }),

      field("Microphone In", {
        dataType: "BOOLEAN",
      }),

      field("Headphone Jack", {
        dataType: "BOOLEAN",
      }),
    ]),

    group("Input", [
      field("Camera"),

      field("Keyboard"),

      field("Keyboard Backlit", {
        dataType: "BOOLEAN",
      }),

      field("Touchpad"),

      field("Inbuilt Microphone", {
        dataType: "BOOLEAN",
      }),

      field("Speakers"),

      field("Optical Drive", {
        dataType: "BOOLEAN",
      }),
    ]),

    group("Processor", [
      field("Processor", {
        isSearchable: true,
      }),

      field("Speed", {
        dataType: "DECIMAL",
        unit: "GHz",
        isComparable: true,
      }),

      field("Cores", {
        dataType: "NUMBER",
        isComparable: true,
      }),

      field("Cache"),

      field("Brand", {
        isFilterable: true,
      }),

      field("Series"),

      field("Model"),

      field("Generation"),

      field("Process Node"),
    ]),

    group("Graphics", [
      field("GPU", {
        isSearchable: true,
      }),

      field("Brand", {
        isFilterable: true,
      }),
    ]),

    group("Memory", [
      field("RAM", {
        dataType: "NUMBER",
        unit: "GB",
        isFilterable: true,
        isComparable: true,
      }),

      field("RAM Bus Speed", {
        dataType: "NUMBER",
        unit: "MHz",
        isComparable: true,
      }),

      field("Solid State Drive", {
        dataType: "NUMBER",
        unit: "GB",
        isFilterable: true,
        isComparable: true,
      }),

      field("Max SSD Supported"),

      field("SSD Interface"),
    ]),

    group("Battery", [
      field("Adapter Type"),
    ]),

    group("Extra", [
      field("Included Software", {
        dataType: "LONG_TEXT",
      }),

      field("Sales Package", {
        dataType: "LONG_TEXT",
      }),
    ]),
  ],
};

/* =========================================================
   TV
========================================================= */

export const tvSchema: CreateSpecificationSchemaInput = {
  categoryId: "REPLACE_WITH_TV_CATEGORY_ID",
  name: "TV",
  slug: "tv",
  description: "Specification schema for televisions",

  groups: [
    group("General", [
      field("Model", {
        isSearchable: true,
      }),

      field("Type", {
        isFilterable: true,
      }),

      field("Warranty"),

      field("In The Box", {
        dataType: "LONG_TEXT",
      }),

      field("Launch Year", {
        dataType: "NUMBER",
        isFilterable: true,
      }),
    ]),

    group("Display", [
      field("Size (Diagonal)", {
        dataType: "DECIMAL",
        unit: "inch",
        isFilterable: true,
        isComparable: true,
      }),

      field("Screen Resolution", {
        isFilterable: true,
        isComparable: true,
      }),

      field("Backlight Type"),

      field("Brightness", {
        dataType: "NUMBER",
        unit: "nits",
        isComparable: true,
      }),

      field("Contrast Ratio"),

      field("Refresh Rate", {
        dataType: "NUMBER",
        unit: "Hz",
        isFilterable: true,
        isComparable: true,
      }),

      field("Aspect Ratio"),

      field("HDR", {
        dataType: "BOOLEAN",
        isFilterable: true,
      }),

      field("HDR Format Types"),
    ]),

    group("Video", [
      field("Picture Processor"),
    ]),

    group("Audio", [
      field("Number Of Speakers", {
        dataType: "NUMBER",
        isComparable: true,
      }),

      field("Total Speaker Output", {
        dataType: "DECIMAL",
        unit: "W",
        isComparable: true,
      }),

      field("Output Per Speaker", {
        dataType: "DECIMAL",
        unit: "W",
        isComparable: true,
      }),

      field("Sound Technology"),
    ]),

    group("Connectivity", [
      field("USB Ports", {
        dataType: "NUMBER",
        isComparable: true,
      }),

      field("HDMI Ports", {
        dataType: "NUMBER",
        isFilterable: true,
        isComparable: true,
      }),

      field("Built-In Chromecast", {
        dataType: "BOOLEAN",
      }),

      field("Ethernet", {
        dataType: "BOOLEAN",
      }),
    ]),

    group("Power Supply", [
      field("Power Consumption", {
        dataType: "DECIMAL",
        unit: "W",
        isComparable: true,
      }),

      field("Power Consumption (Stand-by)", {
        dataType: "DECIMAL",
        unit: "W",
        isComparable: true,
      }),
    ]),

    group("Smart TV Features", [
      field("Smart TV", {
        dataType: "BOOLEAN",
        isFilterable: true,
      }),

      field("Operating System (OS)", {
        isFilterable: true,
      }),

      field("APP Store Type"),

      field("Wi-Fi", {
        dataType: "BOOLEAN",
      }),

      field("Voice Assistant", {
        isFilterable: true,
      }),

      field("Bluetooth", {
        dataType: "BOOLEAN",
      }),

      field("RAM", {
        dataType: "NUMBER",
        unit: "GB",
        isComparable: true,
      }),

      field("Storage", {
        dataType: "NUMBER",
        unit: "GB",
        isComparable: true,
      }),

      field("Supported Apps", {
        dataType: "LONG_TEXT",
      }),
    ]),
  ],
};

/* =========================================================
   MOTORCYCLES
========================================================= */

export const motorcyclesSchema: CreateSpecificationSchemaInput = {
  categoryId: "REPLACE_WITH_MOTORCYCLE_CATEGORY_ID",
  name: "Motorcycles",
  slug: "motorcycles",
  description:
    "Specification schema for motorcycles",

  groups: [
    group("General", [
      field("Model", {
        isSearchable: true,
      }),

      field("Type", {
        isFilterable: true,
      }),
    ]),

    group("Engine and Transmission Details", [
      field("Engine Type"),

      field("Engine Displacement", {
        dataType: "NUMBER",
        unit: "cc",
        isFilterable: true,
        isComparable: true,
      }),

      field("Cylinders", {
        dataType: "NUMBER",
        isComparable: true,
      }),

      field("Valves/Cylinder", {
        dataType: "NUMBER",
      }),

      field("Maximum Power", {
        dataType: "DECIMAL",
        unit: "bhp",
        isComparable: true,
      }),

      field("Maximum Torque", {
        dataType: "DECIMAL",
        unit: "Nm",
        isComparable: true,
      }),

      field("Transmission Type"),

      field("Start Type"),

      field("Cooling System"),

      field("Bore", {
        dataType: "DECIMAL",
        unit: "mm",
      }),

      field("Stroke", {
        dataType: "DECIMAL",
        unit: "mm",
      }),

      field("Compression Ratio"),

      field("Drive Type"),

      field("Clutch Type"),
    ]),

    group("Performance Details", [
      field("Top Speed", {
        dataType: "NUMBER",
        unit: "km/h",
        isFilterable: true,
        isComparable: true,
      }),

      field("Fuel Tank Capacity", {
        dataType: "DECIMAL",
        unit: "L",
        isComparable: true,
      }),

      field("Fuel Type", {
        isFilterable: true,
      }),
    ]),

    group("Suspension and Braking Details", [
      field("Front Suspension"),

      field("Rear Suspension"),

      field("Shock Absorbers Type"),

      field("Brake Type"),

      field("Frame Details"),
    ]),

    group("Body Design Details", [
      field("Kerb Weight", {
        dataType: "DECIMAL",
        unit: "kg",
        isFilterable: true,
        isComparable: true,
      }),

      field("Length", {
        dataType: "DECIMAL",
        unit: "mm",
        isComparable: true,
      }),

      field("Width", {
        dataType: "DECIMAL",
        unit: "mm",
        isComparable: true,
      }),

      field("Height", {
        dataType: "DECIMAL",
        unit: "mm",
        isComparable: true,
      }),

      field("Ground Clearance", {
        dataType: "DECIMAL",
        unit: "mm",
        isFilterable: true,
        isComparable: true,
      }),

      field("Wheel Base", {
        dataType: "DECIMAL",
        unit: "mm",
        isComparable: true,
      }),

      field("Seating Capacity", {
        dataType: "NUMBER",
        isComparable: true,
      }),

      field("Seat Height", {
        dataType: "DECIMAL",
        unit: "mm",
        isComparable: true,
      }),

      field("Wheel Design"),

      field("Tyre Type"),

      field("Tyre Size Front"),

      field("Tyre Size Rear"),
    ]),

    group("Comfort and Convenience Details", [
      field("Cruise Control", {
        dataType: "BOOLEAN",
        isFilterable: true,
      }),

      field("Side Stand", {
        dataType: "BOOLEAN",
      }),

      field("Passenger Footrest", {
        dataType: "BOOLEAN",
      }),
    ]),

    group("Safety Features", [
      field("Anti Lock Braking System (ABS)", {
        dataType: "BOOLEAN",
        isFilterable: true,
      }),

      field("Traction Control", {
        dataType: "BOOLEAN",
        isFilterable: true,
      }),

      field("Side Stand Indicator", {
        dataType: "BOOLEAN",
      }),

      field("Side Stand Cut Off Switch", {
        dataType: "BOOLEAN",
      }),

      field("Kill Switch", {
        dataType: "BOOLEAN",
      }),
    ]),

    group("Lights and Indicators", [
      field("Headlamps"),

      field("Daytime Running Lights (DRLs)", {
        dataType: "BOOLEAN",
      }),

      field("Tail Lights"),

      field("Brake Lights"),

      field("Gear Position Indicator", {
        dataType: "BOOLEAN",
      }),

      field("Tachometer", {
        dataType: "BOOLEAN",
      }),

      field("Speedometer", {
        dataType: "BOOLEAN",
      }),

      field("Fuel Meter", {
        dataType: "BOOLEAN",
      }),

      field("Odometer", {
        dataType: "BOOLEAN",
      }),

      field("Tripmeter", {
        dataType: "BOOLEAN",
      }),

      field("Turn Indicator Type"),

      field("Pass Light", {
        dataType: "BOOLEAN",
      }),

      field("Clock", {
        dataType: "BOOLEAN",
      }),

      field("Distance To Empty Indicator", {
        dataType: "BOOLEAN",
      }),
    ]),

    group("Instrument Cluster Details", [
      field("Instrument Cluster"),
    ]),
  ],
};

/* =========================================================
   ALL SPECIFICATION SCHEMA SEEDS
========================================================= */

export const specificationSchemaSeeds: CreateSpecificationSchemaInput[] = [
  mobileTabletsSchema,
  laptopsSchema,
  tvSchema,
  motorcyclesSchema,
];
