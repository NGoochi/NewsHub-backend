"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const quoteController_1 = require("../controllers/quoteController");
const router = express_1.default.Router();
/**
 * POST /quotes
 * Create a new quote
 */
router.post("/", quoteController_1.createQuote);
/**
 * GET /quotes
 * Retrieve all quotes
 */
router.get("/", quoteController_1.getAllQuotes);
/**
 * GET /quotes/article/:articleId
 * Retrieve all quotes for a specific article
 */
router.get("/article/:articleId", quoteController_1.getQuotesByArticle);
/**
 * GET /quotes/:id
 * Retrieve a specific quote by ID
 */
router.get("/:id", quoteController_1.getQuoteById);
/**
 * PUT /quotes/:id
 * Update an existing quote
 */
router.put("/:id", quoteController_1.updateQuote);
/**
 * DELETE /quotes/:id
 * Delete a quote
 */
router.delete("/:id", quoteController_1.deleteQuote);
exports.default = router;
