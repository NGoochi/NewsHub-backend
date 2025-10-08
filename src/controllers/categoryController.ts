import { Request, Response } from 'express';
import db from '../lib/db';
import { clearPromptCache } from '../lib/gemini';
import { validateRequiredFields, isValidUUID } from '../utils/validation';

/**
 * Get all categories
 * GET /categories
 */
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const { includeInactive } = req.query;
    
    const categories = await db.category.findMany({
      where: includeInactive === 'true' ? {} : { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });

    res.json({
      success: true,
      data: categories,
      error: null
    });
  } catch (error: any) {
    console.error('Get all categories error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch categories'
    });
  }
};

/**
 * Get category by ID
 * GET /categories/:id
 */
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID format'
      });
    }

    const category = await db.category.findUnique({
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
  } catch (error: any) {
    console.error('Get category by ID error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch category'
    });
  }
};

/**
 * Create new category
 * POST /categories
 */
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, definition, keywords, sortOrder } = req.body;

    // Validate required fields
    const validation = validateRequiredFields(
      { name, definition },
      ['name', 'definition']
    );
    
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
    const existing = await db.category.findUnique({
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
      const maxCategory = await db.category.findFirst({
        orderBy: { sortOrder: 'desc' }
      });
      finalSortOrder = maxCategory ? maxCategory.sortOrder + 1 : 0;
    }

    const category = await db.category.create({
      data: {
        name,
        definition,
        keywords: keywords || [],
        sortOrder: finalSortOrder,
        isActive: true
      }
    });

    // Clear cache so new category is immediately available
    clearPromptCache();

    res.status(201).json({
      success: true,
      data: category,
      error: null
    });
  } catch (error: any) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create category'
    });
  }
};

/**
 * Update category
 * PUT /categories/:id
 */
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, definition, keywords, sortOrder, isActive } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID format'
      });
    }

    // Check if category exists
    const existing = await db.category.findUnique({
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
      const nameConflict = await db.category.findUnique({
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

    const category = await db.category.update({
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
    clearPromptCache();

    res.json({
      success: true,
      data: category,
      error: null
    });
  } catch (error: any) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update category'
    });
  }
};

/**
 * Delete category (soft delete - set isActive to false)
 * DELETE /categories/:id
 */
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category ID format'
      });
    }

    const existing = await db.category.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Soft delete by setting isActive to false
    await db.category.update({
      where: { id },
      data: { isActive: false }
    });

    // Clear cache
    clearPromptCache();

    res.json({
      success: true,
      data: { message: 'Category deactivated successfully' },
      error: null
    });
  } catch (error: any) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete category'
    });
  }
};

/**
 * Reorder categories
 * PUT /categories/reorder
 */
export const reorderCategories = async (req: Request, res: Response) => {
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
      if (!item.id || !isValidUUID(item.id)) {
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
    await db.$transaction(
      categoryOrders.map((item: { id: string; sortOrder: number }) =>
        db.category.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder }
        })
      )
    );

    // Clear cache
    clearPromptCache();

    res.json({
      success: true,
      data: { message: 'Categories reordered successfully' },
      error: null
    });
  } catch (error: any) {
    console.error('Reorder categories error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reorder categories'
    });
  }
};
