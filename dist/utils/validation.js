"use strict";
/**
 * Validation utilities for input data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePagination = exports.sanitizeString = exports.isValidUrl = exports.validateProjectData = exports.validateArticleData = exports.validateRequiredFields = exports.isValidDateString = exports.isValidEmail = exports.isValidUUID = void 0;
/**
 * Validate UUID format
 * @param id String to validate
 * @returns True if valid UUID
 */
const isValidUUID = (id) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
};
exports.isValidUUID = isValidUUID;
/**
 * Validate email format
 * @param email String to validate
 * @returns True if valid email
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
/**
 * Validate date string format (YYYY-MM-DD)
 * @param dateString String to validate
 * @returns True if valid date format
 */
const isValidDateString = (dateString) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString))
        return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
};
exports.isValidDateString = isValidDateString;
/**
 * Validate required fields in an object
 * @param obj Object to validate
 * @param requiredFields Array of required field names
 * @returns Object with validation result and missing fields
 */
const validateRequiredFields = (obj, requiredFields) => {
    const missingFields = requiredFields.filter(field => obj[field] === undefined || obj[field] === null || obj[field] === '');
    return {
        isValid: missingFields.length === 0,
        missingFields
    };
};
exports.validateRequiredFields = validateRequiredFields;
/**
 * Validate article data structure
 * @param article Article object to validate
 * @returns Validation result
 */
const validateArticleData = (article) => {
    const requiredFields = ['title'];
    const validation = (0, exports.validateRequiredFields)(article, requiredFields);
    if (!validation.isValid) {
        return {
            isValid: false,
            errors: [`Missing required fields: ${validation.missingFields.join(', ')}`]
        };
    }
    const errors = [];
    // Validate title length
    if (article.title && article.title.length > 500) {
        errors.push('Title must be 500 characters or less');
    }
    // Validate URL format if provided
    if (article.url && !(0, exports.isValidUrl)(article.url)) {
        errors.push('Invalid URL format');
    }
    // Validate authors array
    if (article.authors && !Array.isArray(article.authors)) {
        errors.push('Authors must be an array');
    }
    // Validate date format if provided
    if (article.dateWritten && !(0, exports.isValidDateString)(article.dateWritten)) {
        errors.push('Invalid date format. Use YYYY-MM-DD');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
exports.validateArticleData = validateArticleData;
/**
 * Validate project data structure
 * @param project Project object to validate
 * @returns Validation result
 */
const validateProjectData = (project) => {
    const requiredFields = ['name'];
    const validation = (0, exports.validateRequiredFields)(project, requiredFields);
    if (!validation.isValid) {
        return {
            isValid: false,
            errors: [`Missing required fields: ${validation.missingFields.join(', ')}`]
        };
    }
    const errors = [];
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
exports.validateProjectData = validateProjectData;
/**
 * Validate URL format
 * @param url String to validate
 * @returns True if valid URL
 */
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
};
exports.isValidUrl = isValidUrl;
/**
 * Sanitize string input
 * @param input String to sanitize
 * @returns Sanitized string
 */
const sanitizeString = (input) => {
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .substring(0, 1000); // Limit length
};
exports.sanitizeString = sanitizeString;
/**
 * Validate pagination parameters
 * @param page Page number
 * @param limit Items per page
 * @returns Validation result
 */
const validatePagination = (page, limit) => {
    const errors = [];
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
exports.validatePagination = validatePagination;
