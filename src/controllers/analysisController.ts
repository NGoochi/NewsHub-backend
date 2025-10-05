import { Request, Response } from "express";
import prisma from "../lib/db";
import { addToQueue, getQueueStatus } from "../jobs/queue";

/**
 * Start Gemini analysis for selected articles
 * POST /analysis/run
 */
export const runAnalysis = async (req: Request, res: Response) => {
  try {
    const { articleIds, projectId } = req.body;

    if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Article IDs array is required"
      });
    }

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: "Project ID is required"
      });
    }

    // Verify articles exist and belong to the project
    const articles = await prisma.article.findMany({
      where: {
        id: { in: articleIds },
        projectId
      }
    });

    if (articles.length !== articleIds.length) {
      return res.status(400).json({
        success: false,
        error: "Some articles not found or don't belong to the project"
      });
    }

    // Add articles to analysis queue
    const jobIds = await addToQueue(articleIds, projectId);

    res.status(202).json({
      success: true,
      data: {
        message: "Analysis started",
        jobIds,
        articleCount: articleIds.length
      },
      error: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to start analysis"
    });
  }
};

/**
 * Get analysis status for a project
 * GET /analysis/status/:projectId
 */
export const getAnalysisStatus = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const status = await getQueueStatus(projectId);

    res.json({
      success: true,
      data: status,
      error: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get analysis status"
    });
  }
};

/**
 * Get detailed progress of analysis jobs
 * GET /analysis/progress/:projectId
 */
export const getAnalysisProgress = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    // Get all articles for the project with their analysis status
    const articles = await prisma.article.findMany({
      where: { projectId },
      select: {
        id: true,
        title: true,
        analysedAt: true,
        summaryGemini: true,
        categoryGemini: true,
        sentimentGemini: true
      }
    });

    const totalArticles = articles.length;
    const analysedArticles = articles.filter(article => article.analysedAt !== null).length;
    const pendingArticles = totalArticles - analysedArticles;

    res.json({
      success: true,
      data: {
        totalArticles,
        analysedArticles,
        pendingArticles,
        progress: totalArticles > 0 ? (analysedArticles / totalArticles) * 100 : 0,
        articles
      },
      error: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get analysis progress"
    });
  }
};
