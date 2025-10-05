import express from "express";
import {
  createArticle,
  importArticles,
  getAllArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  getArticlesByProject
} from "../controllers/articleController";

const router = express.Router();

/**
 * POST /articles
 * Create a new article manually
 */
router.post("/", createArticle);

/**
 * POST /articles/import
 * Import articles from NewsAPI
 */
router.post("/import", importArticles);

/**
 * GET /articles
 * Retrieve all articles
 */
router.get("/", getAllArticles);

/**
 * GET /articles/project/:projectId
 * Retrieve all articles for a specific project
 */
router.get("/project/:projectId", getArticlesByProject);

/**
 * GET /articles/:id
 * Retrieve a specific article by ID
 */
router.get("/:id", getArticleById);

/**
 * PUT /articles/:id
 * Update an existing article
 */
router.put("/:id", updateArticle);

/**
 * DELETE /articles/:id
 * Delete an article and all associated quotes
 */
router.delete("/:id", deleteArticle);

export default router;
