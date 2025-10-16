import db from './db';
import * as crypto from 'crypto';

interface CachedContext {
  content: string;
  contentHash: string;
  createdAt: Date;
  expiresAt: Date;
  type: 'article-analysis' | 'quote-analysis';
}

interface ContextCacheConfig {
  ttl: string;
  maxRetries: number;
  retryDelay: number;
}

export class GeminiContextCache {
  private static cache: Map<string, CachedContext> = new Map();
  private static readonly config: ContextCacheConfig = {
    ttl: process.env.GEMINI_CONTEXT_TTL || "3600s", // 1 hour default
    maxRetries: 3,
    retryDelay: 1000
  };
  
  // Batch-level cache that gets refreshed at the start of each batch
  private static batchCache: Map<string, CachedContext> = new Map();

  /**
   * Load prompt template from database
   */
  private static async loadPromptTemplate(type: 'article-analysis' | 'quote-analysis'): Promise<string> {
    const prompt = await db.promptTemplate.findFirst({
      where: { type, isActive: true },
      orderBy: { version: 'desc' }
    });
    
    if (!prompt) {
      throw new Error(`Active prompt template not found: ${type}`);
    }
    
    return prompt.content;
  }

  /**
   * Load category definitions from database
   */
  private static async loadCategoryDefinitions(): Promise<any[]> {
    const categories = await db.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });
    
    return categories.map(cat => ({
      category: cat.name,
      definition: cat.definition,
      keywords: cat.keywords
    }));
  }

  /**
   * Create optimized context content for caching
   */
  private static async createCachedContextContent(type: 'article-analysis' | 'quote-analysis'): Promise<string> {
    if (type === 'article-analysis') {
      const systemPrompt = await this.loadPromptTemplate('article-analysis');
      const categories = await this.loadCategoryDefinitions();
      
      // Create a clean, optimized context that emphasizes JSON-only responses
      return `${systemPrompt}

CRITICAL FORMATTING REQUIREMENTS:
- You MUST respond with ONLY valid JSON
- NO explanations, NO commentary, NO extra text
- NO markdown code blocks
- NO conversational responses

Categories JSON:
${JSON.stringify(categories, null, 2)}

IMPORTANT: Use these categories for classification. Return analysis in the exact JSON format specified above.`;
    } else { // quote-analysis
      const systemPrompt = await this.loadPromptTemplate('quote-analysis');
      
      return `${systemPrompt}

CRITICAL FORMATTING REQUIREMENTS:
- You MUST respond with ONLY valid JSON
- NO explanations, NO commentary, NO extra text
- NO markdown code blocks
- NO conversational responses

IMPORTANT: Return quote extraction in the exact JSON format specified above.`;
    }
  }

  /**
   * Initialize batch-level context cache (call at start of batch processing)
   */
  static async initializeBatchContext(): Promise<void> {
    console.log('🚀 Initializing batch-level context cache...');
    
    // Clear any existing batch cache
    this.batchCache.clear();
    
    // Load fresh contexts for the batch
    const articleContext = await this.createCachedContextContent('article-analysis');
    const quoteContext = await this.createCachedContextContent('quote-analysis');
    
    // Store in batch cache with long expiration (for the duration of the batch)
    const expiresAt = new Date(Date.now() + parseInt(this.config.ttl) * 1000);
    
    this.batchCache.set('article-analysis', {
      content: articleContext,
      contentHash: crypto.createHash('sha256').update(articleContext).digest('hex'),
      type: 'article-analysis',
      createdAt: new Date(),
      expiresAt
    });
    
    this.batchCache.set('quote-analysis', {
      content: quoteContext,
      contentHash: crypto.createHash('sha256').update(quoteContext).digest('hex'),
      type: 'quote-analysis',
      createdAt: new Date(),
      expiresAt
    });
    
    console.log('✅ Batch-level context cache initialized');
  }

  /**
   * Get article analysis context with batch-level caching
   */
  static async getArticleAnalysisContext(): Promise<string> {
    const cacheKey = 'article-analysis';
    
    // First check batch cache (highest priority)
    const batchCached = this.batchCache.get(cacheKey);
    if (batchCached && batchCached.expiresAt > new Date()) {
      console.log('📦 Using batch-cached article analysis context');
      return batchCached.content;
    }
    
    // Fallback to regular cache
    const cached = this.cache.get(cacheKey);
    const currentContent = await this.createCachedContextContent(cacheKey);
    const currentContentHash = crypto.createHash('sha256').update(currentContent).digest('hex');

    // Check if cache is valid and content hasn't changed
    if (cached && cached.expiresAt > new Date() && cached.contentHash === currentContentHash) {
      console.log('📦 Using cached article analysis context');
      return cached.content;
    }

    console.log('🔄 Creating new article analysis context cache');
    const expiresAt = new Date(Date.now() + parseInt(this.config.ttl) * 1000);
    
    this.cache.set(cacheKey, {
      content: currentContent,
      contentHash: currentContentHash,
      type: cacheKey,
      createdAt: new Date(),
      expiresAt
    });
    
    console.log(`✅ Created article analysis context cache: ${cacheKey}`);
    return currentContent;
  }

  /**
   * Get quote analysis context with batch-level caching
   */
  static async getQuoteAnalysisContext(): Promise<string> {
    const cacheKey = 'quote-analysis';
    
    // First check batch cache (highest priority)
    const batchCached = this.batchCache.get(cacheKey);
    if (batchCached && batchCached.expiresAt > new Date()) {
      console.log('📦 Using batch-cached quote analysis context');
      return batchCached.content;
    }
    
    // Fallback to regular cache
    const cached = this.cache.get(cacheKey);
    const currentContent = await this.createCachedContextContent(cacheKey);
    const currentContentHash = crypto.createHash('sha256').update(currentContent).digest('hex');

    // Check if cache is valid and content hasn't changed
    if (cached && cached.expiresAt > new Date() && cached.contentHash === currentContentHash) {
      console.log('📦 Using cached quote analysis context');
      return cached.content;
    }

    console.log('🔄 Creating new quote analysis context cache');
    const expiresAt = new Date(Date.now() + parseInt(this.config.ttl) * 1000);
    
    this.cache.set(cacheKey, {
      content: currentContent,
      contentHash: currentContentHash,
      type: cacheKey,
      createdAt: new Date(),
      expiresAt
    });
    
    console.log(`✅ Created quote analysis context cache: ${cacheKey}`);
    return currentContent;
  }

  /**
   * Clear all caches
   */
  static clearCache(): void {
    console.log('🗑️ Clearing all context caches');
    this.cache.clear();
    this.batchCache.clear();
  }

  /**
   * Clear only batch cache (useful for ending a batch)
   */
  static clearBatchCache(): void {
    console.log('🗑️ Clearing batch-level context cache');
    this.batchCache.clear();
  }

  /**
   * Refresh all context caches
   */
  static async refreshAllContexts(): Promise<void> {
    console.log('♻️ Refreshing all context caches...');
    this.clearCache(); // Clear existing to force reload
    await this.getArticleAnalysisContext();
    await this.getQuoteAnalysisContext();
    console.log('✅ All context caches refreshed.');
  }

  /**
   * Get cache status for monitoring
   */
  static getCacheStatus() {
    const status: Record<string, any> = {
      regular: {},
      batch: {}
    };
    
    // Regular cache status
    this.cache.forEach((cached, key) => {
      status.regular[key] = {
        active: cached.expiresAt > new Date(),
        expiresAt: cached.expiresAt.toISOString(),
        createdAt: cached.createdAt.toISOString(),
        contentHash: cached.contentHash,
        contentPreview: cached.content.substring(0, 100) + '...'
      };
    });
    
    // Batch cache status
    this.batchCache.forEach((cached, key) => {
      status.batch[key] = {
        active: cached.expiresAt > new Date(),
        expiresAt: cached.expiresAt.toISOString(),
        createdAt: cached.createdAt.toISOString(),
        contentHash: cached.contentHash,
        contentPreview: cached.content.substring(0, 100) + '...'
      };
    });
    
    return status;
  }
}
