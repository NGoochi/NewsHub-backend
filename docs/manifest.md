🗺️ NewsHub — Project Manifest (v0.1)

A concise file map and component purpose guide.
Used by Cursor and developers to quickly understand where specific functionality lives within the NewsHub repository.
This file should stay updated as new routes, controllers, or utilities are added.

📁 Root Directory
/newshub-express
│
├── prisma/                  → Database schema + migrations
│   └── schema.prisma
│
├── src/                     → Application source
│   ├── index.ts             → Main Express entry point
│   ├── routes/              → Route definitions
│   ├── controllers/         → Business logic
│   ├── lib/                 → External API helpers (NewsAPI, Gemini, Sheets)
│   ├── jobs/                → Background queue + worker logic
│   ├── utils/               → Helper modules (validation, formatting, etc.)
│   └── tests/               → (Optional) automated tests
│
├── docs/                    → Documentation + context files
│   ├── definitions.md       → Project lexicon and terminology
│   ├── instructions.md      → Architecture + development blueprint
│   ├── manifest.md          → This file
│
├── .env                     → Environment variables (API keys, DB URL)
├── package.json             → Scripts, dependencies, metadata
└── tsconfig.json            → TypeScript configuration

🧩 Folder Breakdown
/src/routes

Express routers grouped by domain.
Each file only defines HTTP endpoints — all logic is imported from controllers.

File	Description
projects.ts	CRUD routes for Projects
articles.ts	Article import, retrieval, and editing
quotes.ts	Quote management
analysis.ts	Gemini batching + progress status
settings.ts	App and prompt configuration endpoints
export.ts	Export project data to Google Sheets
/src/controllers

Implements logic for each route.
Each controller focuses on database operations and external API calls, returning formatted responses.

File	Responsibilities
projectController.ts	Create, read, update, delete Projects
articleController.ts	Insert, fetch, and edit Articles; interface with NewsAPI
quoteController.ts	CRUD for Quotes
analysisController.ts	Queue Gemini jobs, parse responses, update DB
settingsController.ts	Manage editable prompt fragments and categories
exportController.ts	Generate and send Google Sheets exports
/src/lib

Houses helper modules for third-party APIs and reusable utilities.

File	Description
db.ts	Exports a singleton Prisma client
newsapi.ts	Handles all NewsAPI communication and data normalisation
gemini.ts	Manages Gemini analysis requests and schema validation
sheets.ts	Handles Google Sheets creation and export routines
logger.ts	(optional) centralised logging utility
/src/jobs

Handles asynchronous task processing and Gemini batching.

File	Description
queue.ts	Job queue table management, enqueue/dequeue functions
worker.ts	Background process that executes Gemini jobs in batches of ≤10
/src/utils

General helpers and validation tools.

File	Description
validation.ts	Schema validation for incoming data
formatters.ts	Cleans and formats API or database results
errorHandler.ts	Express error middleware
constants.ts	Shared config (e.g., sentiment enums, status codes)
/prisma

Prisma ORM setup.

File	Description
schema.prisma	Database schema (Projects, Articles, Quotes)
/migrations/	Auto-generated SQL migration history
/docs

Contains all internal documentation and AI context files.

File	Purpose
definitions.md	Glossary of entities, terminology, and data model
instructions.md	System architecture, logic flow, and conventions
manifest.md	File reference map (this document)
⚙️ Developer Notes

New features must include:

Route definition in /routes

Controller implementation in /controllers

Optional util or lib helper

Avoid placing logic directly inside routes.

Keep all Prisma calls inside controllers or /lib/db.ts.

Each new module must be referenced here when added.

🧠 Cursor Context Meta (lightweight reference)
This manifest provides Cursor with a structural overview.
When generating new code, match new files to the correct directory
based on their described purpose. Always cross-reference with:

- `definitions.md` for data naming consistency
- `instructions.md` for logic and architectural patterns