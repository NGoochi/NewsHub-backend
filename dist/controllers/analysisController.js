"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalysisProgress = exports.getAnalysisStatus = exports.runAnalysis = void 0;
const db_1 = __importDefault(require("../lib/db"));
const queue_1 = require("../jobs/queue");
/**
 * Start Gemini analysis for selected articles
 * POST /analysis/run
 */
const runAnalysis = async (req, res) => {
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
        const articles = await db_1.default.article.findMany({
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
        const jobIds = await (0, queue_1.addToQueue)(articleIds, projectId);
        res.status(202).json({
            success: true,
            data: {
                message: "Analysis started",
                jobIds,
                articleCount: articleIds.length
            },
            error: null
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to start analysis"
        });
    }
};
exports.runAnalysis = runAnalysis;
/**
 * Get analysis status for a project
 * GET /analysis/status/:projectId
 */
const getAnalysisStatus = async (req, res) => {
    try {
        const { projectId } = req.params;
        const status = await (0, queue_1.getQueueStatus)(projectId);
        res.json({
            success: true,
            data: status,
            error: null
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to get analysis status"
        });
    }
};
exports.getAnalysisStatus = getAnalysisStatus;
/**
 * Get detailed progress of analysis jobs
 * GET /analysis/progress/:projectId
 */
const getAnalysisProgress = async (req, res) => {
    try {
        const { projectId } = req.params;
        // Get all articles for the project with their analysis status
        const articles = await db_1.default.article.findMany({
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to get analysis progress"
        });
    }
};
exports.getAnalysisProgress = getAnalysisProgress;
