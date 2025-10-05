import express from "express";
import {
  getSettings,
  updateSettings,
  getGeminiPrompts,
  updateGeminiPrompts,
  getCategories,
  updateCategories
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

export default router;
