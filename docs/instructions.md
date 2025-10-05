🧭 NewsHub — Project Instructions (v0.1)

Comprehensive system architecture and development guide for the NewsHub web application.
This file defines scope, structure, and functional logic for all modules within the Express-based server environment.
It is designed for use within Cursor to maintain global project context and ensure consistent code generation.

🧱 Project Summary

Goal:
A server-based application that retrieves, analyses, and organises news articles from external APIs, producing structured insights about sentiment, categories, and stakeholder quotes.

Core Capabilities:

Search — Retrieve and catalogue news articles via NewsAPI.

Analysis — Run AI-powered analysis through Gemini to extract summaries, sentiment, categories, and quotes.

Export — Output analysed datasets to Google Sheets for further study.

Stack:

Backend Framework: Express (TypeScript)

Database: PostgreSQL (Neon)

ORM: Prisma

Hosting: Render

Integrations: NewsAPI, Gemini API, Google Sheets API

🧩 Core Architecture
src/
  index.ts                 → Entry point / server setup
  routes/                  → Express routes
    projects.ts
    articles.ts
    quotes.ts
    analysis.ts
    settings.ts
  controllers/             → Business logic for routes
    projectController.ts
    articleController.ts
    quoteController.ts
    analysisController.ts
  lib/
    db.ts                  → Prisma client instance
    newsapi.ts             → Handles NewsAPI calls
    gemini.ts              → Handles Gemini analysis requests
    sheets.ts              → Google Sheets export helper
  jobs/
    queue.ts               → Job queue manager for Gemini batching
    worker.ts              → Background processor
  utils/
    formatters.ts          → Data cleaning and transformation utilities
    validation.ts          → Input validation helpers
  docs/
    definitions.md          (terminology reference)
    instructions.md         (this file)

⚙️ Server Responsibilities
Express Application

Initialise middleware (cors, json, dotenv)

Register all route modules

Provide basic health endpoint (/)

Handle global errors gracefully

Serve as API only (no frontend rendering)

Database (PostgreSQL via Prisma)

Stores Projects, Articles, Quotes

Manages relations and cascade deletions

Tracks analysis progress via analysedAt field

Enforces enums for inputMethod and sentimentGemini

APIs
Function	Route	Description
Project Management	/projects	CRUD for projects
Article Import	/articles/import	Calls NewsAPI, normalises, inserts to DB
Article CRUD	/articles/:id	View/edit/delete article
Quote CRUD	/quotes/:id	View/edit/delete quote
Run Analysis	/analysis/run	Accepts array of article IDs; enqueues Gemini jobs
Job Status	/analysis/status/:projectId	Returns progress summary
Export	/export/:projectId	Builds and sends data to Google Sheets
Settings	/settings	Read/write Gemini prompt fragments and category definitions
🧠 Data Flow Overview
1. Creating a Project

User hits /projects → POST

Database creates entry with name + optional description

Returns project ID for later references

2. Importing Articles

Client posts search parameters (query, date range) to /articles/import

Backend calls NewsAPI

Normalises response → creates Article records

Returns article count + list of IDs

3. Running Analysis

Client selects articles → sends array of IDs to /analysis/run

Each article becomes a job (stored in queue table)

Worker processes jobs in batches of ≤10 per Gemini call

Gemini returns JSON array of structured fields (summary, category, sentiment, quotes)

Controller updates Articles and inserts Quotes

When complete, marks analysedAt

4. Monitoring Jobs

Client polls /analysis/status/:projectId

Server queries queue for progress:

queued, processing, completed, failed

Returns stats + estimated completion time

5. Exporting Data

User triggers /export/:projectId

Server gathers Articles + Quotes

Builds JSON → sends to Google Sheets API → creates spreadsheet with two tabs:

Articles

Quotes

Returns link to the created sheet

🧩 Module Responsibilities
/lib/db.ts

Exports a single Prisma client instance shared across all controllers:

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export default prisma;

/lib/newsapi.ts

Handles all NewsAPI queries

Sanitises and normalises data before DB insert

Abstracts away API keys and endpoints

Returns array of Article objects ready for insertion

/lib/gemini.ts

Builds the Gemini API request payloads

Accepts up to 10 articles per request

Sends structured JSON and parses response

Handles retries, rate limiting, and JSON schema validation

/lib/sheets.ts

Manages Google OAuth token storage

Accepts project ID → fetches Articles + Quotes

Creates or updates a Google Sheet with two tabs

Returns shareable URL

/jobs/queue.ts

Handles job creation, retrieval, and deletion

Stores job state: queued, processing, done, error

Groups jobs into batches of 10 for Gemini processing

/jobs/worker.ts

Periodically runs (setInterval or Render cron)

Pulls queued jobs, executes Gemini API calls

Updates DB with results

Marks completion

🖥️ UI-Independent Design Philosophy

Although the backend currently has no UI, all responses are formatted to be frontend-agnostic, ready for future integration with a React dashboard.

Response structure convention:

{
  "success": true,
  "data": {...},
  "error": null
}


Error example:

{
  "success": false,
  "error": "Failed to fetch from NewsAPI"
}

🧰 Development Conventions

All TypeScript files use ES2020 syntax.

Each route file defines only routes; logic lives in controllers.

Environment variables stored in .env:

DATABASE_URL=
NEWS_API_KEY=
GEMINI_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=


Use try/catch and async/await consistently.

Use relative imports (@/lib/db etc.) when possible.

🧱 Scalability Notes

Database: PostgreSQL on Neon (free tier scalable).

Job Queue: In early stages, runs as a simple table-driven loop.
Later upgrade path → Redis or a lightweight queue like BullMQ.

Worker Separation: Optional future Render service for independent processing.

Authentication: Currently single-user; OAuth planned for future expansion.

🚧 Development Phases
Phase	Description	Status
1	Express + Prisma base, database migration	✅ Complete
2	CRUD endpoints for Projects, Articles, Quotes	✅ Complete
3	NewsAPI integration + article import	✅ Complete
4	Gemini analysis + batching queue	✅ Complete
5	Google Sheets export	Planned
6	Settings + editable prompts	Planned
7	Optional UI frontend (React)	Deferred

## Still to do:

### For NewsAPI:
- Clean up search parameter page, add extra parameters?
- Add a settings dialogue that allows user to add/delete search sources, languages, countries.
- Develop UI to show articles in realtime as they come in.
- Clean up boolean search option, make a nice little UI for building a boolean search.

### For Gemini Analysis:
- **Batch Processing Enhancement**: Send off analysis requests in greater than 10 numbers, but make it so 10 articles can be analyzed at a time, include real-time results as they complete.
- **Category Management**: Fix categorisation - make sure categories are uploaded to database and can be edited from a settings page.

### Not So Urgent:
- **Translation Model**: Include a translation model - will need its own prompt, etc. dynamic so offer to translate if article is not English.
- **Stakeholder Tracking**: Per-project stakeholder tracking.
- **Report Generation**: Generate a single page report from selected analysed articles, this will be another prompt/formatted call. - ability to download report as a PDF.
🧩 Coding Style Reference

Functions use camelCase.

Database tables mirror schema field names exactly.

Keep controllers pure (no side effects outside DB + API).

Always validate external input.

Prefer modular exports: one function per responsibility.

Every route should have an accompanying controller test file.

💾 Testing Strategy (future)

Unit tests for controllers (using Jest).

Mocked API responses for NewsAPI and Gemini.

Local test DB via Prisma with sqlite for CI.

Manual API tests through Postman or Thunder Client.

🧩 Core Design Goals

Reliability: handle API rate limits + batching gracefully.

Transparency: clear logs and progress tracking for all jobs.

Extensibility: every module can be replaced (e.g., swap Gemini for another LLM).

Simplicity: human-readable data models, predictable structure.

Low cost: all free-tier compatible.

🚀 Quick Setup Summary

Clone repo → install deps → connect Neon.

npx prisma migrate dev

npm run dev → local API server

Deploy to Render → link DATABASE_URL

Confirm / endpoint → “NewsHub API running!”

🧠 Cursor Context Meta

These lines guide Cursor’s internal context weighting and retrieval behaviour during code generation, refactoring, and commentary.

---

# 🧠 Cursor Context Meta (for internal guidance)

**Primary Context Files:**
- `docs/definitions.md` — contains project lexicon and terminology
- `docs/instructions.md` — contains architecture, workflow, and development conventions

**Cursor Behaviour Guidelines:**

1. **Global Awareness**
   - Always read both context files (`definitions.md` and `instructions.md`) before writing or modifying code.
   - Treat these as the single source of truth for:
     - Field names and database schema
     - API endpoint purposes
     - Relationships between Project → Articles → Quotes
     - The Gemini analysis flow
     - Development style conventions

2. **Priority Hierarchy**
   - When writing or editing code:
     1. Match the **data model** and **API behaviours** described here.
     2. Follow naming and structure conventions exactly.
     3. Preserve schema field names from `definitions.md`.
     4. Implement new logic modularly (no duplication across controllers or utils).

3. **Code Generation Scope**
   - Code should always:
     - Be written in **TypeScript** for Express.
     - Use **Prisma** for all database access.
     - Respect the architecture in `/routes`, `/controllers`, `/lib`, and `/jobs`.
   - Each function should have a clearly named export.
   - Keep API responses structured:
       ```ts
       { success: true, data, error: null }
       ```
       or
       ```ts
       { success: false, error: "message" }
       ```

4. **When Building New Components**
   - Reference these docs to determine which folder the new file belongs in.
   - If unsure of naming, default to patterns already defined in `instructions.md`.
   - Never create frontend files; backend only.

5. **When Unsure**
   - Cursor should check both docs for matching definitions before guessing field names or inventing schema.
   - Prefer function stubs with TODO comments rather than hallucinating logic.

6. **Tone & Style**
   - Keep code clean, modular, and well-annotated.
   - Comments should clarify logic, not narrate steps.
   - Avoid over-abstracting; favour clarity and maintainability.

---

*End of Context Meta*