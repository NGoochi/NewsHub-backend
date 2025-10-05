"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = void 0;
const importSession_1 = require("./importSession");
const db_1 = require("./db");
class ImportService {
    constructor() {
        this.sessionManager = new importSession_1.ImportSessionManager();
    }
    /**
     * Preview an import before executing (shows estimated results)
     */
    async previewImport(request) {
        try {
            // Get selected sources
            let sources = [];
            if (request.sourceIds && request.sourceIds.length > 0) {
                sources = await db_1.db.searchSource.findMany({
                    where: {
                        id: { in: request.sourceIds },
                        isActive: true
                    }
                });
            }
            else {
                // Get all active sources if none specified
                sources = await db_1.db.searchSource.findMany({
                    where: { isActive: true }
                });
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
        }
        catch (error) {
            throw new Error(`Failed to preview import: ${error.message}`);
        }
    }
    /**
     * Start an import session
     */
    async startImport(request) {
        try {
            // Get source URIs for the selected sources
            let sourceUris = [];
            if (request.sourceIds && request.sourceIds.length > 0) {
                const sources = await db_1.db.searchSource.findMany({
                    where: {
                        id: { in: request.sourceIds },
                        isActive: true
                    },
                    select: { sourceUri: true }
                });
                sourceUris = sources.map(s => s.sourceUri);
            }
            // Create import session configuration
            const config = {
                projectId: request.projectId,
                searchTerms: request.searchTerms,
                sources: sourceUris,
                startDate: request.startDate,
                endDate: request.endDate,
                useBooleanQuery: request.useBooleanQuery,
                booleanQuery: request.booleanQuery
            };
            // Start the import session
            const result = await this.sessionManager.startImportSession(config);
            return {
                sessionId: result.sessionId,
                status: result.status
            };
        }
        catch (error) {
            throw new Error(`Failed to start import: ${error.message}`);
        }
    }
    /**
     * Get import session status
     */
    async getSessionStatus(sessionId) {
        return await this.sessionManager.getSessionStatus(sessionId);
    }
    /**
     * Get all import sessions for a project
     */
    async getProjectSessions(projectId) {
        return await this.sessionManager.getProjectImportSessions(projectId);
    }
    /**
     * Cancel a running import session
     */
    async cancelSession(sessionId) {
        return await this.sessionManager.cancelSession(sessionId);
    }
    /**
     * Get import statistics for a project
     */
    async getProjectStats(projectId) {
        return await this.sessionManager.getProjectImportStats(projectId);
    }
    /**
     * Get available search sources
     */
    async getSearchSources() {
        return await db_1.db.searchSource.findMany({
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
    async getSearchSourcesByCountry(country) {
        const whereClause = { isActive: true };
        if (country) {
            whereClause.country = country;
        }
        return await db_1.db.searchSource.findMany({
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
    async getAvailableCountries() {
        const countries = await db_1.db.searchSource.findMany({
            where: { isActive: true },
            select: { country: true },
            distinct: ['country'],
            orderBy: { country: 'asc' }
        });
        return countries.map(c => c.country);
    }
    /**
     * Estimate article count for preview (simplified version)
     */
    async estimateArticleCount(request) {
        // This is a simplified estimation
        // In production, you might want to do a lightweight query to NewsAPI.ai
        // or use historical data to estimate results
        const daysDiff = Math.ceil((new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / (1000 * 60 * 60 * 24));
        // Rough estimation based on search terms and date range
        const baseEstimate = request.searchTerms.length * 10; // 10 articles per term per day
        const dateMultiplier = Math.min(daysDiff, 30); // Cap at 30 days for estimation
        const sourceMultiplier = request.sourceIds ? request.sourceIds.length : 1;
        return Math.min(baseEstimate * dateMultiplier * sourceMultiplier, 1000); // Cap at 1000 for preview
    }
    /**
     * Validate import request
     */
    validateImportRequest(request) {
        const errors = [];
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
exports.ImportService = ImportService;
