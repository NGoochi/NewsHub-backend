"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportSessionManager = void 0;
const client_1 = require("@prisma/client");
const newsapi_1 = require("./newsapi");
const db = new client_1.PrismaClient();
class ImportSessionManager {
    constructor() {
        this.newsapiClient = new newsapi_1.NewsAPIClient();
    }
    /**
     * Create a new import session and start the import process
     */
    async startImportSession(config) {
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
        }
        catch (error) {
            console.error('Failed to start import session:', error);
            throw new Error(`Failed to start import session: ${error.message}`);
        }
    }
    /**
     * Process the import session (fetch and save articles)
     */
    async processImportSession(sessionId, config) {
        try {
            console.log(`Starting import process for session ${sessionId}`);
            // Set custom article limit if provided
            if (config.articleLimit) {
                console.log(`Setting article limit to ${config.articleLimit}`);
                this.newsapiClient.setMaxTotalArticles(config.articleLimit);
            }
            // Build NewsAPI.ai request
            const request = this.newsapiClient.buildRequest({
                searchTerms: config.searchTerms,
                sources: config.sources,
                startDate: config.startDate,
                endDate: config.endDate,
                useBooleanQuery: config.useBooleanQuery,
                booleanQuery: config.booleanQuery
            });
            // Fetch articles from NewsAPI.ai
            console.log('Fetching articles from NewsAPI.ai...');
            const articles = await this.newsapiClient.fetchArticles(request);
            console.log(`Found ${articles.length} articles from NewsAPI.ai`);
            // Update session with articles found count
            await this.updateSessionArticlesFound(sessionId, articles.length);
            if (articles.length === 0) {
                console.log('No articles found, completing session');
                await this.updateSessionStatus(sessionId, 'completed');
                return;
            }
            // Format articles for database
            const formattedArticles = this.newsapiClient.formatArticlesForDatabase(articles);
            // Save articles to database
            console.log('Saving articles to database...');
            const savedArticles = await this.saveArticlesToDatabase(sessionId, config.projectId, formattedArticles);
            console.log(`Successfully imported ${savedArticles.length} articles`);
            // Update session with final counts
            await this.updateSessionArticlesImported(sessionId, savedArticles.length);
            await this.updateSessionStatus(sessionId, 'completed');
            console.log(`Import session ${sessionId} completed successfully`);
        }
        catch (error) {
            console.error(`Import session ${sessionId} failed:`, error);
            await this.updateSessionStatus(sessionId, 'failed', error.message);
            throw error;
        }
    }
    /**
     * Save articles to database with import session tracking
     */
    async saveArticlesToDatabase(sessionId, projectId, articles) {
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
            }
            catch (error) {
                console.error(`Failed to save article "${article.title}":`, error);
                // Continue with other articles even if one fails
            }
        }
        return savedArticles;
    }
    /**
     * Update session articles found count
     */
    async updateSessionArticlesFound(sessionId, count) {
        await db.importSession.update({
            where: { id: sessionId },
            data: { articlesFound: count }
        });
    }
    /**
     * Update session articles imported count
     */
    async updateSessionArticlesImported(sessionId, count) {
        await db.importSession.update({
            where: { id: sessionId },
            data: { articlesImported: count }
        });
    }
    /**
     * Update session status
     */
    async updateSessionStatus(sessionId, status, error) {
        const updateData = { status };
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
    async getSessionStatus(sessionId) {
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
    async getProjectImportSessions(projectId) {
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
    async cancelSession(sessionId) {
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
    async getProjectImportStats(projectId) {
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
exports.ImportSessionManager = ImportSessionManager;
