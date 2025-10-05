"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processSingleBatch = exports.startWorker = exports.processBatch = void 0;
const gemini_1 = require("../lib/gemini");
const queue_1 = require("./queue");
const db_1 = __importDefault(require("../lib/db"));
/**
 * Process a batch of analysis jobs
 * @param batchId Optional batch ID for tracking
 */
const processBatch = async (batchId) => {
    try {
        // Get next batch of jobs
        const jobs = await (0, queue_1.getNextBatch)();
        if (jobs.length === 0) {
            console.log('No jobs to process');
            return;
        }
        const jobIds = jobs.map(job => job.id);
        const articleIds = jobs.map(job => job.articleId);
        console.log(`Processing batch of ${jobs.length} jobs: ${jobIds.join(', ')}`);
        // Mark jobs as processing
        await (0, queue_1.markJobsAsProcessing)(jobIds, batchId);
        // Get full article data for analysis
        const articles = await db_1.default.article.findMany({
            where: { id: { in: articleIds } },
            select: {
                id: true,
                title: true,
                fullBodyText: true,
                newsOutlet: true,
                authors: true
            }
        });
        if (articles.length !== articleIds.length) {
            throw new Error('Some articles not found');
        }
        // Analyze articles with Gemini
        const analysisResults = await (0, gemini_1.analyzeArticles)(articles);
        // Update articles with analysis results
        for (const result of analysisResults.articles) {
            await db_1.default.article.update({
                where: { id: result.id },
                data: {
                    summaryGemini: result.summary,
                    categoryGemini: result.category,
                    sentimentGemini: result.sentiment,
                    translatedGemini: result.translated,
                    analysedAt: new Date()
                }
            });
            // Create quotes if any
            if (result.quotes && result.quotes.length > 0) {
                await db_1.default.quote.createMany({
                    data: result.quotes.map(quote => ({
                        articleId: result.id,
                        stakeholderNameGemini: quote.stakeholderName,
                        stakeholderAffiliationGemini: quote.stakeholderAffiliation,
                        quoteGemini: quote.quote
                    }))
                });
            }
        }
        // Mark jobs as completed
        await (0, queue_1.markJobsAsCompleted)(jobIds);
        console.log(`Successfully processed batch: ${jobIds.join(', ')}`);
    }
    catch (error) {
        console.error('Batch processing failed:', error);
        // Mark jobs as failed
        const jobs = await (0, queue_1.getNextBatch)();
        const jobIds = jobs.map(job => job.id);
        if (jobIds.length > 0) {
            await (0, queue_1.markJobsAsFailed)(jobIds, error instanceof Error ? error.message : 'Unknown error');
        }
    }
};
exports.processBatch = processBatch;
/**
 * Start the worker process
 * @param intervalMs Processing interval in milliseconds (default: 30 seconds)
 */
const startWorker = (intervalMs = 30000) => {
    console.log(`Starting analysis worker with ${intervalMs}ms interval`);
    const processInterval = setInterval(async () => {
        try {
            await (0, exports.processBatch)();
        }
        catch (error) {
            console.error('Worker error:', error);
        }
    }, intervalMs);
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('Stopping worker...');
        clearInterval(processInterval);
        process.exit(0);
    });
    process.on('SIGTERM', () => {
        console.log('Stopping worker...');
        clearInterval(processInterval);
        process.exit(0);
    });
};
exports.startWorker = startWorker;
/**
 * Process a single batch immediately (for testing)
 */
const processSingleBatch = async () => {
    await (0, exports.processBatch)(`manual-${Date.now()}`);
};
exports.processSingleBatch = processSingleBatch;
