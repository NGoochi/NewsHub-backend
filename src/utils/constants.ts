/**
 * Application constants and configuration
 */

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
} as const;

/**
 * Analysis job statuses
 */
export const JOB_STATUS = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

/**
 * Article input methods
 */
export const INPUT_METHOD = {
  NEWSAPI: 'newsapi',
  MANUAL: 'manual',
  CSV: 'csv'
} as const;

/**
 * Sentiment values
 */
export const SENTIMENT = {
  POSITIVE: 'positive',
  NEUTRAL: 'neutral',
  NEGATIVE: 'negative'
} as const;

/**
 * Default article categories
 */
export const DEFAULT_CATEGORIES = [
  'Politics',
  'Business',
  'Technology',
  'Health',
  'Sports',
  'Entertainment',
  'Science',
  'World News'
] as const;

/**
 * API configuration
 */
export const API_CONFIG = {
  MAX_BATCH_SIZE: 10,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  REQUEST_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
} as const;

/**
 * Database configuration
 */
export const DB_CONFIG = {
  MAX_CONNECTIONS: 10,
  CONNECTION_TIMEOUT: 30000,
  QUERY_TIMEOUT: 30000
} as const;

/**
 * Worker configuration
 */
export const WORKER_CONFIG = {
  DEFAULT_INTERVAL: 30000, // 30 seconds
  MAX_CONCURRENT_JOBS: 5,
  BATCH_SIZE: 10,
  CLEANUP_INTERVAL: 3600000 // 1 hour
} as const;

/**
 * Export configuration
 */
export const EXPORT_CONFIG = {
  MAX_ARTICLES_PER_EXPORT: 1000,
  MAX_QUOTES_PER_EXPORT: 5000,
  EXPORT_TIMEOUT: 300000, // 5 minutes
  SHEET_NAME_ARTICLES: 'Articles',
  SHEET_NAME_QUOTES: 'Quotes'
} as const;

/**
 * Validation limits
 */
export const VALIDATION_LIMITS = {
  PROJECT_NAME_MAX: 200,
  PROJECT_DESCRIPTION_MAX: 1000,
  ARTICLE_TITLE_MAX: 500,
  ARTICLE_BODY_MAX: 50000,
  QUOTE_MAX: 2000,
  AUTHOR_NAME_MAX: 100,
  STAKEHOLDER_NAME_MAX: 100,
  STAKEHOLDER_AFFILIATION_MAX: 200
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  PROJECT_NOT_FOUND: 'Project not found',
  ARTICLE_NOT_FOUND: 'Article not found',
  QUOTE_NOT_FOUND: 'Quote not found',
  INVALID_ID: 'Invalid ID format',
  MISSING_REQUIRED_FIELD: 'Missing required field',
  INVALID_DATE_FORMAT: 'Invalid date format',
  INVALID_URL_FORMAT: 'Invalid URL format',
  API_KEY_MISSING: 'API key not configured',
  EXTERNAL_API_ERROR: 'External API request failed',
  DATABASE_ERROR: 'Database operation failed',
  VALIDATION_ERROR: 'Validation failed',
  UNAUTHORIZED: 'Unauthorized access',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  FILE_TOO_LARGE: 'File too large',
  UNSUPPORTED_FILE_TYPE: 'Unsupported file type'
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  PROJECT_CREATED: 'Project created successfully',
  PROJECT_UPDATED: 'Project updated successfully',
  PROJECT_DELETED: 'Project deleted successfully',
  ARTICLE_IMPORTED: 'Articles imported successfully',
  ARTICLE_UPDATED: 'Article updated successfully',
  ARTICLE_DELETED: 'Article deleted successfully',
  QUOTE_CREATED: 'Quote created successfully',
  QUOTE_UPDATED: 'Quote updated successfully',
  QUOTE_DELETED: 'Quote deleted successfully',
  ANALYSIS_STARTED: 'Analysis started successfully',
  ANALYSIS_COMPLETED: 'Analysis completed successfully',
  EXPORT_COMPLETED: 'Export completed successfully',
  SETTINGS_UPDATED: 'Settings updated successfully'
} as const;

/**
 * Environment variables
 */
export const ENV_VARS = {
  DATABASE_URL: 'DATABASE_URL',
  NEWS_API_KEY: 'NEWS_API_KEY',
  GEMINI_API_KEY: 'GEMINI_API_KEY',
  GOOGLE_CLIENT_ID: 'GOOGLE_CLIENT_ID',
  GOOGLE_CLIENT_SECRET: 'GOOGLE_CLIENT_SECRET',
  GOOGLE_REFRESH_TOKEN: 'GOOGLE_REFRESH_TOKEN',
  NODE_ENV: 'NODE_ENV',
  PORT: 'PORT'
} as const;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  HEALTH: '/',
  PROJECTS: '/projects',
  ARTICLES: '/articles',
  QUOTES: '/quotes',
  ANALYSIS: '/analysis',
  SETTINGS: '/settings',
  EXPORT: '/export'
} as const;
