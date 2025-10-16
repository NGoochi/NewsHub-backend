"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteArticle = exports.updateArticle = exports.getArticleById = exports.getArticlesByProject = exports.getAllArticles = exports.importArticles = exports.createArticle = void 0;
const db_1 = __importDefault(require("../lib/db"));
// import { importFromNewsAPI } from "../lib/newsapi";
const validation_1 = require("../utils/validation");
/**
 * Create a new article manually
 * POST /articles
 */
const createArticle = async (req, res) => {
    try {
        const { projectId, title, newsOutlet, authors, url, fullBodyText, dateWritten, inputMethod } = req.body;
        // Validate required fields
        const requiredValidation = (0, validation_1.validateRequiredFields)(req.body, ['projectId', 'title']);
        if (!requiredValidation.isValid) {
            return res.status(400).json({
                success: false,
                error: `Missing required fields: ${requiredValidation.missingFields.join(', ')}`
            });
        }
        // Validate UUID format
        if (!(0, validation_1.isValidUUID)(projectId)) {
            return res.status(400).json({
                success: false,
                error: "Invalid project ID format"
            });
        }
        // Validate article data
        const validation = (0, validation_1.validateArticleData)(req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: validation.errors.join(', ')
            });
        }
        // Verify project exists
        const project = await db_1.default.project.findUnique({
            where: { id: projectId }
        });
        if (!project) {
            return res.status(404).json({
                success: false,
                error: "Project not found"
            });
        }
        const article = await db_1.default.article.create({
            data: {
                projectId,
                title,
                newsOutlet,
                authors: authors || [],
                url,
                fullBodyText,
                dateWritten: dateWritten ? new Date(dateWritten) : null,
                inputMethod: inputMethod || 'manual'
            },
            include: {
                project: true,
                quotes: true
            }
        });
        res.status(201).json({
            success: true,
            data: article,
            error: null
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to create article"
        });
    }
};
exports.createArticle = createArticle;
/**
 * Import articles from NewsAPI
 * POST /articles/import
 * NOTE: This function is deprecated - use /import/start instead
 */
const importArticles = async (req, res) => {
    res.status(410).json({
        success: false,
        error: "This endpoint is deprecated. Please use /import/start instead."
    });
};
exports.importArticles = importArticles;
/**
 * Get all articles
 * GET /articles
 */
const getAllArticles = async (req, res) => {
    try {
        const articles = await db_1.default.article.findMany({
            include: {
                project: true,
                quotes: true
            },
            orderBy: { dateWritten: 'desc' }
        });
        res.json({
            success: true,
            data: articles,
            error: null
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to fetch articles"
        });
    }
};
exports.getAllArticles = getAllArticles;
/**
 * Get articles by project ID
 * GET /articles/project/:projectId
 */
const getArticlesByProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        // First check if project exists and is not archived
        const project = await db_1.default.project.findUnique({
            where: { id: projectId }
        });
        if (!project) {
            return res.status(404).json({
                success: false,
                error: "Project not found"
            });
        }
        if (project.archived) {
            return res.status(403).json({
                success: false,
                error: "Cannot access articles from archived project"
            });
        }
        const articles = await db_1.default.article.findMany({
            where: { projectId },
            include: {
                quotes: true
            },
            orderBy: { dateWritten: 'desc' }
        });
        res.json({
            success: true,
            data: articles,
            error: null
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to fetch articles"
        });
    }
};
exports.getArticlesByProject = getArticlesByProject;
/**
 * Get a specific article by ID
 * GET /articles/:id
 */
const getArticleById = async (req, res) => {
    try {
        const { id } = req.params;
        const article = await db_1.default.article.findUnique({
            where: { id },
            include: {
                project: true,
                quotes: true
            }
        });
        if (!article) {
            return res.status(404).json({
                success: false,
                error: "Article not found"
            });
        }
        // Check if parent project is archived
        if (article.project.archived) {
            return res.status(403).json({
                success: false,
                error: "Cannot access article from archived project"
            });
        }
        res.json({
            success: true,
            data: article,
            error: null
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to fetch article"
        });
    }
};
exports.getArticleById = getArticleById;
/**
 * Update an existing article
 * PUT /articles/:id
 */
const updateArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const article = await db_1.default.article.update({
            where: { id },
            data: updateData,
            include: {
                project: true,
                quotes: true
            }
        });
        res.json({
            success: true,
            data: article,
            error: null
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to update article"
        });
    }
};
exports.updateArticle = updateArticle;
/**
 * Delete an article and all associated quotes
 * DELETE /articles/:id
 */
const deleteArticle = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.article.delete({
            where: { id }
        });
        res.json({
            success: true,
            data: { message: "Article deleted successfully" },
            error: null
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to delete article"
        });
    }
};
exports.deleteArticle = deleteArticle;
