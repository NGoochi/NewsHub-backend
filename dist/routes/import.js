"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const importController_1 = require("../controllers/importController");
const upload_1 = require("../middleware/upload");
const router = express_1.default.Router();
// Existing import preview and execution endpoints
router.post('/preview', importController_1.previewImport);
router.post('/start', importController_1.startImport);
// New specialized import endpoints
router.post('/newsapi', importController_1.importNewsAPI);
router.post('/pdf', upload_1.pdfUpload.single('pdf'), importController_1.importPDF);
router.post('/manual', importController_1.importManual);
// Session management
router.get('/session/:sessionId', importController_1.getSessionStatus);
router.post('/session/:sessionId/cancel', importController_1.cancelSession);
// Project-specific endpoints
router.get('/project/:projectId/sessions', importController_1.getProjectSessions);
router.get('/project/:projectId/stats', importController_1.getProjectStats);
// Source management
router.get('/sources', importController_1.getSearchSources);
router.get('/countries', importController_1.getAvailableCountries);
router.get('/languages', importController_1.getAvailableLanguages);
exports.default = router;
