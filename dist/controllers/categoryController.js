"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderCategories = exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategoryById = exports.getAllCategories = void 0;
const db_1 = __importDefault(require("../lib/db"));
const gemini_1 = require("../lib/gemini");
const validation_1 = require("../utils/validation");
/**
 * Get all categories
 * GET /categories
 */
const getAllCategories = async (req, res) => {
    try {
        const { includeInactive } = req.query;
        const categories = await db_1.default.category.findMany({
            where: includeInactive === 'true' ? {} : { isActive: true },
            orderBy: { sortOrder: 'asc' }
        });
        res.json({
            success: true,
            data: categories,
            error: null
        });
    }
    catch (error) {
        console.error('Get all categories error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch categories'
        });
    }
};
exports.getAllCategories = getAllCategories;
/**
 * Get category by ID
 * GET /categories/:id
 */
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!(0, validation_1.isValidUUID)(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid category ID format'
            });
        }
        const category = await db_1.default.category.findUnique({
            where: { id }
        });
        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }
        res.json({
            success: true,
            data: category,
            error: null
        });
    }
    catch (error) {
        console.error('Get category by ID error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch category'
        });
    }
};
exports.getCategoryById = getCategoryById;
/**
 * Create new category
 * POST /categories
 */
const createCategory = async (req, res) => {
    try {
        const { name, definition, keywords, sortOrder } = req.body;
        // Validate required fields
        const validation = (0, validation_1.validateRequiredFields)({ name, definition }, ['name', 'definition']);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: `Missing required fields: ${validation.missingFields.join(', ')}`
            });
        }
        // Validate keywords is an array
        if (keywords && !Array.isArray(keywords)) {
            return res.status(400).json({
                success: false,
                error: 'Keywords must be an array'
            });
        }
        // Check if category with same name already exists
        const existing = await db_1.default.category.findUnique({
            where: { name }
        });
        if (existing) {
            return res.status(409).json({
                success: false,
                error: 'Category with this name already exists'
            });
        }
        // Get max sortOrder if not provided
        let finalSortOrder = sortOrder;
        if (finalSortOrder === undefined) {
            const maxCategory = await db_1.default.category.findFirst({
                orderBy: { sortOrder: 'desc' }
            });
            finalSortOrder = maxCategory ? maxCategory.sortOrder + 1 : 0;
        }
        const category = await db_1.default.category.create({
            data: {
                name,
                definition,
                keywords: keywords || [],
                sortOrder: finalSortOrder,
                isActive: true
            }
        });
        // Clear cache so new category is immediately available
        (0, gemini_1.clearPromptCache)();
        res.status(201).json({
            success: true,
            data: category,
            error: null
        });
    }
    catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create category'
        });
    }
};
exports.createCategory = createCategory;
/**
 * Update category
 * PUT /categories/:id
 */
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, definition, keywords, sortOrder, isActive } = req.body;
        if (!(0, validation_1.isValidUUID)(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid category ID format'
            });
        }
        // Check if category exists
        const existing = await db_1.default.category.findUnique({
            where: { id }
        });
        if (!existing) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }
        // If name is being changed, check for conflicts
        if (name && name !== existing.name) {
            const nameConflict = await db_1.default.category.findUnique({
                where: { name }
            });
            if (nameConflict) {
                return res.status(409).json({
                    success: false,
                    error: 'Category with this name already exists'
                });
            }
        }
        // Validate keywords is an array if provided
        if (keywords && !Array.isArray(keywords)) {
            return res.status(400).json({
                success: false,
                error: 'Keywords must be an array'
            });
        }
        const category = await db_1.default.category.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(definition !== undefined && { definition }),
                ...(keywords !== undefined && { keywords }),
                ...(sortOrder !== undefined && { sortOrder }),
                ...(isActive !== undefined && { isActive })
            }
        });
        // Clear cache so changes are reflected immediately
        (0, gemini_1.clearPromptCache)();
        res.json({
            success: true,
            data: category,
            error: null
        });
    }
    catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to update category'
        });
    }
};
exports.updateCategory = updateCategory;
/**
 * Delete category (soft delete - set isActive to false)
 * DELETE /categories/:id
 */
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        if (!(0, validation_1.isValidUUID)(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid category ID format'
            });
        }
        const existing = await db_1.default.category.findUnique({
            where: { id }
        });
        if (!existing) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }
        // Soft delete by setting isActive to false
        await db_1.default.category.update({
            where: { id },
            data: { isActive: false }
        });
        // Clear cache
        (0, gemini_1.clearPromptCache)();
        res.json({
            success: true,
            data: { message: 'Category deactivated successfully' },
            error: null
        });
    }
    catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to delete category'
        });
    }
};
exports.deleteCategory = deleteCategory;
/**
 * Reorder categories
 * PUT /categories/reorder
 */
const reorderCategories = async (req, res) => {
    try {
        const { categoryOrders } = req.body;
        // Validate input
        if (!Array.isArray(categoryOrders)) {
            return res.status(400).json({
                success: false,
                error: 'categoryOrders must be an array of {id, sortOrder} objects'
            });
        }
        // Validate each item
        for (const item of categoryOrders) {
            if (!item.id || !(0, validation_1.isValidUUID)(item.id)) {
                return res.status(400).json({
                    success: false,
                    error: 'Each item must have a valid UUID id'
                });
            }
            if (typeof item.sortOrder !== 'number') {
                return res.status(400).json({
                    success: false,
                    error: 'Each item must have a numeric sortOrder'
                });
            }
        }
        // Update all categories in a transaction
        await db_1.default.$transaction(categoryOrders.map((item) => db_1.default.category.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder }
        })));
        // Clear cache
        (0, gemini_1.clearPromptCache)();
        res.json({
            success: true,
            data: { message: 'Categories reordered successfully' },
            error: null
        });
    }
    catch (error) {
        console.error('Reorder categories error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to reorder categories'
        });
    }
};
exports.reorderCategories = reorderCategories;
