"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelAnalysisBatch = exports.getProjectAnalysisBatches = exports.getAnalysisBatchStatus = exports.startAnalysisBatch = exports.createAnalysisBatch = void 0;
const analysisBatch_1 = require("../lib/analysisBatch");
const validation_1 = require("../utils/validation");
const analysisBatchService = new analysisBatch_1.AnalysisBatchService();
/**
 * Create a new analysis batch
 * POST /analysis/batch
 */
const createAnalysisBatch = async (req, res) => {
    try {
        const { projectId, articleIds } = req.body;
        // Validate required fields
        const validation = (0, validation_1.validateRequiredFields)({ projectId, articleIds }, ['projectId', 'articleIds']);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: `Missing required fields: ${validation.missingFields.join(', ')}`
            });
        }
        // Validate project ID format
        if (!(0, validation_1.isValidUUID)(projectId)) {
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
            if (!(0, validation_1.isValidUUID)(articleId)) {
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
    }
    catch (error) {
        console.error('Create analysis batch error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create analysis batch'
        });
    }
};
exports.createAnalysisBatch = createAnalysisBatch;
/**
 * Start processing an analysis batch
 * POST /analysis/batch/:batchId/start
 */
const startAnalysisBatch = async (req, res) => {
    try {
        const { batchId } = req.params;
        if (!(0, validation_1.isValidUUID)(batchId)) {
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
    }
    catch (error) {
        console.error('Start analysis batch error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to start analysis batch'
        });
    }
};
exports.startAnalysisBatch = startAnalysisBatch;
/**
 * Get analysis batch status
 * GET /analysis/batch/:batchId
 */
const getAnalysisBatchStatus = async (req, res) => {
    try {
        const { batchId } = req.params;
        if (!(0, validation_1.isValidUUID)(batchId)) {
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
    }
    catch (error) {
        console.error('Get analysis batch status error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get analysis batch status'
        });
    }
};
exports.getAnalysisBatchStatus = getAnalysisBatchStatus;
/**
 * Get all analysis batches for a project
 * GET /analysis/project/:projectId/batches
 */
const getProjectAnalysisBatches = async (req, res) => {
    try {
        const { projectId } = req.params;
        if (!(0, validation_1.isValidUUID)(projectId)) {
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
    }
    catch (error) {
        console.error('Get project analysis batches error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to get project analysis batches'
        });
    }
};
exports.getProjectAnalysisBatches = getProjectAnalysisBatches;
/**
 * Cancel an analysis batch
 * POST /analysis/batch/:batchId/cancel
 */
const cancelAnalysisBatch = async (req, res) => {
    try {
        const { batchId } = req.params;
        if (!(0, validation_1.isValidUUID)(batchId)) {
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
    }
    catch (error) {
        console.error('Cancel analysis batch error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to cancel analysis batch'
        });
    }
};
exports.cancelAnalysisBatch = cancelAnalysisBatch;
