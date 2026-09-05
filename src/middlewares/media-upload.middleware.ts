import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDirectories = {
  image: path.join(process.cwd(), "uploads", "images"),
  video: path.join(process.cwd(), "uploads", "videos"),
  audio: path.join(process.cwd(), "uploads", "audio"),
};

Object.values(uploadDirectories).forEach((directory) => {
  fs.mkdirSync(directory, { recursive: true });
});

const getMediaType = (
  mimeType: string,
  originalName?: string,
) => {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  if (mimeType.startsWith("audio/")) {
    return "audio";
  }

  // Fallback to file extension
  if (originalName) {
    const extension = path
      .extname(originalName)
      .toLowerCase();

    if (
      [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(
        extension,
      )
    ) {
      return "image";
    }

    if (
      [".mp4", ".webm", ".mov"].includes(extension)
    ) {
      return "video";
    }

    if (
      [".mp3", ".wav", ".ogg"].includes(extension)
    ) {
      return "audio";
    }
  }

  return null;
};

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const mediaType = getMediaType(
  file.mimetype,
  file.originalname,
);

    if (!mediaType) {
      cb(new Error("Unsupported media type"), "");
      return;
    }

    cb(null, uploadDirectories[mediaType]);
  },

  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const baseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}-${baseName || "media"}${extension}`;

    cb(null, uniqueName);
  },
});

const allowedMimeTypes = new Set([
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",

  // Videos
  "video/mp4",
  "video/webm",
  "video/quicktime",

  // Audio
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
]);

const allowedExtensions = new Set([
  // Images
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",

  // Videos
  ".mp4",
  ".webm",
  ".mov",

  // Audio
  ".mp3",
  ".wav",
  ".ogg",
]);

const fileFilter: multer.Options["fileFilter"] = (
  _req,
  file,
  cb,
) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  const mimeAllowed =
    allowedMimeTypes.has(file.mimetype);

  const extensionAllowed =
    allowedExtensions.has(extension);

  if (!mimeAllowed && !extensionAllowed) {
    cb(
      new Error(
        "Unsupported file type. Allowed images: JPG, PNG, WEBP, GIF. Videos: MP4, WEBM, MOV. Audio: MP3, WAV, OGG.",
      ),
    );
    return;
  }

  cb(null, true);
};

export const uploadMedia = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});