import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const uploadDirectory = path.join(
  process.cwd(),
  "uploads",
  "products",
);

fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".heic",
  ".heif",
];

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
  "application/octet-stream",
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (_req, file, cb) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${extension}`;

    cb(null, filename);
  },
});

const fileFilter: multer.Options["fileFilter"] = (
  _req,
  file,
  cb,
) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  const validExtension =
    allowedExtensions.includes(extension);

  const validMimeType =
    allowedMimeTypes.includes(file.mimetype);

  if (!validExtension || !validMimeType) {
    cb(
      new Error(
        `Unsupported image file: ${file.originalname} (${file.mimetype})`,
      ),
    );
    return;
  }

  cb(null, true);
};

export const productImageUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});