/**
 * Validation utilities for input data
 */

/**
 * Validate UUID format
 * @param id String to validate
 * @returns True if valid UUID
 */
export const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * Validate email format
 * @param email String to validate
 * @returns True if valid email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate date string format (YYYY-MM-DD)
 * @param dateString String to validate
 * @returns True if valid date format
 */
export const isValidDateString = (dateString: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Validate required fields in an object
 * @param obj Object to validate
 * @param requiredFields Array of required field names
 * @returns Object with validation result and missing fields
 */
export const validateRequiredFields = (obj: any, requiredFields: string[]) => {
  const missingFields = requiredFields.filter(field => 
    obj[field] === undefined || obj[field] === null || obj[field] === ''
  );

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

/**
 * Validate article data structure
 * @param article Article object to validate
 * @returns Validation result
 */
export const validateArticleData = (article: any) => {
  const requiredFields = ['title'];
  const validation = validateRequiredFields(article, requiredFields);

  if (!validation.isValid) {
    return {
      isValid: false,
      errors: [`Missing required fields: ${validation.missingFields.join(', ')}`]
    };
  }

  const errors: string[] = [];

  // Validate title length
  if (article.title && article.title.length > 500) {
    errors.push('Title must be 500 characters or less');
  }

  // Validate URL format if provided
  if (article.url && !isValidUrl(article.url)) {
    errors.push('Invalid URL format');
  }

  // Validate authors array
  if (article.authors && !Array.isArray(article.authors)) {
    errors.push('Authors must be an array');
  }

  // Validate date format if provided
  if (article.dateWritten && !isValidDateString(article.dateWritten)) {
    errors.push('Invalid date format. Use YYYY-MM-DD');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate project data structure
 * @param project Project object to validate
 * @returns Validation result
 */
export const validateProjectData = (project: any) => {
  const requiredFields = ['name'];
  const validation = validateRequiredFields(project, requiredFields);

  if (!validation.isValid) {
    return {
      isValid: false,
      errors: [`Missing required fields: ${validation.missingFields.join(', ')}`]
    };
  }

  const errors: string[] = [];

  // Validate name length
  if (project.name && project.name.length > 200) {
    errors.push('Project name must be 200 characters or less');
  }

  // Validate description length
  if (project.description && project.description.length > 1000) {
    errors.push('Description must be 1000 characters or less');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate URL format
 * @param url String to validate
 * @returns True if valid URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Sanitize string input
 * @param input String to sanitize
 * @returns Sanitized string
 */
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
};

/**
 * Validate pagination parameters
 * @param page Page number
 * @param limit Items per page
 * @returns Validation result
 */
export const validatePagination = (page: any, limit: any) => {
  const errors: string[] = [];

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (isNaN(pageNum) || pageNum < 1) {
    errors.push('Page must be a positive integer');
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    errors.push('Limit must be between 1 and 100');
  }

  return {
    isValid: errors.length === 0,
    errors,
    page: pageNum || 1,
    limit: limitNum || 10
  };
};
