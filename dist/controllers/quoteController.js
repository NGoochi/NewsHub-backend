"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteQuote = exports.updateQuote = exports.getQuoteById = exports.getQuotesByArticle = exports.getAllQuotes = exports.createQuote = void 0;
const db_1 = __importDefault(require("../lib/db"));
const validation_1 = require("../utils/validation");
/**
 * Create a new quote
 * POST /quotes
 */
const createQuote = async (req, res) => {
    try {
        const { articleId, stakeholderNameGemini, stakeholderAffiliationGemini, quoteGemini } = req.body;
        // Validate required fields
        const requiredValidation = (0, validation_1.validateRequiredFields)(req.body, ['articleId', 'quoteGemini']);
        if (!requiredValidation.isValid) {
            return res.status(400).json({
                success: false,
                error: `Missing required fields: ${requiredValidation.missingFields.join(', ')}`
            });
        }
        // Validate UUID format
        if (!(0, validation_1.isValidUUID)(articleId)) {
            return res.status(400).json({
                success: false,
                error: "Invalid article ID format"
            });
        }
        // Verify article exists
        const article = await db_1.default.article.findUnique({
            where: { id: articleId }
        });
        if (!article) {
            return res.status(404).json({
                success: false,
                error: "Article not found"
            });
        }
        const quote = await db_1.default.quote.create({
            data: {
                articleId,
                stakeholderNameGemini,
                stakeholderAffiliationGemini,
                quoteGemini
            },
            include: {
                article: {
                    include: {
                        project: true
                    }
                }
            }
        });
        res.status(201).json({
            success: true,
            data: quote,
            error: null
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to create quote"
        });
    }
};
exports.createQuote = createQuote;
/**
 * Get all quotes
 * GET /quotes
 */
const getAllQuotes = async (req, res) => {
    try {
        const quotes = await db_1.default.quote.findMany({
            include: {
                article: {
                    include: {
                        project: true
                    }
                }
            },
            orderBy: { id: 'desc' }
        });
        res.json({
            success: true,
            data: quotes,
            error: null
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to fetch quotes"
        });
    }
};
exports.getAllQuotes = getAllQuotes;
/**
 * Get quotes by article ID
 * GET /quotes/article/:articleId
 */
const getQuotesByArticle = async (req, res) => {
    try {
        const { articleId } = req.params;
        const quotes = await db_1.default.quote.findMany({
            where: { articleId },
            include: {
                article: {
                    include: {
                        project: true
                    }
                }
            },
            orderBy: { id: 'desc' }
        });
        res.json({
            success: true,
            data: quotes,
            error: null
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to fetch quotes"
        });
    }
};
exports.getQuotesByArticle = getQuotesByArticle;
/**
 * Get a specific quote by ID
 * GET /quotes/:id
 */
const getQuoteById = async (req, res) => {
    try {
        const { id } = req.params;
        const quote = await db_1.default.quote.findUnique({
            where: { id },
            include: {
                article: {
                    include: {
                        project: true
                    }
                }
            }
        });
        if (!quote) {
            return res.status(404).json({
                success: false,
                error: "Quote not found"
            });
        }
        res.json({
            success: true,
            data: quote,
            error: null
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to fetch quote"
        });
    }
};
exports.getQuoteById = getQuoteById;
/**
 * Update an existing quote
 * PUT /quotes/:id
 */
const updateQuote = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const quote = await db_1.default.quote.update({
            where: { id },
            data: updateData,
            include: {
                article: {
                    include: {
                        project: true
                    }
                }
            }
        });
        res.json({
            success: true,
            data: quote,
            error: null
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to update quote"
        });
    }
};
exports.updateQuote = updateQuote;
/**
 * Delete a quote
 * DELETE /quotes/:id
 */
const deleteQuote = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.quote.delete({
            where: { id }
        });
        res.json({
            success: true,
            data: { message: "Quote deleted successfully" },
            error: null
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to delete quote"
        });
    }
};
exports.deleteQuote = deleteQuote;
