"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const errorHandler_1 = require("./utils/errorHandler");
const auth_1 = require("./middleware/auth");
// Import route modules
const auth_2 = __importDefault(require("./routes/auth"));
const projects_1 = __importDefault(require("./routes/projects"));
const articles_1 = __importDefault(require("./routes/articles"));
const quotes_1 = __importDefault(require("./routes/quotes"));
const analysis_1 = __importDefault(require("./routes/analysis"));
const settings_1 = __importDefault(require("./routes/settings"));
const export_1 = __importDefault(require("./routes/export"));
const import_1 = __importDefault(require("./routes/import"));
const categories_1 = __importDefault(require("./routes/categories"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files
app.use(express_1.default.static('public'));
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
app.use("/api/auth", auth_2.default);
// Protected API routes (require authentication)
app.use("/api/projects", auth_1.authenticateToken, projects_1.default);
app.use("/api/articles", auth_1.authenticateToken, articles_1.default);
app.use("/api/quotes", auth_1.authenticateToken, quotes_1.default);
app.use("/api/analysis", auth_1.authenticateToken, analysis_1.default);
app.use("/api/settings", auth_1.authenticateToken, settings_1.default);
app.use("/api/export", auth_1.authenticateToken, export_1.default);
app.use("/api/import", auth_1.authenticateToken, import_1.default);
app.use("/api/categories", auth_1.authenticateToken, categories_1.default);
// 404 handler
app.use(errorHandler_1.notFoundHandler);
// Global error handler
app.use(errorHandler_1.globalErrorHandler);
// Start server
app.listen(PORT, () => {
    console.log(`✅ NewsHub API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/`);
    console.log(`📚 API Documentation: Check routes in src/routes/`);
});
