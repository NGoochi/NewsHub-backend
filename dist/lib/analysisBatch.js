"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisBatchService = void 0;
const db_1 = __importDefault(require("./db"));
const gemini_1 = require("./gemini");
const gemini_2 = require("./gemini");
class AnalysisBatchService {
    /**
     * Create a new analysis batch
     */
    async createBatch(request) {
        try {
            // Validate project exists
            const project = await db_1.default.project.findUnique({
                where: { id: request.projectId }
            });
            if (!project) {
                throw new Error('Project not found');
            }
            // Validate articles exist and belong to project
            const articles = await db_1.default.article.findMany({
                where: {
                    id: { in: request.articleIds },
                    projectId: request.projectId
                }
            });
            if (articles.length !== request.articleIds.length) {
                throw new Error('Some articles not found or do not belong to project');
            }
            // Limit to 10 articles max
            if (request.articleIds.length > 10) {
                throw new Error('Maximum 10 articles allowed per batch');
            }
            // Create batch record
            const batch = await db_1.default.analysisBatch.create({
                data: {
                    projectId: request.projectId,
                    articleIds: request.articleIds,
                    totalArticles: request.articleIds.length,
                    status: 'pending'
                }
            });
            return {
                batchId: batch.id,
                status: batch.status,
                totalArticles: batch.totalArticles,
                processedArticles: batch.processedArticles
            };
        }
        catch (error) {
            console.error('Create analysis batch error:', error);
            throw new Error(error.message || 'Failed to create analysis batch');
        }
    }
    /**
     * Start processing an analysis batch
     */
    async startBatch(batchId) {
        try {
            // Get batch details
            const batch = await db_1.default.analysisBatch.findUnique({
                where: { id: batchId },
                include: { project: true }
            });
            if (!batch) {
                throw new Error('Analysis batch not found');
            }
            if (batch.status !== 'pending') {
                throw new Error(`Batch is not in pending status`);
            }
            // Update status to running
            await db_1.default.analysisBatch.update({
                where: { id: batchId },
                data: {
                    status: 'running',
                    startedAt: new Date()
                }
            });
            // Get articles for analysis
            const articles = await db_1.default.article.findMany({
                where: {
                    id: { in: batch.articleIds }
                }
            });
            // Filter articles with valid fullBodyText and transform for Gemini
            const validArticles = articles
                .filter(article => article.fullBodyText && article.fullBodyText.trim().length > 0)
                .map(article => ({
                id: article.id,
                title: article.title,
                fullBodyText: article.fullBodyText, // Asserting as non-null after filter
                newsOutlet: article.newsOutlet || undefined,
                authors: article.authors || undefined
            }));
            if (validArticles.length === 0) {
                throw new Error('No articles with valid content found');
            }
            // Process articles in batches of 10 (as per Gemini requirements)
            const results = {
                articleAnalysis: [],
                quoteExtraction: []
            };
            try {
                // Article analysis
                console.log(`Starting article analysis for batch ${batchId}`);
                const articleAnalysis = await (0, gemini_1.analyzeArticles)(validArticles);
                results.articleAnalysis = articleAnalysis;
                // Update articles with analysis results
                for (const analysis of articleAnalysis.articles || []) {
                    await db_1.default.article.update({
                        where: { id: analysis['1_id'] },
                        data: {
                            summaryGemini: analysis['7_summary'],
                            categoryGemini: analysis['8_category'],
                            sentimentGemini: analysis['9_sentiment'].toLowerCase(),
                            translatedGemini: analysis['10_translated'],
                            analysedAt: new Date()
                        }
                    });
                }
                // Quote extraction
                console.log(`Starting quote extraction for batch ${batchId}`);
                const quoteExtraction = await (0, gemini_2.extractQuotes)(validArticles);
                results.quoteExtraction = quoteExtraction;
                // Store extracted quotes
                for (const quote of quoteExtraction.quotes || []) {
                    await db_1.default.quote.create({
                        data: {
                            articleId: quote['1_articleId'],
                            stakeholderNameGemini: quote['2_stakeholderName'],
                            stakeholderAffiliationGemini: quote['3_stakeholderAffiliation'],
                            quoteGemini: quote['4_quote']
                        }
                    });
                }
                // Mark batch as completed
                await db_1.default.analysisBatch.update({
                    where: { id: batchId },
                    data: {
                        status: 'completed',
                        completedAt: new Date(),
                        processedArticles: batch.totalArticles,
                        results: results
                    }
                });
                return {
                    batchId,
                    status: 'completed',
                    totalArticles: batch.totalArticles,
                    processedArticles: batch.totalArticles,
                    results
                };
            }
            catch (analysisError) {
                console.error('Analysis processing error:', analysisError);
                // Mark batch as failed
                await db_1.default.analysisBatch.update({
                    where: { id: batchId },
                    data: {
                        status: 'failed',
                        completedAt: new Date(),
                        error: analysisError.message || 'Unknown error'
                    }
                });
                throw analysisError;
            }
        }
        catch (error) {
            console.error('Start analysis batch error:', error);
            throw new Error(error.message || 'Failed to start analysis batch');
        }
    }
    /**
     * Get batch status
     */
    async getBatchStatus(batchId) {
        try {
            const batch = await db_1.default.analysisBatch.findUnique({
                where: { id: batchId }
            });
            if (!batch) {
                throw new Error('Analysis batch not found');
            }
            return {
                batchId: batch.id,
                status: batch.status,
                totalArticles: batch.totalArticles,
                processedArticles: batch.processedArticles,
                results: batch.results,
                error: batch.error
            };
        }
        catch (error) {
            console.error('Get batch status error:', error);
            throw new Error(error.message || 'Failed to get batch status');
        }
    }
    /**
     * Get all batches for a project
     */
    async getProjectBatches(projectId) {
        try {
            const batches = await db_1.default.analysisBatch.findMany({
                where: { projectId },
                orderBy: { createdAt: 'desc' }
            });
            return batches.map(batch => ({
                batchId: batch.id,
                status: batch.status,
                totalArticles: batch.totalArticles,
                processedArticles: batch.processedArticles,
                results: batch.results,
                error: batch.error || undefined
            }));
        }
        catch (error) {
            console.error('Get project batches error:', error);
            throw new Error(error.message || 'Failed to get project batches');
        }
    }
    /**
     * Cancel a running batch
     */
    async cancelBatch(batchId) {
        try {
            const batch = await db_1.default.analysisBatch.findUnique({
                where: { id: batchId }
            });
            if (!batch) {
                throw new Error('Analysis batch not found');
            }
            if (batch.status === 'completed' || batch.status === 'failed') {
                throw new Error('Cannot cancel completed or failed batch');
            }
            await db_1.default.analysisBatch.update({
                where: { id: batchId },
                data: {
                    status: 'cancelled',
                    completedAt: new Date()
                }
            });
            return {
                batchId,
                status: 'cancelled',
                totalArticles: batch.totalArticles,
                processedArticles: batch.processedArticles
            };
        }
        catch (error) {
            console.error('Cancel batch error:', error);
            throw new Error(error.message || 'Failed to cancel batch');
        }
    }
}
exports.AnalysisBatchService = AnalysisBatchService;
