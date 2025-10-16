import { Request, Response } from "express";
import prisma from "../lib/db";
import { validateProjectData, validateRequiredFields } from "../utils/validation";

/**
 * Create a new project
 * POST /projects
 */
export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    
    // Validate input data
    const validation = validateProjectData({ name, description });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join(', ')
      });
    }

    const project = await prisma.project.create({
      data: { name, description }
    });

    res.status(201).json({
      success: true,
      data: project,
      error: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to create project"
    });
  }
};

/**
 * Get all projects with their articles
 * GET /projects
 */
export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        articles: {
          include: {
            quotes: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: projects,
      error: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch projects"
    });
  }
};

/**
 * Get a specific project by ID
 * GET /projects/:id
 */
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        articles: {
          include: {
            quotes: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found"
      });
    }

    res.json({
      success: true,
      data: project,
      error: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch project"
    });
  }
};

/**
 * Update an existing project
 * PUT /projects/:id
 */
export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Validate input data
    const validation = validateProjectData({ name, description });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join(', ')
      });
    }

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        error: "Project not found"
      });
    }

    const project = await prisma.project.update({
      where: { id },
      data: { name, description }
    });

    res.json({
      success: true,
      data: project,
      error: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update project"
    });
  }
};

/**
 * Archive a project
 * PUT /projects/:id/archive
 */
export const archiveProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        error: "Project not found"
      });
    }

    const project = await prisma.project.update({
      where: { id },
      data: { archived: true }
    });

    res.json({
      success: true,
      data: project,
      error: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to archive project"
    });
  }
};

/**
 * Unarchive a project
 * PUT /projects/:id/unarchive
 */
export const unarchiveProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        error: "Project not found"
      });
    }

    const project = await prisma.project.update({
      where: { id },
      data: { archived: false }
    });

    res.json({
      success: true,
      data: project,
      error: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to unarchive project"
    });
  }
};

/**
 * Bulk archive projects
 * POST /projects/bulk-archive
 */
export const bulkArchiveProjects = async (req: Request, res: Response) => {
  try {
    const { projectIds } = req.body;

    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "projectIds must be a non-empty array"
      });
    }

    const result = await prisma.project.updateMany({
      where: { id: { in: projectIds } },
      data: { archived: true }
    });

    res.json({
      success: true,
      data: { 
        message: `Successfully archived ${result.count} projects`,
        count: result.count
      },
      error: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to bulk archive projects"
    });
  }
};

/**
 * Bulk unarchive projects
 * POST /projects/bulk-unarchive
 */
export const bulkUnarchiveProjects = async (req: Request, res: Response) => {
  try {
    const { projectIds } = req.body;

    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "projectIds must be a non-empty array"
      });
    }

    const result = await prisma.project.updateMany({
      where: { id: { in: projectIds } },
      data: { archived: false }
    });

    res.json({
      success: true,
      data: { 
        message: `Successfully unarchived ${result.count} projects`,
        count: result.count
      },
      error: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to bulk unarchive projects"
    });
  }
};

/**
 * Delete a project and all associated articles/quotes (only if archived)
 * DELETE /projects/:id
 */
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if project exists and is archived
    const existingProject = await prisma.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        error: "Project not found"
      });
    }

    if (!existingProject.archived) {
      return res.status(403).json({
        success: false,
        error: "Project must be archived before deletion"
      });
    }

    await prisma.project.delete({
      where: { id }
    });

    res.json({
      success: true,
      data: { message: "Project deleted successfully" },
      error: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete project"
    });
  }
};
