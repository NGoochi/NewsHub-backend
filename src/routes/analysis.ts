import express from 'express';
import {
  createAnalysisBatch,
  startAnalysisBatch,
  getAnalysisBatchStatus,
  getProjectAnalysisBatches,
  cancelAnalysisBatch
} from '../controllers/analysisController';

const router = express.Router();

// Analysis batch management
router.post('/batch', createAnalysisBatch);
router.post('/batch/:batchId/start', startAnalysisBatch);
router.get('/batch/:batchId', getAnalysisBatchStatus);
router.post('/batch/:batchId/cancel', cancelAnalysisBatch);

// Project-specific endpoints
router.get('/project/:projectId/batches', getProjectAnalysisBatches);

export default router;