import { Request, Response } from 'express';
import { ImportService, ImportRequest } from '../lib/importService';
import { validateProjectData, validateRequiredFields, isValidUUID } from '../utils/validation';
import prisma from '../lib/db';
import { PDFExtractor } from '../lib/pdfExtractor';

const importService = new ImportService();

/**
 * Preview an import before executing
 * POST /import/preview
 */
export const previewImport = async (req: Request, res: Response) => {
  try {
    const { projectId, searchTerms, sourceIds, startDate, endDate, useBooleanQuery, booleanQuery, articleLimit } = req.body;

    // Validate required fields
    const validation = validateRequiredFields(req.body, [
      'projectId', 'searchTerms', 'startDate', 'endDate'
    ]);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${validation.missingFields.join(', ')}`
      });
    }

    // Validate project ID format
    if (!isValidUUID(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID format'
      });
    }

    // Validate search terms
    if (!Array.isArray(searchTerms) || searchTerms.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search terms must be a non-empty array'
      });
    }

    // Validate dates
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format'
      });
    }

    if (startDateObj >= endDateObj) {
      return res.status(400).json({
        success: false,
        error: 'Start date must be before end date'
      });
    }

    // Validate boolean query if provided
    if (useBooleanQuery && (!booleanQuery || booleanQuery.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Boolean query is required when useBooleanQuery is true'
      });
    }

    // Create import request
    const importRequest: ImportRequest = {
      projectId,
      searchTerms,
      sourceIds: sourceIds || [],
      startDate,
      endDate,
      useBooleanQuery: useBooleanQuery || false,
      booleanQuery: booleanQuery || undefined,
      articleLimit: articleLimit || undefined
    };

    // Validate the request
    const requestValidation = importService.validateImportRequest(importRequest);
    if (!requestValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: `Validation failed: ${requestValidation.errors.join(', ')}`
      });
    }

    // Get preview
    const preview = await importService.previewImport(importRequest);

    res.json({
      success: true,
      data: preview,
      error: null
    });

  } catch (error: any) {
    console.error('Preview import error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to preview import'
    });
  }
};

/**
 * Start an import session
 * POST /import/start
 */
export const startImport = async (req: Request, res: Response) => {
  try {
    const { projectId, searchTerms, sourceIds, startDate, endDate, useBooleanQuery, booleanQuery, articleLimit } = req.body;

    // Validate required fields
    const validation = validateRequiredFields(req.body, [
      'projectId', 'searchTerms', 'startDate', 'endDate'
    ]);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${validation.missingFields.join(', ')}`
      });
    }

    // Validate project ID format
    if (!isValidUUID(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID format'
      });
    }

    // Create import request
    const importRequest: ImportRequest = {
      projectId,
      searchTerms,
      sourceIds: sourceIds || [],
      startDate,
      endDate,
      useBooleanQuery: useBooleanQuery || false,
      booleanQuery: booleanQuery || undefined,
      articleLimit: articleLimit || undefined
    };

    // Validate the request
    const requestValidation = importService.validateImportRequest(importRequest);
    if (!requestValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: `Validation failed: ${requestValidation.errors.join(', ')}`
      });
    }

    // Start import
    const result = await importService.startImport(importRequest);

    res.json({
      success: true,
      data: result,
      error: null
    });

  } catch (error: any) {
    console.error('Start import error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start import'
    });
  }
};

/**
 * Get import session status
 * GET /import/session/:sessionId
 */
export const getSessionStatus = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    if (!isValidUUID(sessionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID format'
      });
    }

    const session = await importService.getSessionStatus(sessionId);

    res.json({
      success: true,
      data: session,
      error: null
    });

  } catch (error: any) {
    console.error('Get session status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get session status'
    });
  }
};

/**
 * Get all import sessions for a project
 * GET /import/project/:projectId/sessions
 */
export const getProjectSessions = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    if (!isValidUUID(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID format'
      });
    }

    const sessions = await importService.getProjectSessions(projectId);

    res.json({
      success: true,
      data: sessions,
      error: null
    });

  } catch (error: any) {
    console.error('Get project sessions error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get project sessions'
    });
  }
};

/**
 * Cancel a running import session
 * POST /import/session/:sessionId/cancel
 */
export const cancelSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    if (!isValidUUID(sessionId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session ID format'
      });
    }

    await importService.cancelSession(sessionId);

    res.json({
      success: true,
      data: { message: 'Session cancelled successfully' },
      error: null
    });

  } catch (error: any) {
    console.error('Cancel session error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel session'
    });
  }
};

/**
 * Get import statistics for a project
 * GET /import/project/:projectId/stats
 */
export const getProjectStats = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    if (!isValidUUID(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID format'
      });
    }

    const stats = await importService.getProjectStats(projectId);

    res.json({
      success: true,
      data: stats,
      error: null
    });

  } catch (error: any) {
    console.error('Get project stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get project statistics'
    });
  }
};

/**
 * Get available search sources
 * GET /import/sources
 */
export const getSearchSources = async (req: Request, res: Response) => {
  try {
    const { country } = req.query;

    let sources;
    if (country && typeof country === 'string') {
      sources = await importService.getSearchSourcesByCountry(country);
    } else {
      sources = await importService.getSearchSources();
    }

    res.json({
      success: true,
      data: sources,
      error: null
    });

  } catch (error: any) {
    console.error('Get search sources error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get search sources'
    });
  }
};

/**
 * Get available countries for source filtering
 * GET /import/countries
 */
export const getAvailableCountries = async (req: Request, res: Response) => {
  try {
    const countries = await importService.getAvailableCountries();

    res.json({
      success: true,
      data: countries,
      error: null
    });

  } catch (error: any) {
    console.error('Get available countries error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get available countries'
    });
  }
};

/**
 * Get available languages for source filtering
 * GET /import/languages
 */
export const getAvailableLanguages = async (req: Request, res: Response) => {
  try {
    const languages = await importService.getAvailableLanguages();

    res.json({
      success: true,
      data: languages,
      error: null
    });

  } catch (error: any) {
    console.error('Get available languages error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get available languages'
    });
  }
};

/**
 * Import articles using NewsAPI with boolean query
 * POST /import/newsapi
 * 
 * Expected request body format:
 * {
 *   "projectId": "uuid",
 *   "query": {
 *     "$query": { ... NewsAPI query structure ... },
 *     "$filter": { "dataType": ["news", "blog"] }
 *   },
 *   "resultType": "articles",
 *   "articlesSortBy": "date"
 * }
 */
export const importNewsAPI = async (req: Request, res: Response) => {
  try {
    const { projectId, query } = req.body;
    
    // Validate inputs
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: projectId'
      });
    }
    
    if (!query || !query.$query) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid query structure. Expected format: { "$query": { ... } }'
      });
    }
    
    // Validate project ID format
    if (!isValidUUID(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID format'
      });
    }
    
    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Extract search parameters from the boolean query structure for session metadata
    const searchTerms = extractSearchTerms(query);
    const sourceIds = extractSourceIds(query);
    const startDate = extractDateStart(query) || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = extractDateEnd(query) || new Date().toISOString().split('T')[0];
    
    console.log('NewsAPI Import Request:');
    console.log('- Search terms extracted:', searchTerms);
    console.log('- Sources extracted:', sourceIds);
    console.log('- Date range:', startDate, 'to', endDate);
    
    // Use existing ImportService to handle the import
    // Pass the entire query structure as the boolean query
    const importRequest: ImportRequest = {
      projectId,
      searchTerms: searchTerms.length > 0 ? searchTerms : ['news'], // Fallback for session tracking
      sourceIds: sourceIds || [],
      startDate,
      endDate,
      useBooleanQuery: true,
      booleanQuery: JSON.stringify(query) // Pass the entire query object
    };
    
    // Start import using existing service
    const result = await importService.startImport(importRequest);
    
    return res.json({
      success: true,
      data: {
        sessionId: result.sessionId,
        status: 'running',
        message: 'Import started successfully. Use the session ID to track progress.'
      },
      error: null
    });
    
  } catch (error: any) {
    console.error('NewsAPI import error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to start NewsAPI import'
    });
  }
};

/**
 * Import articles from PDF file
 * POST /import/pdf
 */
export const importPDF = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.body;
    const pdfFile = req.file;
    
    // Validate inputs
    if (!pdfFile) {
      return res.status(400).json({
        success: false,
        error: 'No PDF file provided'
      });
    }
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }
    
    // Validate project ID format
    if (!isValidUUID(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID format'
      });
    }
    
    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    console.log(`Processing PDF: ${pdfFile.originalname} (${pdfFile.size} bytes)`);
    
    // Extract articles from PDF
    const extractor = new PDFExtractor();
    const extractedArticles = await extractor.extractArticles(pdfFile.buffer);
    
    console.log(`Extracted ${extractedArticles.length} articles from PDF`);
    
    // Save articles to database
    const articleIds: string[] = [];
    let imported = 0;
    let failed = 0;
    const errors: Array<{ title: string; error: string }> = [];
    
    for (const article of extractedArticles) {
      try {
        console.log(`\nAttempting to save article: "${article.title}"`);
        console.log('Article data:', {
          title: article.title,
          source: article.source,
          author: article.author,
          publishDate: article.publishDate,
          wordCount: article.wordCount,
          textLength: article.textContent?.length
        });
        
        const createdArticle = await prisma.article.create({
          data: {
            projectId: projectId,
            title: article.title,
            newsOutlet: article.source || 'Unknown Source',
            authors: article.author ? [article.author] : [],
            url: '',  // PDFs typically don't have URLs
            fullBodyText: article.textContent,
            dateWritten: article.publishDate ? new Date(article.publishDate) : new Date(),
            inputMethod: 'pdf', // Using new enum value
            sourceUri: article.source || 'factiva',
          }
        });
        
        console.log(`✓ Successfully saved article with ID: ${createdArticle.id}`);
        articleIds.push(createdArticle.id);
        imported++;
      } catch (error: any) {
        console.error(`✗ Failed to save article "${article.title}":`, error.message);
        console.error('Full error:', error);
        errors.push({ title: article.title, error: error.message });
        failed++;
      }
    }
    
    console.log(`\nImport complete: ${imported} imported, ${failed} failed`);
    if (errors.length > 0) {
      console.log('\nErrors encountered:');
      errors.forEach(e => console.log(`  - ${e.title}: ${e.error}`));
    }
    
    return res.json({
      success: true,
      data: {
        imported,
        failed,
        articleIds
      },
      error: null
    });
    
  } catch (error: any) {
    console.error('PDF import error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process PDF'
    });
  }
};

/**
 * Import manually entered articles
 * POST /import/manual
 */
export const importManual = async (req: Request, res: Response) => {
  try {
    const { projectId, articles } = req.body;
    
    // Validate inputs
    if (!projectId || !articles || !Array.isArray(articles)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: projectId and articles array required'
      });
    }
    
    if (articles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one article is required'
      });
    }
    
    // Validate project ID format
    if (!isValidUUID(projectId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID format'
      });
    }
    
    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Validate article data
    for (const article of articles) {
      if (!article.source || !article.title || !article.body || !article.publishDate) {
        return res.status(400).json({
          success: false,
          error: 'Each article must have: source, title, body, and publishDate'
        });
      }
    }
    
    console.log(`Importing ${articles.length} manual articles to project ${projectId}`);
    
    // Save articles to database
    const articleIds: string[] = [];
    let imported = 0;
    
    for (const article of articles) {
      try {
        const createdArticle = await prisma.article.create({
          data: {
            projectId: projectId,
            title: article.title,
            newsOutlet: article.source,
            authors: article.author ? [article.author] : [],
            url: article.url || '',
            fullBodyText: article.body,
            dateWritten: new Date(article.publishDate),
            inputMethod: 'manual',
            sourceUri: article.source.toLowerCase().replace(/\s+/g, '-'),
          }
        });
        
        articleIds.push(createdArticle.id);
        imported++;
      } catch (error: any) {
        console.error(`Failed to save article "${article.title}":`, error);
        // Continue with other articles
      }
    }
    
    console.log(`Manual import complete: ${imported} articles imported`);
    
    return res.json({
      success: true,
      data: {
        imported,
        articleIds
      },
      error: null
    });
    
  } catch (error: any) {
    console.error('Manual import error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to import articles'
    });
  }
};

// Helper functions for boolean query parsing
function extractSearchTerms(query: any): string[] {
  const terms: string[] = [];
  const traverse = (obj: any) => {
    if (obj.keyword) terms.push(obj.keyword);
    if (obj.$or) obj.$or.forEach(traverse);
    if (obj.$and) obj.$and.forEach(traverse);
  };
  
  if (query.$query) traverse(query.$query);
  return terms;
}

function extractSourceIds(query: any): string[] {
  const sources: string[] = [];
  const traverse = (obj: any) => {
    if (obj.sourceUri) sources.push(obj.sourceUri);
    if (obj.$or) obj.$or.forEach(traverse);
    if (obj.$and) obj.$and.forEach(traverse);
  };
  
  if (query.$query) traverse(query.$query);
  return sources;
}

function extractDateStart(query: any): string | undefined {
  const traverse = (obj: any): string | undefined => {
    if (obj.dateStart) return obj.dateStart;
    if (obj.$and) {
      for (const item of obj.$and) {
        const result = traverse(item);
        if (result) return result;
      }
    }
    return undefined;
  };
  
  return traverse(query.$query);
}

function extractDateEnd(query: any): string | undefined {
  const traverse = (obj: any): string | undefined => {
    if (obj.dateEnd) return obj.dateEnd;
    if (obj.$and) {
      for (const item of obj.$and) {
        const result = traverse(item);
        if (result) return result;
      }
    }
    return undefined;
  };
  
  return traverse(query.$query);
}
