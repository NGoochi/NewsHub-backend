import express from 'express';
import {
  previewImport,
  startImport,
  getSessionStatus,
  getProjectSessions,
  cancelSession,
  getProjectStats,
  getSearchSources,
  getAvailableCountries,
  getAvailableLanguages,
  importNewsAPI,
  importPDF,
  importManual
} from '../controllers/importController';
import { pdfUpload } from '../middleware/upload';

const router = express.Router();

// Existing import preview and execution endpoints
router.post('/preview', previewImport);
router.post('/start', startImport);

// New specialized import endpoints
router.post('/newsapi', importNewsAPI);
router.post('/pdf', pdfUpload.single('pdf'), importPDF);
router.post('/manual', importManual);

// Session management
router.get('/session/:sessionId', getSessionStatus);
router.post('/session/:sessionId/cancel', cancelSession);

// Project-specific endpoints
router.get('/project/:projectId/sessions', getProjectSessions);
router.get('/project/:projectId/stats', getProjectStats);

// Source management
router.get('/sources', getSearchSources);
router.get('/countries', getAvailableCountries);
router.get('/languages', getAvailableLanguages);

export default router;
