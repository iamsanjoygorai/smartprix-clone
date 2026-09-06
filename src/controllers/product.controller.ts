import { Request, Response } from "express";

import {
  getProducts,
  getProductBySlug,
  getProductPrices,
  getProductPriceHistory,
  getProductSpecifications,
} from "../services/product.service";

export const getAllProducts = async (
  req: Request,
  res: Response,
) => {
  try {
    const result = await getProducts(req.query);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

export const getProduct = async (
  req: Request,
  res: Response,
) => {
  try {
    const slug = Array.isArray(req.params.slug)
      ? req.params.slug[0]
      : req.params.slug;

    if (!slug) {
      res.status(400).json({
        success: false,
        message: "Product slug is required",
      });
      return;
    }

    const product = await getProductBySlug(slug);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Failed to fetch product:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};

export const getPrices = async (
  req: Request,
  res: Response,
) => {
  try {
    const slug = Array.isArray(req.params.slug)
      ? req.params.slug[0]
      : req.params.slug;

    if (!slug) {
      res.status(400).json({
        success: false,
        message: "Product slug is required",
      });
      return;
    }

    const prices = await getProductPrices(slug);

    res.status(200).json({
      success: true,
      data: prices,
    });
  } catch (error) {
    console.error("Failed to fetch product prices:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product prices",
    });
  }
};

export const getPriceHistory = async (
  req: Request,
  res: Response,
) => {
  try {
    const slug = Array.isArray(req.params.slug)
      ? req.params.slug[0]
      : req.params.slug;

    if (!slug) {
      res.status(400).json({
        success: false,
        message: "Product slug is required",
      });
      return;
    }

    const history = await getProductPriceHistory(slug);

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Failed to fetch price history:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch price history",
    });
  }
};

export const getSpecifications = async (
  req: Request,
  res: Response,
) => {
  try {
    const slug = Array.isArray(req.params.slug)
      ? req.params.slug[0]
      : req.params.slug;

    if (!slug) {
      res.status(400).json({
        success: false,
        message: "Product slug is required",
      });
      return;
    }

    const specifications = await getProductSpecifications(slug);

    res.status(200).json({
      success: true,
      data: specifications,
    });
  } catch (error) {
    console.error("Failed to fetch product specifications:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product specifications",
    });
  }
};