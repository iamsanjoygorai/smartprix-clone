import { Request, Response } from "express";

import prisma from "../db/prisma";

import {
  getSearchSuggestions,
  recordSearchQuery,
} from "../services/search.service";

/* =========================================================
   SEARCH SUGGESTIONS
========================================================= */

export const searchSuggestions = async (
  req: Request,
  res: Response,
) => {
  try {
    const query =
      typeof req.query.q === "string"
        ? req.query.q.trim()
        : "";

    if (query.length < 1) {
      return res.json({
        success: true,
        data: {
          products: [],
          brands: [],
          categories: [],
          popular: [],
        },
      });
    }

    const suggestions =
      await getSearchSuggestions(query);

    return res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error(
      "SEARCH SUGGESTIONS ERROR:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load search suggestions",
    });
  }
};

/* =========================================================
   RECORD SEARCH
========================================================= */

export const recordSearch = async (
  req: Request,
  res: Response,
) => {
  try {
    const query = String(
      req.body?.query ?? "",
    ).trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    /* -------------------------------------------------------
       Global search analytics
    ------------------------------------------------------- */

    await recordSearchQuery(query);

    /* -------------------------------------------------------
       Authenticated user/session information
    ------------------------------------------------------- */

    const authUser = (req as any).user;

    const userId =
      typeof authUser === "string"
        ? authUser
        : typeof authUser?.userId === "string"
          ? authUser.userId
          : typeof authUser?.id === "string"
            ? authUser.id
            : null;

    const sessionId =
      typeof authUser === "object" &&
      authUser !== null &&
      typeof authUser.sessionId === "string"
        ? authUser.sessionId
        : null;

    /* -------------------------------------------------------
       Normalize search query
    ------------------------------------------------------- */

    const normalized = query
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

    /* -------------------------------------------------------
       Request/network information
    ------------------------------------------------------- */

    const forwardedFor =
      req.headers["x-forwarded-for"];

    const ipAddress =
  req.ip ||
  (typeof forwardedFor === "string"
    ? forwardedFor.split(",")[0]?.trim() || null
    : Array.isArray(forwardedFor)
      ? forwardedFor[0] ?? null
      : null);

    const userAgent =
      typeof req.headers["user-agent"] === "string"
        ? req.headers["user-agent"]
        : null;

    const timezone =
      typeof req.headers["x-timezone"] === "string"
        ? req.headers["x-timezone"]
        : null;

    /* -------------------------------------------------------
       Optional frontend filters
    ------------------------------------------------------- */

    const body = req.body ?? {};
  const filters =
  body.filters &&
  typeof body.filters === "object"
    ? body.filters
    : null;

    /* -------------------------------------------------------
       Individual user search history

       Only create SearchHistory when a valid authenticated
       user ID is available.
    ------------------------------------------------------- */

    if (typeof userId === "string") {
      await prisma.searchHistory.create({
        data: {
          userId,
          sessionId,
          query,
          normalized,
          filters,
          ipAddress,
          userAgent,
          timezone,
        },
      });
    }

    return res.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Record search error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to record search",
    });
  }
};