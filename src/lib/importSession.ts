import { PrismaClient } from '@prisma/client';
import { NewsAPIClient, NewsAPIArticle } from './newsapi';

const db = new PrismaClient();

export interface ImportSessionConfig {
  projectId: string;
  searchTerms: string[];
  sources: string[];
  startDate: string;
  endDate: string;
  useBooleanQuery?: boolean;
  booleanQuery?: string;
  articleLimit?: number;
}

export interface ImportSessionResult {
  sessionId: string;
  articlesFound: number;
  articlesImported: number;
  status: 'running' | 'completed' | 'failed';
  error?: string;
}

export class ImportSessionManager {
  constructor() {
    // NewsAPIClient will be created fresh for each import session
  }

  /**
   * Create a new import session and start the import process
   */
  async startImportSession(config: ImportSessionConfig): Promise<ImportSessionResult> {
    try {
      // Validate project exists
      const project = await db.project.findUnique({
        where: { id: config.projectId }
      });

      if (!project) {
        throw new Error(`Project with ID ${config.projectId} not found`);
      }

      // Create import session record
      const session = await db.importSession.create({
        data: {
          projectId: config.projectId,
          searchTerms: config.searchTerms,
          sources: config.sources,
          startDate: new Date(config.startDate),
          endDate: new Date(config.endDate),
          articlesFound: 0,
          articlesImported: 0,
          status: 'running'
        }
      });

      console.log(`Created import session ${session.id} for project ${config.projectId}`);

      // Start the import process asynchronously
      this.processImportSession(session.id, config).catch(error => {
        console.error(`Import session ${session.id} failed:`, error);
        this.updateSessionStatus(session.id, 'failed', error.message);
      });

      return {
        sessionId: session.id,
        articlesFound: 0,
        articlesImported: 0,
        status: 'running'
      };

    } catch (error: any) {
      console.error('Failed to start import session:', error);
      throw new Error(`Failed to start import session: ${error.message}`);
    }
  }

  /**
   * Process the import session (fetch and save articles)
   */
  private async processImportSession(sessionId: string, config: ImportSessionConfig): Promise<void> {
    try {
      console.log(`Starting import process for session ${sessionId}`);
      console.log('ImportSessionConfig:', {
        projectId: config.projectId,
        searchTerms: config.searchTerms,
        articleLimit: config.articleLimit,
        articleLimitType: typeof config.articleLimit
      });

      // Create a fresh NewsAPIClient instance for this import session
      const newsapiClient = new NewsAPIClient();

      // Set custom article limit if provided
      if (config.articleLimit !== undefined && config.articleLimit !== null) {
        console.log(`[ImportSession] Setting article limit:`, {
          value: config.articleLimit,
          type: typeof config.articleLimit,
          isNumber: typeof config.articleLimit === 'number'
        });
        
        // Ensure it's a number
        const numericLimit = typeof config.articleLimit === 'string' 
          ? parseInt(config.articleLimit, 10) 
          : config.articleLimit;
        
        if (!isNaN(numericLimit) && numericLimit > 0) {
          newsapiClient.setMaxTotalArticles(numericLimit);
          console.log(`✓ Article limit set to ${numericLimit}`);
        } else {
          console.warn(`✗ Could not parse article limit: ${config.articleLimit}`);
        }
      } else {
        console.log('[ImportSession] No article limit provided, using default 100');
      }

      // Build NewsAPI.ai request
      const request = newsapiClient.buildRequest({
        searchTerms: config.searchTerms,
        sources: config.sources,
        startDate: config.startDate,
        endDate: config.endDate,
        useBooleanQuery: config.useBooleanQuery,
        booleanQuery: config.booleanQuery
      });

      // Fetch articles from NewsAPI.ai
      console.log('Fetching articles from NewsAPI.ai...');
      const articles = await newsapiClient.fetchArticles(request);
      
      console.log(`Found ${articles.length} articles from NewsAPI.ai`);

      // Update session with articles found count
      await this.updateSessionArticlesFound(sessionId, articles.length);

      if (articles.length === 0) {
        console.log('No articles found, completing session');
        await this.updateSessionStatus(sessionId, 'completed');
        return;
      }

      // Format articles for database
      const formattedArticles = newsapiClient.formatArticlesForDatabase(articles);

      // Save articles to database
      console.log('Saving articles to database...');
      const savedArticles = await this.saveArticlesToDatabase(sessionId, config.projectId, formattedArticles);

      console.log(`Successfully imported ${savedArticles.length} articles`);

      // Update session with final counts
      await this.updateSessionArticlesImported(sessionId, savedArticles.length);
      await this.updateSessionStatus(sessionId, 'completed');

      console.log(`Import session ${sessionId} completed successfully`);

    } catch (error: any) {
      console.error(`Import session ${sessionId} failed:`, error);
      await this.updateSessionStatus(sessionId, 'failed', error.message);
      throw error;
    }
  }

  /**
   * Save articles to database with import session tracking
   */
  private async saveArticlesToDatabase(
    sessionId: string, 
    projectId: string, 
    articles: any[]
  ): Promise<any[]> {
    const savedArticles = [];

    for (const article of articles) {
      try {
        // Check if article already exists (by URL or title)
        const existingArticle = await db.article.findFirst({
          where: {
            projectId: projectId,
            OR: [
              { url: article.url },
              { title: article.title }
            ]
          }
        });

        if (existingArticle) {
          console.log(`Article already exists: ${article.title}`);
          continue;
        }

        // Create new article with import session reference
        const savedArticle = await db.article.create({
          data: {
            ...article,
            projectId: projectId,
            importSessionId: sessionId
          }
        });

        savedArticles.push(savedArticle);
        console.log(`Saved article: ${savedArticle.title}`);

      } catch (error: any) {
        console.error(`Failed to save article "${article.title}":`, error);
        // Continue with other articles even if one fails
      }
    }

    return savedArticles;
  }

  /**
   * Update session articles found count
   */
  private async updateSessionArticlesFound(sessionId: string, count: number): Promise<void> {
    await db.importSession.update({
      where: { id: sessionId },
      data: { articlesFound: count }
    });
  }

  /**
   * Update session articles imported count
   */
  private async updateSessionArticlesImported(sessionId: string, count: number): Promise<void> {
    await db.importSession.update({
      where: { id: sessionId },
      data: { articlesImported: count }
    });
  }

  /**
   * Update session status
   */
  private async updateSessionStatus(
    sessionId: string, 
    status: 'running' | 'completed' | 'failed', 
    error?: string
  ): Promise<void> {
    const updateData: any = { status };
    
    if (status === 'completed' || status === 'failed') {
      updateData.completedAt = new Date();
    }

    await db.importSession.update({
      where: { id: sessionId },
      data: updateData
    });
  }

  /**
   * Get import session status
   */
  async getSessionStatus(sessionId: string): Promise<any> {
    const session = await db.importSession.findUnique({
      where: { id: sessionId },
      include: {
        project: {
          select: { name: true }
        },
        articles: {
          select: {
            id: true,
            title: true,
            newsOutlet: true,
            dateWritten: true
          }
        }
      }
    });

    if (!session) {
      throw new Error(`Import session ${sessionId} not found`);
    }

    return session;
  }

  /**
   * Get all import sessions for a project
   */
  async getProjectImportSessions(projectId: string): Promise<any[]> {
    return await db.importSession.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        articles: {
          select: {
            id: true,
            title: true,
            newsOutlet: true,
            dateWritten: true
          }
        }
      }
    });
  }

  /**
   * Cancel a running import session
   */
  async cancelSession(sessionId: string): Promise<void> {
    const session = await db.importSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      throw new Error(`Import session ${sessionId} not found`);
    }

    if (session.status !== 'running') {
      throw new Error(`Cannot cancel session ${sessionId} - status is ${session.status}`);
    }

    await this.updateSessionStatus(sessionId, 'failed', 'Cancelled by user');
  }

  /**
   * Get import statistics for a project
   */
  async getProjectImportStats(projectId: string): Promise<any> {
    const sessions = await db.importSession.findMany({
      where: { projectId },
      select: {
        status: true,
        articlesFound: true,
        articlesImported: true,
        createdAt: true,
        completedAt: true
      }
    });

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const runningSessions = sessions.filter(s => s.status === 'running').length;
    const failedSessions = sessions.filter(s => s.status === 'failed').length;
    
    const totalArticlesFound = sessions.reduce((sum, s) => sum + s.articlesFound, 0);
    const totalArticlesImported = sessions.reduce((sum, s) => sum + s.articlesImported, 0);

    return {
      totalSessions,
      completedSessions,
      runningSessions,
      failedSessions,
      totalArticlesFound,
      totalArticlesImported,
      successRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0
    };
  }
}
