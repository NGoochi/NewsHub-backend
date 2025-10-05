/**
 * Data formatting and transformation utilities
 */

/**
 * Format article data for API response
 * @param article Raw article data from database
 * @returns Formatted article data
 */
export const formatArticle = (article: any) => {
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

/**
 * Format project data for API response
 * @param project Raw project data from database
 * @returns Formatted project data
 */
export const formatProject = (project: any) => {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    articles: project.articles ? project.articles.map(formatArticle) : []
  };
};

/**
 * Format quote data for API response
 * @param quote Raw quote data from database
 * @returns Formatted quote data
 */
export const formatQuote = (quote: any) => {
  return {
    id: quote.id,
    articleId: quote.articleId,
    stakeholderNameGemini: quote.stakeholderNameGemini,
    stakeholderAffiliationGemini: quote.stakeholderAffiliationGemini,
    quoteGemini: quote.quoteGemini
  };
};

/**
 * Format date for display
 * @param date Date object or string
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | null): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param date Date object or string
 * @returns Relative time string
 */
export const formatRelativeTime = (date: Date | string | null): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(dateObj);
};

/**
 * Truncate text to specified length
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @returns Truncated text with ellipsis
 */
export const truncateText = (text: string, maxLength: number = 100): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Format sentiment for display
 * @param sentiment Sentiment value
 * @returns Formatted sentiment with emoji
 */
export const formatSentiment = (sentiment: string | null): string => {
  if (!sentiment) return 'Unknown';
  
  const sentimentMap: Record<string, string> = {
    positive: '😊 Positive',
    neutral: '😐 Neutral',
    negative: '😞 Negative'
  };
  
  return sentimentMap[sentiment] || sentiment;
};

/**
 * Format analysis status
 * @param analysedAt Analysis timestamp
 * @returns Status string
 */
export const formatAnalysisStatus = (analysedAt: Date | null): string => {
  if (!analysedAt) return 'Pending';
  return `Completed ${formatRelativeTime(analysedAt)}`;
};

/**
 * Format article summary for display
 * @param article Article object
 * @returns Formatted summary
 */
export const formatArticleSummary = (article: any) => {
  return {
    id: article.id,
    title: article.title,
    newsOutlet: article.newsOutlet,
    dateWritten: formatDate(article.dateWritten),
    sentiment: formatSentiment(article.sentimentGemini),
    category: article.categoryGemini || 'Uncategorized',
    summary: truncateText(article.summaryGemini || article.fullBodyText, 150),
    analysisStatus: formatAnalysisStatus(article.analysedAt),
    quoteCount: article.quotes?.length || 0
  };
};

/**
 * Format export data for Google Sheets
 * @param project Project data with articles and quotes
 * @returns Formatted data for export
 */
export const formatForExport = (project: any) => {
  return {
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt
    },
    articles: project.articles?.map((article: any) => ({
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
    quotes: project.articles?.flatMap((article: any) => 
      (article.quotes || []).map((quote: any) => ({
        id: quote.id,
        articleId: article.id,
        articleTitle: article.title,
        stakeholderName: quote.stakeholderNameGemini,
        stakeholderAffiliation: quote.stakeholderAffiliationGemini,
        quote: quote.quoteGemini
      }))
    ) || []
  };
};
