import { Request, Response } from "express";

export const uploadProductImages = (
  req: Request,
  res: Response,
) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: "At least one product image is required",
      });
      return;
    }

    const images = files.map((file, index) => ({
      url: `/uploads/products/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      sortOrder: index,
      isPrimary: index === 0,
    }));

    res.status(201).json({
      success: true,
      message: `${images.length} product image${
        images.length > 1 ? "s" : ""
      } uploaded successfully`,
      data: images,
    });
  } catch (error) {
    console.error(
      "Failed to upload product images:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Failed to upload product images",
    });
  }
};