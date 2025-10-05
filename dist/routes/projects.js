"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const projectController_1 = require("../controllers/projectController");
const router = express_1.default.Router();
/**
 * GET /projects
 * Retrieve all projects with their articles
 */
router.get("/", projectController_1.getAllProjects);
/**
 * GET /projects/:id
 * Retrieve a specific project by ID
 */
router.get("/:id", projectController_1.getProjectById);
/**
 * POST /projects
 * Create a new project
 */
router.post("/", projectController_1.createProject);
/**
 * PUT /projects/:id
 * Update an existing project
 */
router.put("/:id", projectController_1.updateProject);
/**
 * DELETE /projects/:id
 * Delete a project and all associated articles/quotes
 */
router.delete("/:id", projectController_1.deleteProject);
exports.default = router;
