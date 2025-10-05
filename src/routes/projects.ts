import express from "express";
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject
} from "../controllers/projectController";

const router = express.Router();

/**
 * GET /projects
 * Retrieve all projects with their articles
 */
router.get("/", getAllProjects);

/**
 * GET /projects/:id
 * Retrieve a specific project by ID
 */
router.get("/:id", getProjectById);

/**
 * POST /projects
 * Create a new project
 */
router.post("/", createProject);

/**
 * PUT /projects/:id
 * Update an existing project
 */
router.put("/:id", updateProject);

/**
 * DELETE /projects/:id
 * Delete a project and all associated articles/quotes
 */
router.delete("/:id", deleteProject);

export default router;
