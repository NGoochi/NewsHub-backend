import express from "express";
import {
  getSettings,
  updateSettings,
  getGeminiPrompts,
  updateGeminiPrompts,
  getCategories,
  updateCategories,
  getContextCacheStatus,
  refreshContextCache,
  clearContextCache,
  clearBatchContextCache
} from "../controllers/settingsController";

const router = express.Router();

/**
 * GET /settings
 * Retrieve all application settings
 */
router.get("/", getSettings);

/**
 * PUT /settings
 * Update application settings
 */
router.put("/", updateSettings);

/**
 * GET /settings/prompts
 * Retrieve Gemini prompt fragments
 */
router.get("/prompts", getGeminiPrompts);

/**
 * PUT /settings/prompts
 * Update Gemini prompt fragments
 */
router.put("/prompts", updateGeminiPrompts);

/**
 * GET /settings/categories
 * Retrieve category definitions
 */
router.get("/categories", getCategories);

/**
 * PUT /settings/categories
 * Update category definitions
 */
router.put("/categories", updateCategories);

/**
 * GET /settings/context-cache
 * Get context cache status
 */
router.get("/context-cache", getContextCacheStatus);

/**
 * POST /settings/context-cache/refresh
 * Refresh context cache
 */
router.post("/context-cache/refresh", refreshContextCache);

/**
 * DELETE /settings/context-cache
 * Clear context cache
 */
router.delete("/context-cache", clearContextCache);

/**
 * DELETE /settings/context-cache/batch
 * Clear batch context cache
 */
router.delete("/context-cache/batch", clearBatchContextCache);

export default router;
