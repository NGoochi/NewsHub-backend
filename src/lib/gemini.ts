import axios from 'axios';
import db from './db';

interface GeminiAnalysisRequest {
  articles: Array<{
    id: string;
    title: string;
    fullBodyText: string;
    newsOutlet?: string;
    authors?: string[];
  }>;
}

interface GeminiAnalysisResponse {
  articles: Array<{
    id: string;
    summary: string;
    category: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    translated: boolean;
    quotes: Array<{
      stakeholderName: string;
      stakeholderAffiliation: string;
      quote: string;
    }>;
  }>;
}

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const promptCache = new Map<string, { content: string, timestamp: number }>();
let categoryCache: { data: any[], timestamp: number } | null = null;

/**
 * Clear all caches (called when categories are updated)
 */
export function clearPromptCache() {
  promptCache.clear();
  categoryCache = null;
  console.log('✨ Prompt and category cache cleared');
}

/**
 * Load prompt template from database with caching
 */
async function loadPromptTemplate(type: 'article-analysis' | 'quote-analysis'): Promise<string> {
  const cached = promptCache.get(type);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`📦 Using cached prompt: ${type}`);
    return cached.content;
  }
  
  console.log(`🔄 Loading prompt from database: ${type}`);
  const prompt = await db.promptTemplate.findFirst({
    where: { type, isActive: true },
    orderBy: { version: 'desc' }
  });
  
  if (!prompt) {
    throw new Error(`Active prompt template not found: ${type}`);
  }
  
  promptCache.set(type, { content: prompt.content, timestamp: Date.now() });
  return prompt.content;
}

/**
 * Load category definitions from database with caching
 */
async function loadCategoryDefinitions(): Promise<any[]> {
  if (categoryCache && Date.now() - categoryCache.timestamp < CACHE_TTL) {
    console.log('📦 Using cached categories');
    return categoryCache.data;
  }
  
  console.log('🔄 Loading categories from database');
  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' }
  });
  
  const formatted = categories.map(cat => ({
    category: cat.name,
    definition: cat.definition,
    keywords: cat.keywords
  }));
  
  categoryCache = { data: formatted, timestamp: Date.now() };
  return formatted;
}

/**
 * Analyze articles using Gemini API with article analysis prompt
 * @param articles Array of articles to analyze (max 10)
 * @returns Analysis results with summaries, categories, sentiment
 */
export const analyzeArticles = async (articles: GeminiAnalysisRequest['articles']): Promise<any> => {
  const apiKey = process.env.GEMINI_API_KEY;
  const timeoutMs = parseInt(process.env.GEMINI_TIMEOUT_MS || '300000'); // Default 5 minutes
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  if (articles.length > 10) {
    throw new Error('Maximum 10 articles can be analyzed per request');
  }

  if (articles.length === 0) {
    throw new Error('At least one article is required for analysis');
  }

  console.log(`⏳ Starting Gemini article analysis at ${new Date().toISOString()}`);
  console.log(`📊 Processing ${articles.length} article${articles.length > 1 ? 's' : ''} - this may take 3-5 minutes`);
  console.log(`⏱️  Timeout configured: ${timeoutMs / 1000} seconds`);

  // Load the article analysis prompt from database
  const systemPrompt = await loadPromptTemplate('article-analysis');
  
  // Load category definitions from database
  const categories = await loadCategoryDefinitions();
  
  // Create number range for output
  const numberRange = `1-${articles.length}`;

  const userPrompt = `Please analyze these articles:

Articles JSON:
${JSON.stringify(articles.map(article => ({
  id: article.id,
  title: article.title,
  source: article.newsOutlet || 'Unknown',
  author: article.authors?.join(', ') || '',
  date: new Date().toISOString().split('T')[0], // Current date as placeholder
  url: '', // Not available in our data
  text: article.fullBodyText
})), null, 2)}

Categories JSON:
${JSON.stringify(categories, null, 2)}

Number Range: ${numberRange}

Return the analysis in the specified JSON format.`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\n${userPrompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: timeoutMs
      }
    );

    console.log(`✅ Gemini article analysis completed at ${new Date().toISOString()}`);

    const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No content generated by Gemini');
    }

    // Parse the JSON response - handle markdown code blocks
    let jsonText = generatedText;
    
    // Remove markdown code blocks if present
    if (jsonText.includes('```json')) {
      const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
    } else if (jsonText.includes('```')) {
      const jsonMatch = jsonText.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
    }
    
    // Clean up any remaining markdown artifacts
    jsonText = jsonText.trim();
    
    const analysisResult = JSON.parse(jsonText);
    
    // Validate the response structure
    if (!analysisResult.articles || !Array.isArray(analysisResult.articles)) {
      throw new Error('Invalid response format from Gemini');
    }

    console.log(`📈 Successfully parsed ${analysisResult.articles.length} article analysis results`);

    return analysisResult;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Gemini API request failed: ${error.response?.data?.error?.message || error.message}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse Gemini response as JSON: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Extract quotes from articles using Gemini API with quote analysis prompt
 * @param articles Array of articles to analyze (max 10)
 * @returns Quote extraction results
 */
export const extractQuotes = async (articles: GeminiAnalysisRequest['articles']): Promise<any> => {
  const apiKey = process.env.GEMINI_API_KEY;
  const timeoutMs = parseInt(process.env.GEMINI_TIMEOUT_MS || '300000'); // Default 5 minutes
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  if (articles.length > 10) {
    throw new Error('Maximum 10 articles can be analyzed per request');
  }

  if (articles.length === 0) {
    throw new Error('At least one article is required for analysis');
  }

  console.log(`⏳ Starting Gemini quote extraction at ${new Date().toISOString()}`);
  console.log(`📊 Processing ${articles.length} article${articles.length > 1 ? 's' : ''} for quotes - this may take 3-5 minutes`);
  console.log(`⏱️  Timeout configured: ${timeoutMs / 1000} seconds`);

  // Load the quote analysis prompt from database
  const systemPrompt = await loadPromptTemplate('quote-analysis');
  
  // Create number range for output
  const numberRange = `1-${articles.length}`;

  const userPrompt = `Please extract quotes from these articles:

Articles JSON:
${JSON.stringify(articles.map(article => ({
  id: article.id,
  title: article.title,
  source: article.newsOutlet || 'Unknown',
  author: article.authors?.join(', ') || '',
  date: new Date().toISOString().split('T')[0], // Current date as placeholder
  text: article.fullBodyText
})), null, 2)}

Number Range: ${numberRange}

Return the quote extraction in the specified JSON format.`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\n${userPrompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: timeoutMs
      }
    );

    console.log(`✅ Gemini quote extraction completed at ${new Date().toISOString()}`);

    const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No content generated by Gemini');
    }

    // Parse the JSON response - handle markdown code blocks
    let jsonText = generatedText;
    
    // Remove markdown code blocks if present
    if (jsonText.includes('```json')) {
      const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
    } else if (jsonText.includes('```')) {
      const jsonMatch = jsonText.match(/```\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
    }
    
    // Clean up any remaining markdown artifacts
    jsonText = jsonText.trim();
    
    const analysisResult = JSON.parse(jsonText);
    
    // Validate the response structure
    if (!analysisResult.quotes || !Array.isArray(analysisResult.quotes)) {
      throw new Error('Invalid response format from Gemini');
    }

    console.log(`💬 Successfully extracted ${analysisResult.quotes.length} quotes`);

    return analysisResult;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Gemini API request failed: ${error.response?.data?.error?.message || error.message}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse Gemini response as JSON: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Test Gemini API connection
 * @returns True if connection is successful
 */
export const testGeminiConnection = async (): Promise<boolean> => {
  try {
    await analyzeArticles([{
      id: 'test',
      title: 'Test Article',
      fullBodyText: 'This is a test article for connection testing.',
      newsOutlet: 'Test Source'
    }]);
    return true;
  } catch (error: any) {
    return false;
  }
};
