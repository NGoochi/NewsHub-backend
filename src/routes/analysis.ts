import express from "express";
import {
  runAnalysis,
  getAnalysisStatus,
  getAnalysisProgress
} from "../controllers/analysisController";

const router = express.Router();

/**
 * POST /analysis/run
 * Start Gemini analysis for selected articles
 */
router.post("/run", runAnalysis);

/**
 * GET /analysis/status/:projectId
 * Get analysis status for a project
 */
router.get("/status/:projectId", getAnalysisStatus);

/**
 * GET /analysis/progress/:projectId
 * Get detailed progress of analysis jobs
 */
router.get("/progress/:projectId", getAnalysisProgress);

export default router;
