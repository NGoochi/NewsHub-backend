import express from "express";
import {
  createQuote,
  getAllQuotes,
  getQuoteById,
  getQuotesByArticle,
  updateQuote,
  deleteQuote
} from "../controllers/quoteController";

const router = express.Router();

/**
 * POST /quotes
 * Create a new quote
 */
router.post("/", createQuote);

/**
 * GET /quotes
 * Retrieve all quotes
 */
router.get("/", getAllQuotes);

/**
 * GET /quotes/article/:articleId
 * Retrieve all quotes for a specific article
 */
router.get("/article/:articleId", getQuotesByArticle);

/**
 * GET /quotes/:id
 * Retrieve a specific quote by ID
 */
router.get("/:id", getQuoteById);

/**
 * PUT /quotes/:id
 * Update an existing quote
 */
router.put("/:id", updateQuote);

/**
 * DELETE /quotes/:id
 * Delete a quote
 */
router.delete("/:id", deleteQuote);

export default router;
