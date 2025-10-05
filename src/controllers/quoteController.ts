import { Request, Response } from "express";
import prisma from "../lib/db";
import { validateRequiredFields, isValidUUID } from "../utils/validation";

/**
 * Create a new quote
 * POST /quotes
 */
export const createQuote = async (req: Request, res: Response) => {
  try {
    const { articleId, stakeholderNameGemini, stakeholderAffiliationGemini, quoteGemini } = req.body;

    // Validate required fields
    const requiredValidation = validateRequiredFields(req.body, ['articleId', 'quoteGemini']);
    if (!requiredValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${requiredValidation.missingFields.join(', ')}`
      });
    }

    // Validate UUID format
    if (!isValidUUID(articleId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid article ID format"
      });
    }

    // Verify article exists
    const article = await prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        error: "Article not found"
      });
    }

    const quote = await prisma.quote.create({
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
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to create quote"
    });
  }
};

/**
 * Get all quotes
 * GET /quotes
 */
export const getAllQuotes = async (req: Request, res: Response) => {
  try {
    const quotes = await prisma.quote.findMany({
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
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch quotes"
    });
  }
};

/**
 * Get quotes by article ID
 * GET /quotes/article/:articleId
 */
export const getQuotesByArticle = async (req: Request, res: Response) => {
  try {
    const { articleId } = req.params;

    const quotes = await prisma.quote.findMany({
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
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch quotes"
    });
  }
};

/**
 * Get a specific quote by ID
 * GET /quotes/:id
 */
export const getQuoteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const quote = await prisma.quote.findUnique({
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
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch quote"
    });
  }
};

/**
 * Update an existing quote
 * PUT /quotes/:id
 */
export const updateQuote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const quote = await prisma.quote.update({
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
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to update quote"
    });
  }
};

/**
 * Delete a quote
 * DELETE /quotes/:id
 */
export const deleteQuote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.quote.delete({
      where: { id }
    });

    res.json({
      success: true,
      data: { message: "Quote deleted successfully" },
      error: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to delete quote"
    });
  }
};
