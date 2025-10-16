# NewsHub API

A server-based application that retrieves, analyses, and organises news articles from external APIs, producing structured insights about sentiment, categories, and stakeholder quotes.

## Features

- **Search**: Retrieve and catalogue news articles via NewsAPI
- **Analysis**: Run AI-powered analysis through Gemini to extract summaries, sentiment, categories, and quotes
- **Export**: Output analysed datasets to Google Sheets for further study
- **Project Management**: Organize articles into projects for focused analysis

## Tech Stack

- **Backend**: Express (TypeScript)
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Hosting**: Render
- **Integrations**: NewsAPI, Gemini API, Google Sheets API

## Project Structure

```
src/
├── index.ts                 # Entry point / server setup
├── routes/                  # Express routes
│   ├── projects.ts         # Project management endpoints
│   ├── articles.ts         # Article CRUD endpoints
│   ├── quotes.ts           # Quote CRUD endpoints
│   ├── import.ts           # Import workflow endpoints
│   ├── analysis.ts         # Analysis batch endpoints
│   ├── categories.ts       # Category management endpoints
│   ├── settings.ts         # Settings and configuration
│   └── export.ts           # Google Sheets export
├── controllers/             # Business logic for routes
│   ├── projectController.ts
│   ├── articleController.ts
│   ├── quoteController.ts
│   ├── importController.ts # Import workflow coordination
│   ├── analysisController.ts
│   ├── categoryController.ts
│   ├── settingsController.ts
│   └── exportController.ts
├── lib/                     # External API helpers
│   ├── db.ts               # Prisma client instance
│   ├── newsapi.ts          # NewsAPI integration
│   ├── gemini.ts           # Gemini analysis with context caching
│   ├── sheets.ts           # Google Sheets export
│   ├── importService.ts    # Import service coordination
│   ├── importSession.ts    # Import session management
│   ├── analysisBatch.ts    # Analysis batch processing
│   └── pdfExtractor.ts     # PDF content extraction
├── jobs/                    # Background processing
│   ├── queue.ts            # Job queue manager
│   └── worker.ts           # Background processor
├── middleware/              # Express middleware
│   └── upload.ts           # File upload handling
└── utils/                   # Helper modules
    ├── validation.ts        # Input validation
    ├── formatters.ts       # Data formatting
    ├── errorHandler.ts     # Error handling
    └── constants.ts         # Application constants
```

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment variables**:
   Create a `.env` file with the following variables:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/newshub"
   NEWS_API_KEY="your_newsapi_key_here"
   GEMINI_API_KEY="your_gemini_api_key_here"
   GOOGLE_CLIENT_ID="your_google_client_id"
   GOOGLE_CLIENT_SECRET="your_google_client_secret"
   GOOGLE_REFRESH_TOKEN="your_google_refresh_token"
   PORT=8080
   NODE_ENV=development
   GEMINI_CONTEXT_TTL="3600s"
   GEMINI_BATCH_SIZE=10
   ```

3. **Database setup**:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

## API Endpoints

### Projects
- `GET /projects` - List all projects
- `POST /projects` - Create a new project
- `GET /projects/:id` - Get project by ID
- `PUT /projects/:id` - Update project
- `PUT /projects/:id/archive` - Archive a project
- `PUT /projects/:id/unarchive` - Unarchive a project
- `POST /projects/bulk-archive` - Bulk archive multiple projects
- `POST /projects/bulk-unarchive` - Bulk unarchive multiple projects
- `DELETE /projects/:id` - Delete project (only if archived)

### Articles
- `GET /articles` - List all articles
- `POST /articles` - Create a new article manually
- `GET /articles/project/:projectId` - Get articles by project
- `GET /articles/:id` - Get article by ID
- `PUT /articles/:id` - Update article
- `DELETE /articles/:id` - Delete article

### Import
- `POST /import/preview` - Preview import from NewsAPI
- `POST /import/start` - Start import session
- `POST /import/newsapi` - Import articles from NewsAPI
- `POST /import/pdf` - Import articles from PDF upload
- `POST /import/manual` - Import articles manually
- `GET /import/session/:sessionId` - Get import session status
- `POST /import/session/:sessionId/cancel` - Cancel import session
- `GET /import/project/:projectId/sessions` - Get project import sessions
- `GET /import/project/:projectId/stats` - Get project import statistics
- `GET /import/sources` - Get available search sources
- `GET /import/countries` - Get available countries
- `GET /import/languages` - Get available languages

### Quotes
- `GET /quotes` - List all quotes
- `POST /quotes` - Create a new quote
- `GET /quotes/article/:articleId` - Get quotes by article
- `GET /quotes/:id` - Get quote by ID
- `PUT /quotes/:id` - Update quote
- `DELETE /quotes/:id` - Delete quote

### Analysis
- `POST /analysis/batch` - Create analysis batch
- `POST /analysis/batch/:batchId/start` - Start analysis batch
- `GET /analysis/batch/:batchId` - Get analysis batch status
- `POST /analysis/batch/:batchId/cancel` - Cancel analysis batch
- `GET /analysis/project/:projectId/batches` - Get project analysis batches

### Categories
- `GET /categories` - List all categories
- `POST /categories` - Create a new category
- `GET /categories/:id` - Get category by ID
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category (soft delete)
- `PUT /categories/reorder` - Reorder categories

### Settings
- `GET /settings` - Get application settings
- `PUT /settings` - Update settings
- `GET /settings/prompts` - Get Gemini prompts
- `PUT /settings/prompts` - Update Gemini prompts
- `GET /settings/categories` - Get categories
- `PUT /settings/categories` - Update categories

### Context Cache Management
- `GET /settings/context-cache` - Get context cache status
- `POST /settings/context-cache/refresh` - Refresh all context caches
- `DELETE /settings/context-cache` - Clear all context caches
- `DELETE /settings/context-cache/batch` - Clear only batch context cache

### Export
- `POST /export/:projectId` - Export to Google Sheets
- `GET /export/status/:projectId` - Get export status
- `GET /export/download/:projectId` - Download export

## Response Format

All API responses follow this structure:

**Success**:
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

**Error**:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Development

- **Build**: `npm run build`
- **Start**: `npm start`
- **Dev**: `npm run dev`

## Database Schema

The application uses the following models:

- **Project**: Container for articles and analysis (with archiving support)
- **Article**: News articles with metadata and analysis results
- **Quote**: Extracted quotes from articles with stakeholder information
- **AnalysisJob**: Background job tracking for Gemini analysis
- **AnalysisBatch**: Batch processing for multiple articles
- **SearchSource**: Available news sources for importing
- **ImportSession**: Import session tracking and management
- **PromptTemplate**: Gemini prompt templates for analysis
- **Category**: Category definitions for article classification

## Context Caching

NewsHub implements sophisticated batch-level context caching to optimize token usage and improve performance:

### How it Works
- **Batch-Level Caching**: Context is cached at the start of each analysis batch and reused for all sub-batches
- **Multi-Tier Cache System**: 
  - **Batch Cache** (highest priority) - Used during active batch processing
  - **Regular Cache** (fallback) - Used for individual requests outside batches
  - **Fresh Load** (last resort) - Loads from database if no cache available
- **Content Hash Tracking**: Monitors prompt changes to invalidate cache when needed
- **Automatic Management**: Cache refreshes when prompts or categories are updated

### Token Optimization
- **Before**: Each sub-batch (3 articles) sent full prompts + categories to Gemini
- **After**: Batch context loaded once, reused for all sub-batches in the same analysis run
- **Result**: Significant token savings while maintaining prompt update capability

### Environment Variables
- `GEMINI_CONTEXT_TTL`: Cache time-to-live (default: "3600s" = 1 hour)
- `GEMINI_BATCH_SIZE`: Maximum articles per analysis batch (default: 10)

### Cache Management
The system automatically manages context caches with intelligent cleanup:
- Batch cache cleared automatically when batch completes (success or failure)
- Regular cache persists for individual requests
- Manual cache management available via API endpoints

## License

ISC
