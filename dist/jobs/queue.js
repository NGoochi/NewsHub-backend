"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCompletedJobs = exports.getQueueStatus = exports.markJobsAsFailed = exports.markJobsAsCompleted = exports.markJobsAsProcessing = exports.getNextBatch = exports.addToQueue = void 0;
const db_1 = __importDefault(require("../lib/db"));
/**
 * Add articles to the analysis queue
 * @param articleIds Array of article IDs to analyze
 * @param projectId Project ID for tracking
 * @returns Array of job IDs
 */
const addToQueue = async (articleIds, projectId) => {
    try {
        const jobs = await Promise.all(articleIds.map(articleId => db_1.default.analysisJob.create({
            data: {
                articleId,
                projectId,
                status: 'queued'
            }
        })));
        return jobs.map(job => job.id);
    }
    catch (error) {
        throw new Error(`Failed to add jobs to queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.addToQueue = addToQueue;
/**
 * Get next batch of jobs to process (max 10)
 * @returns Array of jobs ready for processing
 */
const getNextBatch = async () => {
    try {
        const jobs = await db_1.default.analysisJob.findMany({
            where: { status: 'queued' },
            take: 10,
            orderBy: { createdAt: 'asc' }
        });
        return jobs.map(job => ({
            id: job.id,
            articleId: job.articleId,
            projectId: job.projectId,
            status: job.status,
            createdAt: job.createdAt,
            startedAt: job.startedAt || undefined,
            completedAt: job.completedAt || undefined,
            error: job.error || undefined,
            batchId: job.batchId || undefined
        }));
    }
    catch (error) {
        throw new Error(`Failed to get next batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.getNextBatch = getNextBatch;
/**
 * Mark jobs as processing
 * @param jobIds Array of job IDs to mark as processing
 * @param batchId Optional batch ID for grouping
 */
const markJobsAsProcessing = async (jobIds, batchId) => {
    try {
        await db_1.default.analysisJob.updateMany({
            where: { id: { in: jobIds } },
            data: {
                status: 'processing',
                startedAt: new Date(),
                batchId
            }
        });
    }
    catch (error) {
        throw new Error(`Failed to mark jobs as processing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.markJobsAsProcessing = markJobsAsProcessing;
/**
 * Mark jobs as completed
 * @param jobIds Array of job IDs to mark as completed
 */
const markJobsAsCompleted = async (jobIds) => {
    try {
        await db_1.default.analysisJob.updateMany({
            where: { id: { in: jobIds } },
            data: {
                status: 'completed',
                completedAt: new Date()
            }
        });
    }
    catch (error) {
        throw new Error(`Failed to mark jobs as completed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.markJobsAsCompleted = markJobsAsCompleted;
/**
 * Mark jobs as failed
 * @param jobIds Array of job IDs to mark as failed
 * @param error Error message
 */
const markJobsAsFailed = async (jobIds, error) => {
    try {
        await db_1.default.analysisJob.updateMany({
            where: { id: { in: jobIds } },
            data: {
                status: 'failed',
                completedAt: new Date(),
                error
            }
        });
    }
    catch (error) {
        throw new Error(`Failed to mark jobs as failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.markJobsAsFailed = markJobsAsFailed;
/**
 * Get queue status for a project
 * @param projectId Project ID
 * @returns Queue status summary
 */
const getQueueStatus = async (projectId) => {
    try {
        const status = await db_1.default.analysisJob.groupBy({
            by: ['status'],
            where: { projectId },
            _count: { status: true }
        });
        const statusMap = status.reduce((acc, item) => {
            acc[item.status] = item._count.status;
            return acc;
        }, {});
        return {
            queued: statusMap.queued || 0,
            processing: statusMap.processing || 0,
            completed: statusMap.completed || 0,
            failed: statusMap.failed || 0,
            total: Object.values(statusMap).reduce((sum, count) => sum + count, 0)
        };
    }
    catch (error) {
        throw new Error(`Failed to get queue status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.getQueueStatus = getQueueStatus;
/**
 * Clear completed jobs for a project
 * @param projectId Project ID
 */
const clearCompletedJobs = async (projectId) => {
    try {
        await db_1.default.analysisJob.deleteMany({
            where: {
                projectId,
                status: 'completed'
            }
        });
    }
    catch (error) {
        throw new Error(`Failed to clear completed jobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
exports.clearCompletedJobs = clearCompletedJobs;
