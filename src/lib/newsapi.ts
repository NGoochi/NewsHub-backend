import axios from 'axios';

// NewsAPI.ai configuration
const NEWSAPI_BASE_URL = 'https://eventregistry.org/api/v1/article/getArticles';

export interface NewsAPIArticle {
  uri: string;
  lang: string;
  isDuplicate: boolean;
  date: string;
  time: string;
  dateTime: string;
  dateTimePub: string;
  dataType: string;
  sim: number;
  url: string;
  title: string;
  body: string;
  source: {
    uri: string;
    dataType: string;
    title: string;
    description?: string;
    location?: {
      type: string;
      label: {
        eng: string;
      };
    };
    locationValidated?: boolean;
    ranking?: {
      importanceRank: number;
    };
  };
  authors: any[];
  concepts?: Array<{
    uri: string;
    type: string;
    score: number;
    label: {
      eng: string;
    };
    image?: string;
    synonyms?: any;
    trendingScore?: any;
    location?: any;
  }>;
  categories?: Array<{
    uri: string;
    label: string;
    wgt: number;
  }>;
  links?: string[];
  videos?: string[];
  image?: string;
  duplicateList?: string[];
  originalArticle?: string;
  eventUri?: string;
  location?: {
    type: string;
    label: {
      eng: string;
    };
  };
  extractedDates?: Array<{
    amb: boolean;
    imp: boolean;
    date: string;
    textStart: number;
    textEnd: number;
  }>;
  shares?: {
    facebook?: number;
  };
  wgt: number;
  relevance: number;
  sentiment?: number;
}

export interface NewsAPIResponse {
  articles: {
    totalResults: number;
    page: number;
    count: number;
    pages: number;
    results: NewsAPIArticle[];
  };
}

export interface NewsAPIRequest {
  query: {
    $query: {
      $and: any[];
    };
  };
  $filter?: {
    dataType?: string[];
  };
  resultType: string;
  articlesSortBy?: string;
  articlesPage?: number;
  articlesCount?: number;
  apiKey: string;
}

export class NewsAPIClient {
  private apiUrl = NEWSAPI_BASE_URL;
  private articlesPerPage: number;
  private maxTotalArticles: number;
  private requestDelayMs: number;
  private maxRetries: number;
  private timeoutMs: number;

  constructor() {
    // Configuration from environment variables
    this.articlesPerPage = parseInt(process.env.NEWSAPI_ARTICLES_PER_PAGE || '100');
    this.maxTotalArticles = parseInt(process.env.NEWSAPI_MAX_TOTAL_ARTICLES || '100');
    this.requestDelayMs = parseInt(process.env.NEWSAPI_REQUEST_DELAY_MS || '1000');
    this.maxRetries = parseInt(process.env.NEWSAPI_MAX_RETRIES || '3');
    this.timeoutMs = parseInt(process.env.NEWSAPI_TIMEOUT_MS || '30000');
  }

  /**
   * Set custom maximum total articles limit
   * @param limit Maximum number of articles to fetch
   */
  setMaxTotalArticles(limit: number): void {
    if (limit > 0 && limit <= 1000) {
      this.maxTotalArticles = limit;
      console.log(`Set maxTotalArticles to ${limit}`);
    } else {
      console.warn(`Invalid article limit ${limit}, using default 100`);
    }
  }

  /**
   * Fetch articles from NewsAPI.ai with pagination
   * Limited to maxTotalArticles (default 100) per search
   */
  async fetchArticles(requestBody: NewsAPIRequest): Promise<NewsAPIArticle[]> {
    const allArticles: NewsAPIArticle[] = [];
    let currentPage = 1;
    let hasMorePages = true;

    console.log(`Maximum total articles limit: ${this.maxTotalArticles}`);

    while (hasMorePages) {
      const request = {
        ...requestBody,
        articlesPage: currentPage,
        articlesCount: this.articlesPerPage,
        apiKey: process.env.NEWSAPI_API_KEY || ''
      };

      console.log(`Fetching page ${currentPage}...`);

      try {
        const response = await axios.post(this.apiUrl, request, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: this.timeoutMs
        });

        const data: NewsAPIResponse = response.data;
        const articles = data.articles?.results || [];

        allArticles.push(...articles);

        console.log(`Fetched ${articles.length} articles from page ${currentPage}`);
        console.log(`Total articles so far: ${allArticles.length}`);

        // Check if we've reached the maximum total articles limit
        if (allArticles.length >= this.maxTotalArticles) {
          console.log(`Reached maximum article limit of ${this.maxTotalArticles}`);
          hasMorePages = false;
        }
        // Check if there are more pages available
        else if (articles.length === this.articlesPerPage && 
                 allArticles.length < (data.articles?.totalResults || 0)) {
          currentPage++;
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, this.requestDelayMs));
        } else {
          hasMorePages = false;
        }
      } catch (error: any) {
        console.error(`Error fetching page ${currentPage}:`, error);
        throw error;
      }
    }

    // Trim to exactly maxTotalArticles if we exceeded the limit
    if (allArticles.length > this.maxTotalArticles) {
      console.log(`Trimming from ${allArticles.length} to ${this.maxTotalArticles} articles`);
      return allArticles.slice(0, this.maxTotalArticles);
    }

    return allArticles;
  }

  /**
   * Build a request body for NewsAPI.ai
   */
  buildRequest(params: {
    searchTerms: string[];
    sources: string[];
    startDate: string;
    endDate: string;
    useBooleanQuery?: boolean;
    booleanQuery?: string;
  }): NewsAPIRequest {
    const { searchTerms, sources, startDate, endDate, useBooleanQuery, booleanQuery } = params;

    // If using boolean query, parse and use it directly
    if (useBooleanQuery && booleanQuery) {
      try {
        const parsedQuery = JSON.parse(booleanQuery);
        
        // Check if the parsed query already has the full structure
        if (parsedQuery.$query) {
          // The query already contains the NewsAPI format
          return {
            query: parsedQuery,
            $filter: parsedQuery.$filter || {
              dataType: ["news", "blog"]
            },
            resultType: "articles",
            articlesSortBy: "date",
            apiKey: process.env.NEWSAPI_API_KEY || ''
          };
        }
      } catch (error) {
        console.error('Error parsing boolean query, falling back to simple query:', error);
      }
    }

    // Build simple query structure
    const query: NewsAPIRequest['query'] = {
      $query: {
        $and: []
      }
    };

    // Add search terms
    if (searchTerms.length === 1) {
      query.$query.$and.push({
        keyword: searchTerms[0],
        keywordLoc: "body"
      });
    } else if (searchTerms.length > 1) {
      const termConditions = searchTerms.map(term => ({
        keyword: term,
        keywordLoc: "body"
      }));
      query.$query.$and.push({
        $or: termConditions
      });
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
    } else {
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
  formatArticlesForDatabase(articles: NewsAPIArticle[]): any[] {
    return articles.map(article => ({
      // Map NewsAPI.ai fields to our database schema
      title: article.title || 'No Title',
      newsOutlet: article.source?.title || 'Unknown Source',
      authors: this.extractAuthors(article),
      url: article.url || null,
      fullBodyText: article.body || '',
      dateWritten: article.dateTime ? new Date(article.dateTime) : null,
      inputMethod: 'newsapi' as const,
      
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
  private parseBooleanQuery(queryString: string): any {
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
      } else if (cleanQuery.includes(' OR ')) {
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
    } catch (error) {
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
  private extractAuthors(article: NewsAPIArticle): string[] {
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
  async testConnection(): Promise<boolean> {
    try {
      const testRequest = this.buildRequest({
        searchTerms: ['test'],
        sources: [],
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
        endDate: new Date().toISOString().split('T')[0] // today
      });

      const articles = await this.fetchArticles(testRequest);
      return true;
    } catch (error) {
      console.error('NewsAPI.ai connection test failed:', error);
      return false;
    }
  }
}
