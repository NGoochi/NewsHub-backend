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
  getAvailableLanguages
} from '../controllers/importController';

const router = express.Router();

// Import preview and execution
router.post('/preview', previewImport);
router.post('/start', startImport);

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
