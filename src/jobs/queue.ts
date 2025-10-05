import prisma from "../lib/db";

export interface AnalysisJob {
  id: string;
  articleId: string;
  projectId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  batchId?: string;
}

/**
 * Add articles to the analysis queue
 * @param articleIds Array of article IDs to analyze
 * @param projectId Project ID for tracking
 * @returns Array of job IDs
 */
export const addToQueue = async (articleIds: string[], projectId: string): Promise<string[]> => {
  try {
    const jobs = await Promise.all(
      articleIds.map(articleId => 
        prisma.analysisJob.create({
          data: {
            articleId,
            projectId,
            status: 'queued'
          }
        })
      )
    );

    return jobs.map(job => job.id);
  } catch (error) {
    throw new Error(`Failed to add jobs to queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get next batch of jobs to process (max 10)
 * @returns Array of jobs ready for processing
 */
export const getNextBatch = async (): Promise<AnalysisJob[]> => {
  try {
    const jobs = await prisma.analysisJob.findMany({
      where: { status: 'queued' },
      take: 10,
      orderBy: { createdAt: 'asc' }
    });

    return jobs.map(job => ({
      id: job.id,
      articleId: job.articleId,
      projectId: job.projectId,
      status: job.status as 'queued' | 'processing' | 'completed' | 'failed',
      createdAt: job.createdAt,
      startedAt: job.startedAt || undefined,
      completedAt: job.completedAt || undefined,
      error: job.error || undefined,
      batchId: job.batchId || undefined
    }));
  } catch (error) {
    throw new Error(`Failed to get next batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Mark jobs as processing
 * @param jobIds Array of job IDs to mark as processing
 * @param batchId Optional batch ID for grouping
 */
export const markJobsAsProcessing = async (jobIds: string[], batchId?: string): Promise<void> => {
  try {
    await prisma.analysisJob.updateMany({
      where: { id: { in: jobIds } },
      data: {
        status: 'processing',
        startedAt: new Date(),
        batchId
      }
    });
  } catch (error) {
    throw new Error(`Failed to mark jobs as processing: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Mark jobs as completed
 * @param jobIds Array of job IDs to mark as completed
 */
export const markJobsAsCompleted = async (jobIds: string[]): Promise<void> => {
  try {
    await prisma.analysisJob.updateMany({
      where: { id: { in: jobIds } },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    });
  } catch (error) {
    throw new Error(`Failed to mark jobs as completed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Mark jobs as failed
 * @param jobIds Array of job IDs to mark as failed
 * @param error Error message
 */
export const markJobsAsFailed = async (jobIds: string[], error: string): Promise<void> => {
  try {
    await prisma.analysisJob.updateMany({
      where: { id: { in: jobIds } },
      data: {
        status: 'failed',
        completedAt: new Date(),
        error
      }
    });
  } catch (error) {
    throw new Error(`Failed to mark jobs as failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Get queue status for a project
 * @param projectId Project ID
 * @returns Queue status summary
 */
export const getQueueStatus = async (projectId: string) => {
  try {
    const status = await prisma.analysisJob.groupBy({
      by: ['status'],
      where: { projectId },
      _count: { status: true }
    });

    const statusMap = status.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    return {
      queued: statusMap.queued || 0,
      processing: statusMap.processing || 0,
      completed: statusMap.completed || 0,
      failed: statusMap.failed || 0,
      total: Object.values(statusMap).reduce((sum, count) => sum + count, 0)
    };
  } catch (error) {
    throw new Error(`Failed to get queue status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Clear completed jobs for a project
 * @param projectId Project ID
 */
export const clearCompletedJobs = async (projectId: string): Promise<void> => {
  try {
    await prisma.analysisJob.deleteMany({
      where: {
        projectId,
        status: 'completed'
      }
    });
  } catch (error) {
    throw new Error(`Failed to clear completed jobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
