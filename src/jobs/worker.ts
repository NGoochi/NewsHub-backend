import { analyzeArticles } from "../lib/gemini";
import { 
  getNextBatch, 
  markJobsAsProcessing, 
  markJobsAsCompleted, 
  markJobsAsFailed 
} from "./queue";
import prisma from "../lib/db";

/**
 * Process a batch of analysis jobs
 * @param batchId Optional batch ID for tracking
 */
export const processBatch = async (batchId?: string): Promise<void> => {
  try {
    // Get next batch of jobs
    const jobs = await getNextBatch();
    
    if (jobs.length === 0) {
      console.log('No jobs to process');
      return;
    }

    const jobIds = jobs.map(job => job.id);
    const articleIds = jobs.map(job => job.articleId);

    console.log(`Processing batch of ${jobs.length} jobs: ${jobIds.join(', ')}`);

    // Mark jobs as processing
    await markJobsAsProcessing(jobIds, batchId);

    // Get full article data for analysis
    const articles = await prisma.article.findMany({
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

    // Filter articles with valid fullBodyText and transform for Gemini
    const validArticles = articles
      .filter(article => article.fullBodyText && article.fullBodyText.trim().length > 0)
      .map(article => ({
        id: article.id,
        title: article.title,
        fullBodyText: article.fullBodyText!,
        newsOutlet: article.newsOutlet || undefined,
        authors: article.authors || undefined
      }));

    if (validArticles.length === 0) {
      throw new Error('No articles with valid content found');
    }

    // Analyze articles with Gemini
    const analysisResults = await analyzeArticles(validArticles);

    // Update articles with analysis results
    for (const result of analysisResults.articles) {
      await prisma.article.update({
        where: { id: result.id },
        data: {
          summaryGemini: result.summary,
          categoryGemini: result.category,
          sentimentGemini: result.sentiment as 'positive' | 'neutral' | 'negative',
          translatedGemini: result.translated,
          analysedAt: new Date()
        }
      });

      // Create quotes if any
      if (result.quotes && result.quotes.length > 0) {
        await prisma.quote.createMany({
          data: result.quotes.map((quote: any) => ({
            articleId: result.id,
            stakeholderNameGemini: quote.stakeholderName,
            stakeholderAffiliationGemini: quote.stakeholderAffiliation,
            quoteGemini: quote.quote
          }))
        });
      }
    }

    // Mark jobs as completed
    await markJobsAsCompleted(jobIds);

    console.log(`Successfully processed batch: ${jobIds.join(', ')}`);
  } catch (error) {
    console.error('Batch processing failed:', error);
    
    // Mark jobs as failed
    const jobs = await getNextBatch();
    const jobIds = jobs.map(job => job.id);
    
    if (jobIds.length > 0) {
      await markJobsAsFailed(jobIds, error instanceof Error ? error.message : 'Unknown error');
    }
  }
};

/**
 * Start the worker process
 * @param intervalMs Processing interval in milliseconds (default: 30 seconds)
 */
export const startWorker = (intervalMs: number = 30000): void => {
  console.log(`Starting analysis worker with ${intervalMs}ms interval`);
  
  const processInterval = setInterval(async () => {
    try {
      await processBatch();
    } catch (error) {
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

/**
 * Process a single batch immediately (for testing)
 */
export const processSingleBatch = async (): Promise<void> => {
  await processBatch(`manual-${Date.now()}`);
};
