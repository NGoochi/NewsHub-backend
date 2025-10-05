"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const analysisController_1 = require("../controllers/analysisController");
const router = express_1.default.Router();
// Analysis batch management
router.post('/batch', analysisController_1.createAnalysisBatch);
router.post('/batch/:batchId/start', analysisController_1.startAnalysisBatch);
router.get('/batch/:batchId', analysisController_1.getAnalysisBatchStatus);
router.post('/batch/:batchId/cancel', analysisController_1.cancelAnalysisBatch);
// Project-specific endpoints
router.get('/project/:projectId/batches', analysisController_1.getProjectAnalysisBatches);
exports.default = router;
