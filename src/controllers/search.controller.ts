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

    /*
     * Don't perform database searches for very short input.
     */
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

    /*
     * Keep existing global search analytics.
     */
    await recordSearchQuery(query);

    /*
     * Get authenticated user/session information.
     *
     * requireAuth normally attaches the decoded JWT
     * payload to req.user.
     */
    const authUser = (req as any).user;

    const userId =
      typeof authUser === "string"
        ? authUser
        : authUser?.userId ??
          authUser?.id ??
          null;

    const sessionId =
      typeof authUser === "object"
        ? authUser?.sessionId ?? null
        : null;

    /*
     * Normalize the search query.
     */
    const normalized = query
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

    /*
     * Capture request/network information.
     *
     * Do NOT store authentication tokens,
     * passwords, OTPs or cookies.
     */
    const ipAddress =
      req.ip ||
      req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
      null;

    const userAgent =
      req.headers["user-agent"]?.toString() || null;
      const timezone =
  req.headers["x-timezone"]?.toString() || null;

    /*
     * Optional filters sent by the frontend.
     *
     * Example:
     * {
     *   brands: ["samsung"],
     *   minPrice: 20000,
     *   maxPrice: 50000
     * }
     */
    const filters =
      req.body?.filters &&
      typeof req.body.filters === "object"
        ? req.body.filters
        : null;

    /*
     * Save individual user search history.
     *
     * SearchHistory is separate from SearchQuery:
     *
     * SearchQuery   = aggregate analytics
     * SearchHistory = individual user activity
     */
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