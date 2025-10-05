import express from "express";
import {
  exportToSheets,
  getExportStatus,
  downloadExport
} from "../controllers/exportController";

const router = express.Router();

/**
 * POST /export/:projectId
 * Export project data to Google Sheets
 */
router.post("/:projectId", exportToSheets);

/**
 * GET /export/status/:projectId
 * Get export status for a project
 */
router.get("/status/:projectId", getExportStatus);

/**
 * GET /export/download/:projectId
 * Download export file
 */
router.get("/download/:projectId", downloadExport);

export default router;
