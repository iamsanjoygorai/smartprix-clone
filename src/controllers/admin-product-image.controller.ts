import { Request, Response } from "express";

export const uploadProductImage = (
  req: Request,
  res: Response,
) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "Product image is required",
      });
      return;
    }

    const imageUrl = `/uploads/products/${req.file.filename}`;

    res.status(201).json({
      success: true,
      message: "Product image uploaded successfully",
      data: {
        url: imageUrl,
        filename: req.file.filename,
      },
    });
  } catch (error) {
    console.error("Failed to upload product image:", error);

    res.status(500).json({
      success: false,
      message: "Failed to upload product image",
    });
  }
};