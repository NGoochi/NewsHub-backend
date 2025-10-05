"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const exportController_1 = require("../controllers/exportController");
const router = express_1.default.Router();
/**
 * POST /export/:projectId
 * Export project data to Google Sheets
 */
router.post("/:projectId", exportController_1.exportToSheets);
/**
 * GET /export/status/:projectId
 * Get export status for a project
 */
router.get("/status/:projectId", exportController_1.getExportStatus);
/**
 * GET /export/download/:projectId
 * Download export file
 */
router.get("/download/:projectId", exportController_1.downloadExport);
exports.default = router;
