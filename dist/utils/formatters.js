"use strict";
/**
 * Data formatting and transformation utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatForExport = exports.formatArticleSummary = exports.formatAnalysisStatus = exports.formatSentiment = exports.truncateText = exports.formatRelativeTime = exports.formatDate = exports.formatQuote = exports.formatProject = exports.formatArticle = void 0;
/**
 * Format article data for API response
 * @param article Raw article data from database
 * @returns Formatted article data
 */
const formatArticle = (article) => {
    return {
        id: article.id,
        projectId: article.projectId,
        newsOutlet: article.newsOutlet,
        title: article.title,
        authors: article.authors || [],
        url: article.url,
        fullBodyText: article.fullBodyText,
        dateWritten: article.dateWritten,
        inputMethod: article.inputMethod,
        summaryGemini: article.summaryGemini,
        categoryGemini: article.categoryGemini,
        sentimentGemini: article.sentimentGemini,
        translatedGemini: article.translatedGemini,
        analysedAt: article.analysedAt,
        quotes: article.quotes || []
    };
};
exports.formatArticle = formatArticle;
/**
 * Format project data for API response
 * @param project Raw project data from database
 * @returns Formatted project data
 */
const formatProject = (project) => {
    return {
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        articles: project.articles ? project.articles.map(exports.formatArticle) : []
    };
};
exports.formatProject = formatProject;
/**
 * Format quote data for API response
 * @param quote Raw quote data from database
 * @returns Formatted quote data
 */
const formatQuote = (quote) => {
    return {
        id: quote.id,
        articleId: quote.articleId,
        stakeholderNameGemini: quote.stakeholderNameGemini,
        stakeholderAffiliationGemini: quote.stakeholderAffiliationGemini,
        quoteGemini: quote.quoteGemini
    };
};
exports.formatQuote = formatQuote;
/**
 * Format date for display
 * @param date Date object or string
 * @returns Formatted date string
 */
const formatDate = (date) => {
    if (!date)
        return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime()))
        return '';
    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
exports.formatDate = formatDate;
/**
 * Format relative time (e.g., "2 hours ago")
 * @param date Date object or string
 * @returns Relative time string
 */
const formatRelativeTime = (date) => {
    if (!date)
        return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime()))
        return '';
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    if (diffInSeconds < 60)
        return 'Just now';
    if (diffInSeconds < 3600)
        return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
        return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000)
        return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return (0, exports.formatDate)(dateObj);
};
exports.formatRelativeTime = formatRelativeTime;
/**
 * Truncate text to specified length
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @returns Truncated text with ellipsis
 */
const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength)
        return text;
    return text.substring(0, maxLength) + '...';
};
exports.truncateText = truncateText;
/**
 * Format sentiment for display
 * @param sentiment Sentiment value
 * @returns Formatted sentiment with emoji
 */
const formatSentiment = (sentiment) => {
    if (!sentiment)
        return 'Unknown';
    const sentimentMap = {
        positive: '😊 Positive',
        neutral: '😐 Neutral',
        negative: '😞 Negative'
    };
    return sentimentMap[sentiment] || sentiment;
};
exports.formatSentiment = formatSentiment;
/**
 * Format analysis status
 * @param analysedAt Analysis timestamp
 * @returns Status string
 */
const formatAnalysisStatus = (analysedAt) => {
    if (!analysedAt)
        return 'Pending';
    return `Completed ${(0, exports.formatRelativeTime)(analysedAt)}`;
};
exports.formatAnalysisStatus = formatAnalysisStatus;
/**
 * Format article summary for display
 * @param article Article object
 * @returns Formatted summary
 */
const formatArticleSummary = (article) => {
    return {
        id: article.id,
        title: article.title,
        newsOutlet: article.newsOutlet,
        dateWritten: (0, exports.formatDate)(article.dateWritten),
        sentiment: (0, exports.formatSentiment)(article.sentimentGemini),
        category: article.categoryGemini || 'Uncategorized',
        summary: (0, exports.truncateText)(article.summaryGemini || article.fullBodyText, 150),
        analysisStatus: (0, exports.formatAnalysisStatus)(article.analysedAt),
        quoteCount: article.quotes?.length || 0
    };
};
exports.formatArticleSummary = formatArticleSummary;
/**
 * Format export data for Google Sheets
 * @param project Project data with articles and quotes
 * @returns Formatted data for export
 */
const formatForExport = (project) => {
    return {
        project: {
            id: project.id,
            name: project.name,
            description: project.description,
            createdAt: project.createdAt
        },
        articles: project.articles?.map((article) => ({
            id: article.id,
            title: article.title,
            newsOutlet: article.newsOutlet,
            authors: Array.isArray(article.authors) ? article.authors.join(', ') : '',
            url: article.url,
            dateWritten: article.dateWritten,
            summary: article.summaryGemini,
            category: article.categoryGemini,
            sentiment: article.sentimentGemini,
            analysedAt: article.analysedAt
        })) || [],
        quotes: project.articles?.flatMap((article) => (article.quotes || []).map((quote) => ({
            id: quote.id,
            articleId: article.id,
            articleTitle: article.title,
            stakeholderName: quote.stakeholderNameGemini,
            stakeholderAffiliation: quote.stakeholderAffiliationGemini,
            quote: quote.quoteGemini
        }))) || []
    };
};
exports.formatForExport = formatForExport;
