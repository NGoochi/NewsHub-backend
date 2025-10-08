import express from 'express';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories
} from '../controllers/categoryController';

const router = express.Router();

/**
 * GET /categories
 * Get all categories (active by default, or includeInactive=true for all)
 */
router.get('/', getAllCategories);

/**
 * GET /categories/:id
 * Get a specific category by ID
 */
router.get('/:id', getCategoryById);

/**
 * POST /categories
 * Create a new category
 */
router.post('/', createCategory);

/**
 * PUT /categories/:id
 * Update an existing category
 */
router.put('/:id', updateCategory);

/**
 * DELETE /categories/:id
 * Soft delete a category (set isActive = false)
 */
router.delete('/:id', deleteCategory);

/**
 * PUT /categories/reorder
 * Batch update sortOrder for multiple categories
 */
router.put('/reorder', reorderCategories);

export default router;
