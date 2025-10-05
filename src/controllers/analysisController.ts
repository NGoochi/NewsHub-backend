import { Request, Response } from 'express';
import { AnalysisBatchService } from '../lib/analysisBatch';
import { validateRequiredFields, isValidUUID } from '../utils/validation';

const analysisBatchService = new AnalysisBatchService();

/**
 * Create a new analysis batch
 * POST /analysis/batch
 */
export const createAnalysisBatch = async (req: Request, res: Response) => {
  try {
    const { projectId, articleIds } = req.body;

    // Validate required fields
    const validation = validateRequiredFields({ projectId, articleIds }, ['projectId', 'articleIds']);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${validation.missingFields.join(', ')}`
      });
    }

    // Validate project ID format
    if (!isValidUUID(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID format'
      });
    }

    // Validate article IDs
    if (!Array.isArray(articleIds) || articleIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Article IDs must be a non-empty array'
      });
    }

    // Validate each article ID
    for (const articleId of articleIds) {
      if (!isValidUUID(articleId)) {
        return res.status(400).json({
          success: false,
          error: `Invalid article ID format: ${articleId}`
        });
      }
    }

    // Limit to 10 articles max
    if (articleIds.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 articles allowed per batch'
      });
    }

    const result = await analysisBatchService.createBatch({
      projectId,
      articleIds
    });

    res.json({
      success: true,
      data: result,
      error: null
    });
  } catch (error: any) {
    console.error('Create analysis batch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create analysis batch'
    });
  }
};

/**
 * Start processing an analysis batch
 * POST /analysis/batch/:batchId/start
 */
export const startAnalysisBatch = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;

    if (!isValidUUID(batchId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid batch ID format'
      });
    }

    const result = await analysisBatchService.startBatch(batchId);

    res.json({
      success: true,
      data: result,
      error: null
    });
  } catch (error: any) {
    console.error('Start analysis batch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start analysis batch'
    });
  }
};

/**
 * Get analysis batch status
 * GET /analysis/batch/:batchId
 */
export const getAnalysisBatchStatus = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;

    if (!isValidUUID(batchId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid batch ID format'
      });
    }

    const result = await analysisBatchService.getBatchStatus(batchId);

    res.json({
      success: true,
      data: result,
      error: null
    });
  } catch (error: any) {
    console.error('Get analysis batch status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get analysis batch status'
    });
  }
};

/**
 * Get all analysis batches for a project
 * GET /analysis/project/:projectId/batches
 */
export const getProjectAnalysisBatches = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    if (!isValidUUID(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID format'
      });
    }

    const result = await analysisBatchService.getProjectBatches(projectId);

    res.json({
      success: true,
      data: result,
      error: null
    });
  } catch (error: any) {
    console.error('Get project analysis batches error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get project analysis batches'
    });
  }
};

/**
 * Cancel an analysis batch
 * POST /analysis/batch/:batchId/cancel
 */
export const cancelAnalysisBatch = async (req: Request, res: Response) => {
  try {
    const { batchId } = req.params;

    if (!isValidUUID(batchId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid batch ID format'
      });
    }

    const result = await analysisBatchService.cancelBatch(batchId);

    res.json({
      success: true,
      data: result,
      error: null
    });
  } catch (error: any) {
    console.error('Cancel analysis batch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel analysis batch'
    });
  }
};