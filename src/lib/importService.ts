import { ImportSessionManager, ImportSessionConfig } from './importSession';
import { SearchSource } from '@prisma/client';
import db from './db';

export interface ImportRequest {
  projectId: string;
  searchTerms: string[];
  sourceIds?: string[];
  startDate: string;
  endDate: string;
  useBooleanQuery?: boolean;
  booleanQuery?: string;
  articleLimit?: number;
}

export interface ImportPreview {
  estimatedArticles: number;
  sources: SearchSource[];
  searchTerms: string[];
  dateRange: {
    start: string;
    end: string;
  };
}

export class ImportService {
  private sessionManager: ImportSessionManager;

  constructor() {
    this.sessionManager = new ImportSessionManager();
  }

  /**
   * Preview an import before executing (shows estimated results)
   */
  async previewImport(request: ImportRequest): Promise<ImportPreview> {
    try {
      // Get selected sources
      let sources: SearchSource[] = [];
      if (request.sourceIds && request.sourceIds.length > 0) {
        // sourceIds are actually source URIs from the frontend checkboxes
        console.log('Preview: Selected source URIs:', request.sourceIds);
        sources = await db.searchSource.findMany({
          where: {
            sourceUri: { in: request.sourceIds },
            isActive: true
          }
        });
        console.log('Preview: Found sources in database:', sources.length);
      } else {
        // Get all active sources if none specified
        sources = await db.searchSource.findMany({
          where: { isActive: true }
        });
        console.log('Preview: Using all sources:', sources.length);
      }

      // For preview, we'll do a quick test query to estimate results
      // This is a simplified version - in production you might want to cache this
      const estimatedArticles = await this.estimateArticleCount(request);

      return {
        estimatedArticles,
        sources,
        searchTerms: request.searchTerms,
        dateRange: {
          start: request.startDate,
          end: request.endDate
        }
      };

    } catch (error: any) {
      throw new Error(`Failed to preview import: ${error.message}`);
    }
  }

  /**
   * Start an import session
   */
  async startImport(request: ImportRequest): Promise<{ sessionId: string; status: string }> {
    try {
      // Get source URIs for the selected sources
      let sourceUris: string[] = [];
      if (request.sourceIds && request.sourceIds.length > 0) {
        // sourceIds are actually source URIs from the frontend checkboxes
        sourceUris = request.sourceIds;
        console.log('Selected sources for import:', sourceUris);
      } else {
        console.log('No sources selected, will use all available sources');
      }

      // Create import session configuration
      const config: ImportSessionConfig = {
        projectId: request.projectId,
        searchTerms: request.searchTerms,
        sources: sourceUris,
        startDate: request.startDate,
        endDate: request.endDate,
        useBooleanQuery: request.useBooleanQuery,
        booleanQuery: request.booleanQuery,
        articleLimit: request.articleLimit
      };

      // Start the import session
      const result = await this.sessionManager.startImportSession(config);

      return {
        sessionId: result.sessionId,
        status: result.status
      };

    } catch (error: any) {
      throw new Error(`Failed to start import: ${error.message}`);
    }
  }

  /**
   * Get import session status
   */
  async getSessionStatus(sessionId: string) {
    return await this.sessionManager.getSessionStatus(sessionId);
  }

  /**
   * Get all import sessions for a project
   */
  async getProjectSessions(projectId: string) {
    return await this.sessionManager.getProjectImportSessions(projectId);
  }

  /**
   * Cancel a running import session
   */
  async cancelSession(sessionId: string) {
    return await this.sessionManager.cancelSession(sessionId);
  }

  /**
   * Get import statistics for a project
   */
  async getProjectStats(projectId: string) {
    return await this.sessionManager.getProjectImportStats(projectId);
  }

  /**
   * Get available search sources
   */
  async getSearchSources(): Promise<SearchSource[]> {
    return await db.searchSource.findMany({
      where: { isActive: true },
      orderBy: [
        { country: 'asc' },
        { title: 'asc' }
      ]
    });
  }

  /**
   * Get search sources by country
   */
  async getSearchSourcesByCountry(country?: string): Promise<SearchSource[]> {
    const whereClause: any = { isActive: true };
    
    if (country) {
      whereClause.country = country;
    }

    return await db.searchSource.findMany({
      where: whereClause,
      orderBy: [
        { country: 'asc' },
        { title: 'asc' }
      ]
    });
  }

  /**
   * Get available countries for source filtering
   */
  async getAvailableCountries(): Promise<string[]> {
    const countries = await db.searchSource.findMany({
      where: { isActive: true },
      select: { country: true },
      distinct: ['country'],
      orderBy: { country: 'asc' }
    });

    return countries.map((c: any) => c.country);
  }

  /**
   * Get available languages for source filtering
   */
  async getAvailableLanguages(): Promise<string[]> {
    const languages = await db.searchSource.findMany({
      where: { isActive: true },
      select: { language: true },
      distinct: ['language'],
      orderBy: { language: 'asc' }
    });

    return languages.map((l: any) => l.language);
  }

  /**
   * Estimate article count for preview (simplified version)
   */
  private async estimateArticleCount(request: ImportRequest): Promise<number> {
    // This is a simplified estimation
    // In production, you might want to do a lightweight query to NewsAPI.ai
    // or use historical data to estimate results
    
    const daysDiff = Math.ceil(
      (new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Rough estimation based on search terms and date range
    const baseEstimate = request.searchTerms.length * 10; // 10 articles per term per day
    const dateMultiplier = Math.min(daysDiff, 30); // Cap at 30 days for estimation
    const sourceMultiplier = request.sourceIds ? request.sourceIds.length : 1;
    
    return Math.min(baseEstimate * dateMultiplier * sourceMultiplier, 1000); // Cap at 1000 for preview
  }

  /**
   * Validate import request
   */
  validateImportRequest(request: ImportRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.projectId) {
      errors.push('Project ID is required');
    }

    if (!request.searchTerms || request.searchTerms.length === 0) {
      errors.push('At least one search term is required');
    }

    if (!request.startDate) {
      errors.push('Start date is required');
    }

    if (!request.endDate) {
      errors.push('End date is required');
    }

    if (request.startDate && request.endDate) {
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);
      
      if (startDate >= endDate) {
        errors.push('Start date must be before end date');
      }

      if (endDate > new Date()) {
        errors.push('End date cannot be in the future');
      }

      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 365) {
        errors.push('Date range cannot exceed 365 days');
      }
    }

    if (request.useBooleanQuery && !request.booleanQuery) {
      errors.push('Boolean query is required when useBooleanQuery is true');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
