import express from "express";
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  archiveProject,
  unarchiveProject,
  bulkArchiveProjects,
  bulkUnarchiveProjects
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
 * PUT /projects/:id/archive
 * Archive a project
 */
router.put("/:id/archive", archiveProject);

/**
 * PUT /projects/:id/unarchive
 * Unarchive a project
 */
router.put("/:id/unarchive", unarchiveProject);

/**
 * POST /projects/bulk-archive
 * Bulk archive multiple projects
 */
router.post("/bulk-archive", bulkArchiveProjects);

/**
 * POST /projects/bulk-unarchive
 * Bulk unarchive multiple projects
 */
router.post("/bulk-unarchive", bulkUnarchiveProjects);

/**
 * DELETE /projects/:id
 * Delete a project and all associated articles/quotes (only if archived)
 */
router.delete("/:id", deleteProject);

export default router;
