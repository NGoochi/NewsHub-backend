import db from './db';
import { analyzeArticles } from './gemini';
import { extractQuotes } from './gemini';

export interface AnalysisBatchRequest {
  projectId: string;
  articleIds: string[];
}

export interface AnalysisBatchResult {
  batchId: string;
  status: string;
  totalArticles: number;
  processedArticles: number;
  results?: any;
  error?: string;
}

export class AnalysisBatchService {
  /**
   * Create a new analysis batch
   */
  async createBatch(request: AnalysisBatchRequest): Promise<AnalysisBatchResult> {
    try {
      // Validate project exists
      const project = await db.project.findUnique({
        where: { id: request.projectId }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Validate articles exist and belong to project
      const articles = await db.article.findMany({
        where: {
          id: { in: request.articleIds },
          projectId: request.projectId
        }
      });

      if (articles.length !== request.articleIds.length) {
        throw new Error('Some articles not found or do not belong to project');
      }

      // Limit to configurable batch size (default 3 articles max)
      const batchSize = parseInt(process.env.GEMINI_BATCH_SIZE || '3');
      if (request.articleIds.length > batchSize) {
        throw new Error(`Maximum ${batchSize} articles allowed per batch`);
      }

      // Create batch record
      const batch = await db.analysisBatch.create({
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
    } catch (error: any) {
      console.error('Create analysis batch error:', error);
      throw new Error(error.message || 'Failed to create analysis batch');
    }
  }

  /**
   * Start processing an analysis batch
   */
  async startBatch(batchId: string): Promise<AnalysisBatchResult> {
    try {
      // Get batch details
      const batch = await db.analysisBatch.findUnique({
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
      await db.analysisBatch.update({
        where: { id: batchId },
        data: {
          status: 'running',
          startedAt: new Date()
        }
      });

      // Get articles for analysis
      const articles = await db.article.findMany({
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
          fullBodyText: article.fullBodyText!, // Asserting as non-null after filter
          newsOutlet: article.newsOutlet || undefined,
          authors: article.authors || undefined
        }));

      if (validArticles.length === 0) {
        throw new Error('No articles with valid content found');
      }

      // Process articles (batch size configurable via GEMINI_BATCH_SIZE environment variable)
      const results = {
        articleAnalysis: [],
        quoteExtraction: []
      };

      try {
        // Article analysis
        console.log(`Starting article analysis for batch ${batchId}`);
        const articleAnalysis = await analyzeArticles(validArticles);
        results.articleAnalysis = articleAnalysis;

        // Update articles with analysis results
        console.log(`📝 Updating ${articleAnalysis.articles?.length || 0} articles with analysis results`);
        
        for (const analysis of articleAnalysis.articles || []) {
          try {
            console.log(`🔄 Updating article ${analysis['1_id']} with analysis data`);
            
            const updatedArticle = await db.article.update({
              where: { id: analysis['1_id'] },
              data: {
                summaryGemini: analysis['7_summary'],
                categoryGemini: analysis['8_category'],
                sentimentGemini: analysis['9_sentiment'].toLowerCase(),
                translatedGemini: analysis['10_translated'],
                analysedAt: new Date()
              }
            });
            
            console.log(`✅ Successfully updated article ${analysis['1_id']}`);
          } catch (updateError: any) {
            console.error(`❌ Failed to update article ${analysis['1_id']}:`, updateError.message);
            // Continue with other articles instead of failing the entire batch
            // This ensures partial success rather than complete failure
          }
        }

        // Quote extraction
        console.log(`Starting quote extraction for batch ${batchId}`);
        const quoteExtraction = await extractQuotes(validArticles);
        results.quoteExtraction = quoteExtraction;

        // Store extracted quotes
        console.log(`💬 Storing ${quoteExtraction.quotes?.length || 0} extracted quotes`);
        
        for (const quote of quoteExtraction.quotes || []) {
          try {
            console.log(`🔄 Creating quote for article ${quote['1_articleId']}`);
            
            await db.quote.create({
              data: {
                articleId: quote['1_articleId'],
                stakeholderNameGemini: quote['2_stakeholderName'],
                stakeholderAffiliationGemini: quote['3_stakeholderAffiliation'],
                quoteGemini: quote['4_quote']
              }
            });
            
            console.log(`✅ Successfully created quote for article ${quote['1_articleId']}`);
          } catch (quoteError: any) {
            console.error(`❌ Failed to create quote for article ${quote['1_articleId']}:`, quoteError.message);
            // Continue with other quotes instead of failing the entire batch
          }
        }

        // Mark batch as completed
        await db.analysisBatch.update({
          where: { id: batchId },
          data: {
            status: 'completed',
            completedAt: new Date(),
            processedArticles: batch.totalArticles,
            results: results
          }
        });

        console.log(`🎉 Batch ${batchId} completed successfully!`);
        console.log(`📊 Processed ${batch.totalArticles} articles with analysis and quotes`);

        return {
          batchId,
          status: 'completed',
          totalArticles: batch.totalArticles,
          processedArticles: batch.totalArticles,
          results
        };

      } catch (analysisError: any) {
        console.error('Analysis processing error:', analysisError);
        
        // Mark batch as failed
        await db.analysisBatch.update({
          where: { id: batchId },
          data: {
            status: 'failed',
            completedAt: new Date(),
            error: analysisError.message || 'Unknown error'
          }
        });

        throw analysisError;
      }

    } catch (error: any) {
      console.error('Start analysis batch error:', error);
      throw new Error(error.message || 'Failed to start analysis batch');
    }
  }

  /**
   * Get batch status
   */
  async getBatchStatus(batchId: string): Promise<AnalysisBatchResult> {
    try {
      const batch = await db.analysisBatch.findUnique({
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
        error: batch.error || undefined
      };
    } catch (error: any) {
      console.error('Get batch status error:', error);
      throw new Error(error.message || 'Failed to get batch status');
    }
  }

  /**
   * Get all batches for a project
   */
  async getProjectBatches(projectId: string): Promise<AnalysisBatchResult[]> {
    try {
      const batches = await db.analysisBatch.findMany({
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
    } catch (error: any) {
      console.error('Get project batches error:', error);
      throw new Error(error.message || 'Failed to get project batches');
    }
  }

  /**
   * Cancel a running batch
   */
  async cancelBatch(batchId: string): Promise<AnalysisBatchResult> {
    try {
      const batch = await db.analysisBatch.findUnique({
        where: { id: batchId }
      });

      if (!batch) {
        throw new Error('Analysis batch not found');
      }

      if (batch.status === 'completed' || batch.status === 'failed') {
        throw new Error('Cannot cancel completed or failed batch');
      }

      await db.analysisBatch.update({
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
    } catch (error: any) {
      console.error('Cancel batch error:', error);
      throw new Error(error.message || 'Failed to cancel batch');
    }
  }
}
