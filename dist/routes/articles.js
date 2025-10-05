"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const articleController_1 = require("../controllers/articleController");
const router = express_1.default.Router();
/**
 * POST /articles
 * Create a new article manually
 */
router.post("/", articleController_1.createArticle);
/**
 * POST /articles/import
 * Import articles from NewsAPI
 */
router.post("/import", articleController_1.importArticles);
/**
 * GET /articles
 * Retrieve all articles
 */
router.get("/", articleController_1.getAllArticles);
/**
 * GET /articles/project/:projectId
 * Retrieve all articles for a specific project
 */
router.get("/project/:projectId", articleController_1.getArticlesByProject);
/**
 * GET /articles/:id
 * Retrieve a specific article by ID
 */
router.get("/:id", articleController_1.getArticleById);
/**
 * PUT /articles/:id
 * Update an existing article
 */
router.put("/:id", articleController_1.updateArticle);
/**
 * DELETE /articles/:id
 * Delete an article and all associated quotes
 */
router.delete("/:id", articleController_1.deleteArticle);
exports.default = router;
