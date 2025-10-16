import { Request, Response } from "express";
import prisma from "../lib/db";
// import { importFromNewsAPI } from "../lib/newsapi";
import { validateArticleData, validateRequiredFields, isValidUUID } from "../utils/validation";

/**
 * Create a new article manually
 * POST /articles
 */
export const createArticle = async (req: Request, res: Response) => {
  try {
    const { projectId, title, newsOutlet, authors, url, fullBodyText, dateWritten, inputMethod } = req.body;

    // Validate required fields
    const requiredValidation = validateRequiredFields(req.body, ['projectId', 'title']);
    if (!requiredValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${requiredValidation.missingFields.join(', ')}`
      });
    }

    // Validate UUID format
    if (!isValidUUID(projectId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid project ID format"
      });
    }

    // Validate article data
    const validation = validateArticleData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join(', ')
      });
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found"
      });
    }

    const article = await prisma.article.create({
      data: {
        projectId,
        title,
        newsOutlet,
        authors: authors || [],
        url,
        fullBodyText,
        dateWritten: dateWritten ? new Date(dateWritten) : null,
        inputMethod: inputMethod || 'manual'
      },
      include: {
        project: true,
        quotes: true
      }
    });

    res.status(201).json({
      success: true,
      data: article,
      error: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to create article"
    });
  }
};

/**
 * Import articles from NewsAPI
 * POST /articles/import
 * NOTE: This function is deprecated - use /import/start instead
 */
export const importArticles = async (req: Request, res: Response) => {
  res.status(410).json({
    success: false,
    error: "This endpoint is deprecated. Please use /import/start instead."
  });
};

/**
 * Get all articles
 * GET /articles
 */
export const getAllArticles = async (req: Request, res: Response) => {
  try {
    const articles = await prisma.article.findMany({
      include: {
        project: true,
        quotes: true
      },
      orderBy: { dateWritten: 'desc' }
    });

    res.json({
      success: true,
      data: articles,
      error: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch articles"
    });
  }
};

/**
 * Get articles by project ID
 * GET /articles/project/:projectId
 */
export const getArticlesByProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    // First check if project exists and is not archived
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: "Project not found"
      });
    }

    if (project.archived) {
      return res.status(403).json({
        success: false,
        error: "Cannot access articles from archived project"
      });
    }

    const articles = await prisma.article.findMany({
      where: { projectId },
      include: {
        quotes: true
      },
      orderBy: { dateWritten: 'desc' }
    });

    res.json({
      success: true,
      data: articles,
      error: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch articles"
    });
  }
};

/**
 * Get a specific article by ID
 * GET /articles/:id
 */
export const getArticleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        project: true,
        quotes: true
      }
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        error: "Article not found"
      });
    }

    // Check if parent project is archived
    if (article.project.archived) {
      return res.status(403).json({
        success: false,
        error: "Cannot access article from archived project"
      });
    }

    res.json({
      success: true,
      data: article,
      error: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch article"
    });
  }
};

/**
 * Update an existing article
 * PUT /articles/:id
 */
export const updateArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const article = await prisma.article.update({
      where: { id },
      data: updateData,
      include: {
        project: true,
        quotes: true
      }
    });

    res.json({
      success: true,
      data: article,
      error: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update article"
    });
  }
};

/**
 * Delete an article and all associated quotes
 * DELETE /articles/:id
 */
export const deleteArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.article.delete({
      where: { id }
    });

    res.json({
      success: true,
      data: { message: "Article deleted successfully" },
      error: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete article"
    });
  }
};
