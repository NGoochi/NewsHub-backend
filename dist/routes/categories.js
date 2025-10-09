"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const categoryController_1 = require("../controllers/categoryController");
const router = express_1.default.Router();
/**
 * GET /categories
 * Get all categories (active by default, or includeInactive=true for all)
 */
router.get('/', categoryController_1.getAllCategories);
/**
 * GET /categories/:id
 * Get a specific category by ID
 */
router.get('/:id', categoryController_1.getCategoryById);
/**
 * POST /categories
 * Create a new category
 */
router.post('/', categoryController_1.createCategory);
/**
 * PUT /categories/:id
 * Update an existing category
 */
router.put('/:id', categoryController_1.updateCategory);
/**
 * DELETE /categories/:id
 * Soft delete a category (set isActive = false)
 */
router.delete('/:id', categoryController_1.deleteCategory);
/**
 * PUT /categories/reorder
 * Batch update sortOrder for multiple categories
 */
router.put('/reorder', categoryController_1.reorderCategories);
exports.default = router;
