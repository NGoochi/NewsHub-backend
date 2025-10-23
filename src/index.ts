import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { globalErrorHandler, notFoundHandler } from "./utils/errorHandler";
import { authenticateToken } from "./middleware/auth";

// Load environment variables explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Import route modules
import authRouter from "./routes/auth";
import projectsRouter from "./routes/projects";
import articlesRouter from "./routes/articles";
import quotesRouter from "./routes/quotes";
import analysisRouter from "./routes/analysis";
import settingsRouter from "./routes/settings";
import exportRouter from "./routes/export";
import importRouter from "./routes/import";
import categoriesRouter from "./routes/categories";
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// Health check endpoint (public)
app.get("/", (_, res) => {
  res.json({
    success: true,
    data: {
      message: "NewsHub API running!",
      version: "1.0.0",
      timestamp: new Date().toISOString()
    },
    error: null
  });
});

// Auth routes (public)
app.use("/auth", authRouter);

// Protected API routes (require authentication)
app.use("/projects", authenticateToken, projectsRouter);
app.use("/articles", authenticateToken, articlesRouter);
app.use("/quotes", authenticateToken, quotesRouter);
app.use("/analysis", authenticateToken, analysisRouter);
app.use("/settings", authenticateToken, settingsRouter);
app.use("/export", authenticateToken, exportRouter);
app.use("/import", authenticateToken, importRouter);
app.use("/categories", authenticateToken, categoriesRouter);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`✅ NewsHub API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/`);
  console.log(`📚 API Documentation: Check routes in src/routes/`);
});
