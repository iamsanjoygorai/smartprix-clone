import { Request, Response } from "express";
import path from "path";

const getMediaType = (
  mimeType: string,
  originalName: string,
) => {
  // Check MIME type first
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

  return "other";
};

export const uploadMediaFile = (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "Please select a file to upload.",
      });
      return;
    }

    const file = req.file;

    const type = getMediaType(
      file.mimetype,
      file.originalname,
    );

    const url = `/uploads/${type}s/${file.filename}`;

    res.status(201).json({
      success: true,
      message: "File uploaded successfully.",
      data: {
        url,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        type,
      },
    });
  } catch (error) {
    console.error("Media upload error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to upload file.",
    });
  }
};