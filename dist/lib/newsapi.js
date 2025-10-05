"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsAPIClient = void 0;
const axios_1 = __importDefault(require("axios"));
// NewsAPI.ai configuration
const NEWSAPI_BASE_URL = 'https://eventregistry.org/api/v1/article/getArticles';
class NewsAPIClient {
    constructor() {
        this.apiUrl = NEWSAPI_BASE_URL;
        // Configuration from environment variables
        this.articlesPerPage = parseInt(process.env.NEWSAPI_ARTICLES_PER_PAGE || '100');
        this.requestDelayMs = parseInt(process.env.NEWSAPI_REQUEST_DELAY_MS || '1000');
        this.maxRetries = parseInt(process.env.NEWSAPI_MAX_RETRIES || '3');
        this.timeoutMs = parseInt(process.env.NEWSAPI_TIMEOUT_MS || '30000');
    }
    /**
     * Fetch articles from NewsAPI.ai with pagination
     */
    async fetchArticles(requestBody) {
        const allArticles = [];
        let currentPage = 1;
        let hasMorePages = true;
        while (hasMorePages) {
            const request = {
                ...requestBody,
                articlesPage: currentPage,
                articlesCount: this.articlesPerPage,
                apiKey: process.env.NEWSAPI_API_KEY || ''
            };
            console.log(`Fetching page ${currentPage}...`);
            try {
                const response = await axios_1.default.post(this.apiUrl, request, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    timeout: this.timeoutMs
                });
                const data = response.data;
                const articles = data.articles?.results || [];
                allArticles.push(...articles);
                console.log(`Fetched ${articles.length} articles from page ${currentPage}`);
                console.log(`Total articles so far: ${allArticles.length}`);
                // Check if there are more pages
                hasMorePages = articles.length === this.articlesPerPage &&
                    allArticles.length < (data.articles?.totalResults || 0);
                if (hasMorePages) {
                    currentPage++;
                    // Small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, this.requestDelayMs));
                }
            }
            catch (error) {
                console.error(`Error fetching page ${currentPage}:`, error);
                throw error;
            }
        }
        return allArticles;
    }
    /**
     * Build a request body for NewsAPI.ai
     */
    buildRequest(params) {
        const { searchTerms, sources, startDate, endDate, useBooleanQuery, booleanQuery } = params;
        const query = {
            $query: {
                $and: []
            }
        };
        // Add search terms
        if (useBooleanQuery && booleanQuery) {
            // Parse boolean query and convert to NewsAPI.ai format
            const parsedQuery = this.parseBooleanQuery(booleanQuery);
            if (parsedQuery) {
                query.$query.$and.push(parsedQuery);
            }
        }
        else {
            // Simple OR logic for multiple terms
            if (searchTerms.length === 1) {
                query.$query.$and.push({
                    keyword: searchTerms[0],
                    keywordLoc: "body"
                });
            }
            else if (searchTerms.length > 1) {
                const termConditions = searchTerms.map(term => ({
                    keyword: term,
                    keywordLoc: "body"
                }));
                query.$query.$and.push({
                    $or: termConditions
                });
            }
        }
        // Add sources filter
        if (sources.length > 0) {
            console.log('NewsAPI: Filtering by sources:', sources);
            const sourceConditions = sources.map(source => ({
                sourceUri: source
            }));
            query.$query.$and.push({
                $or: sourceConditions
            });
        }
        else {
            console.log('NewsAPI: No source filtering applied');
        }
        // Add date range
        query.$query.$and.push({
            dateStart: startDate,
            dateEnd: endDate
        });
        return {
            query,
            $filter: {
                dataType: ["news", "blog"]
            },
            resultType: "articles",
            articlesSortBy: "date",
            apiKey: process.env.NEWSAPI_API_KEY || ''
        };
    }
    /**
     * Format articles for database insertion
     */
    formatArticlesForDatabase(articles) {
        return articles.map(article => ({
            // Map NewsAPI.ai fields to our database schema
            title: article.title || 'No Title',
            newsOutlet: article.source?.title || 'Unknown Source',
            authors: this.extractAuthors(article),
            url: article.url || null,
            fullBodyText: article.body || '',
            dateWritten: article.dateTime ? new Date(article.dateTime) : null,
            inputMethod: 'newsapi',
            // NewsAPI.ai specific fields
            sourceUri: article.source?.uri || null,
            concepts: article.concepts || null,
            categories: article.categories || null,
            sentiment: article.sentiment || null,
            imageUrl: article.image || null,
            location: article.location || null
        }));
    }
    /**
     * Parse boolean query string into NewsAPI.ai format
     */
    parseBooleanQuery(queryString) {
        try {
            // Simple boolean query parser
            // This is a basic implementation - in production you'd want a more robust parser
            // Remove quotes and clean up the query
            const cleanQuery = queryString.replace(/"/g, '').trim();
            // For now, we'll use a simple approach:
            // Split by AND/OR and create appropriate conditions
            if (cleanQuery.includes(' AND ')) {
                const andTerms = cleanQuery.split(' AND ').map(term => term.trim());
                if (andTerms.length > 1) {
                    return {
                        $and: andTerms.map(term => ({
                            keyword: term,
                            keywordLoc: "body"
                        }))
                    };
                }
            }
            else if (cleanQuery.includes(' OR ')) {
                const orTerms = cleanQuery.split(' OR ').map(term => term.trim());
                if (orTerms.length > 1) {
                    return {
                        $or: orTerms.map(term => ({
                            keyword: term,
                            keywordLoc: "body"
                        }))
                    };
                }
            }
            // If no operators found, treat as single term
            return {
                keyword: cleanQuery,
                keywordLoc: "body"
            };
        }
        catch (error) {
            console.error('Error parsing boolean query:', error);
            // Fallback to simple keyword search
            return {
                keyword: queryString,
                keywordLoc: "body"
            };
        }
    }
    /**
     * Extract authors from article data
     */
    extractAuthors(article) {
        if (article.authors && Array.isArray(article.authors) && article.authors.length > 0) {
            const authorNames = article.authors
                .map(author => author.name || author.uri || 'Unknown Author')
                .filter(name => name && name.trim().length > 0);
            return authorNames.length > 0 ? authorNames : ['No Author Available'];
        }
        return ['No Author Available'];
    }
    /**
     * Test NewsAPI.ai connection
     */
    async testConnection() {
        try {
            const testRequest = this.buildRequest({
                searchTerms: ['test'],
                sources: [],
                startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
                endDate: new Date().toISOString().split('T')[0] // today
            });
            const articles = await this.fetchArticles(testRequest);
            return true;
        }
        catch (error) {
            console.error('NewsAPI.ai connection test failed:', error);
            return false;
        }
    }
}
exports.NewsAPIClient = NewsAPIClient;
