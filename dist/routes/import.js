"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const importController_1 = require("../controllers/importController");
const router = express_1.default.Router();
// Import preview and execution
router.post('/preview', importController_1.previewImport);
router.post('/start', importController_1.startImport);
// Session management
router.get('/session/:sessionId', importController_1.getSessionStatus);
router.post('/session/:sessionId/cancel', importController_1.cancelSession);
// Project-specific endpoints
router.get('/project/:projectId/sessions', importController_1.getProjectSessions);
router.get('/project/:projectId/stats', importController_1.getProjectStats);
// Source management
router.get('/sources', importController_1.getSearchSources);
router.get('/countries', importController_1.getAvailableCountries);
exports.default = router;
