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
│   ├── projects.ts
│   ├── articles.ts
│   ├── quotes.ts
│   ├── analysis.ts
│   ├── settings.ts
│   └── export.ts
├── controllers/             # Business logic for routes
│   ├── projectController.ts
│   ├── articleController.ts
│   ├── quoteController.ts
│   ├── analysisController.ts
│   ├── settingsController.ts
│   └── exportController.ts
├── lib/                     # External API helpers
│   ├── db.ts               # Prisma client instance
│   ├── newsapi.ts          # NewsAPI integration
│   ├── gemini.ts           # Gemini analysis
│   └── sheets.ts           # Google Sheets export
├── jobs/                    # Background processing
│   ├── queue.ts            # Job queue manager
│   └── worker.ts           # Background processor
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
- `DELETE /projects/:id` - Delete project

### Articles
- `GET /articles` - List all articles
- `POST /articles/import` - Import articles from NewsAPI
- `GET /articles/project/:projectId` - Get articles by project
- `GET /articles/:id` - Get article by ID
- `PUT /articles/:id` - Update article
- `DELETE /articles/:id` - Delete article

### Quotes
- `GET /quotes` - List all quotes
- `GET /quotes/article/:articleId` - Get quotes by article
- `GET /quotes/:id` - Get quote by ID
- `PUT /quotes/:id` - Update quote
- `DELETE /quotes/:id` - Delete quote

### Analysis
- `POST /analysis/run` - Start Gemini analysis
- `GET /analysis/status/:projectId` - Get analysis status
- `GET /analysis/progress/:projectId` - Get analysis progress

### Settings
- `GET /settings` - Get application settings
- `PUT /settings` - Update settings
- `GET /settings/prompts` - Get Gemini prompts
- `PUT /settings/prompts` - Update Gemini prompts
- `GET /settings/categories` - Get categories
- `PUT /settings/categories` - Update categories

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

The application uses three main models:

- **Project**: Container for articles and analysis
- **Article**: News articles with metadata and analysis results
- **Quote**: Extracted quotes from articles with stakeholder information
- **AnalysisJob**: Background job tracking for Gemini analysis

## License

ISC
