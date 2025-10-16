"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const settingsController_1 = require("../controllers/settingsController");
const router = express_1.default.Router();
/**
 * GET /settings
 * Retrieve all application settings
 */
router.get("/", settingsController_1.getSettings);
/**
 * PUT /settings
 * Update application settings
 */
router.put("/", settingsController_1.updateSettings);
/**
 * GET /settings/prompts
 * Retrieve Gemini prompt fragments
 */
router.get("/prompts", settingsController_1.getGeminiPrompts);
/**
 * PUT /settings/prompts
 * Update Gemini prompt fragments
 */
router.put("/prompts", settingsController_1.updateGeminiPrompts);
/**
 * GET /settings/categories
 * Retrieve category definitions
 */
router.get("/categories", settingsController_1.getCategories);
/**
 * PUT /settings/categories
 * Update category definitions
 */
router.put("/categories", settingsController_1.updateCategories);
/**
 * GET /settings/context-cache
 * Get context cache status
 */
router.get("/context-cache", settingsController_1.getContextCacheStatus);
/**
 * POST /settings/context-cache/refresh
 * Refresh context cache
 */
router.post("/context-cache/refresh", settingsController_1.refreshContextCache);
/**
 * DELETE /settings/context-cache
 * Clear context cache
 */
router.delete("/context-cache", settingsController_1.clearContextCache);
/**
 * DELETE /settings/context-cache/batch
 * Clear batch context cache
 */
router.delete("/context-cache/batch", settingsController_1.clearBatchContextCache);
exports.default = router;
