"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const analysisController_1 = require("../controllers/analysisController");
const router = express_1.default.Router();
/**
 * POST /analysis/run
 * Start Gemini analysis for selected articles
 */
router.post("/run", analysisController_1.runAnalysis);
/**
 * GET /analysis/status/:projectId
 * Get analysis status for a project
 */
router.get("/status/:projectId", analysisController_1.getAnalysisStatus);
/**
 * GET /analysis/progress/:projectId
 * Get detailed progress of analysis jobs
 */
router.get("/progress/:projectId", analysisController_1.getAnalysisProgress);
exports.default = router;
