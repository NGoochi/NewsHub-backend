import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { globalErrorHandler, notFoundHandler } from "./utils/errorHandler";

// Import route modules
import projectsRouter from "./routes/projects";
import articlesRouter from "./routes/articles";
import quotesRouter from "./routes/quotes";
import analysisRouter from "./routes/analysis";
import settingsRouter from "./routes/settings";
import exportRouter from "./routes/export";
import importRouter from "./routes/import";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// Health check endpoint
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

// API routes
app.use("/projects", projectsRouter);
app.use("/articles", articlesRouter);
app.use("/quotes", quotesRouter);
app.use("/analysis", analysisRouter);
app.use("/settings", settingsRouter);
app.use("/export", exportRouter);
app.use("/import", importRouter);

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
