📁 Project Page (/project/:id)
Purpose

The workspace for a single project — all news articles, analyses, and extracted quotes live here.
It’s where the user reviews imported data, runs Gemini analysis, and curates outputs.

Layout Overview
┌───────────────────────────────┬────────────────────────────────────────────┐
│  Sidebar (search & controls) │        Main Content (articles & data)      │
│                              │                                            │
│  - Project meta              │  [Articles Tab - default]                  │
│  - Search filters            │  [Quotes Tab]                              │
│  - Analysis actions          │  [Settings Tab]                            │
└───────────────────────────────┴────────────────────────────────────────────┘

1️⃣ Sidebar (left column)
Project Info

Project name + description (editable inline)

Project created date

Number of articles total / analysed

Last analysis timestamp

Search Parameters

(Visible fields from project creation or editable)

Keywords

Date range

Sources (checkbox/tag list)

Article limit (e.g. 100)

“Fetch new articles” button → calls /api/articles/import

Analysis Controls

Multi-select options:

☐ Article Analysis

☐ Quotes Extraction

“Run Analysis” button → triggers /api/analysis/enqueue

Status display:

Running / Completed / Failed (with spinner + count)

Queue progress bar (X of Y processed)

Utility Actions

Export → “Export project to Google Sheet”

Delete project (confirmation modal)

Back to Dashboard

2️⃣ Main Content Area (right column)
Default Tab: Articles

Displays a virtualised list view of all project articles.

Unexpanded Row View

Columns:

Field	Example
Title	“UN Summit Calls for Urgent Action”
Author	“Jane Doe”
Date	05/10/2025
Outlet	“Reuters”
Status	✅ Analysed / ⏳ Pending / ❌ Failed
Category	“Multilateralism”
Sentiment	“Positive”
Quotes Found	5

Row actions:

⬇️ Expand (down arrow)

🗑️ Delete

✏️ Edit Metadata (if needed)

Expanded Row View

Appears inline under the selected row (accordion style).

Sections inside:

Summary (Gemini) — short paragraph

Category (Gemini) — highlight badge

Sentiment (Gemini) — coloured indicator

Quotes Extracted (list) — preview list of stakeholder names + first few words of quotes (clickable to view full in Quotes Tab)

Full Article Text — collapsible or scrollable panel

Actions:

Rerun analysis on this article

Edit summary/category manually (admin only)

Quotes Tab

Shows aggregated quotes linked to this project.

Table grouped by stakeholderNameGemini

Columns: Stakeholder | Affiliation | # of Quotes | Sentiment (optional later)

Expand stakeholder → shows all their quotes with linked article titles

Filters: by stakeholder name, by article, by category

“Export Quotes” button → export quotes table as CSV/Sheets

Settings Tab

Project-specific configuration.

Sections:

Gemini Prompts (read-only)

Displays current prompt versions + date of last update

Admins can reload or test them

Categories (editable)

Table of categories (name, definition, keywords)

Multi-select delete

“Add Category” row

“Update Categories” button (writes to DB + triggers backend cache refresh)

Miscellaneous

“Reset Project Analyses” → clears Gemini fields

“Export to Google Sheets” again here

API usage / token stats (optional)

3️⃣ API Interactions
Action	Method	Endpoint	Notes
Fetch project	GET	/api/projects/:id	Initial load
Fetch articles	GET	/api/articles?projectId=...	Paginated
Fetch quotes	GET	/api/quotes?projectId=...	For Quotes tab
Fetch categories	GET	/api/categories	Used when running analysis
Run analysis	POST	/api/analysis/enqueue	Batch up to 10
Update categories	POST	/api/categories/update	From Settings tab
Export project	POST	/api/export/sheets	Creates Google Sheet
Delete article	DELETE	/api/articles/:id	Row action
Delete project	DELETE	/api/projects/:id	Sidebar action
4️⃣ Components
Component	Description
ProjectSidebar	Holds project metadata, search params, analysis controls
ArticleList	Virtualised list of all articles
ArticleRow	Unexpanded view row
ArticleExpanded	Expanded details (summary, quotes, body)
QuotesTable	Aggregated stakeholder quotes
CategoryEditor	Editable list of category definitions
SettingsPanel	Handles categories, prompts, exports
RunAnalysisModal	Confirmation + progress UI
ExportButton	Shared export logic
StatusIndicator	Visual queue/progress feedback
5️⃣ UX & Visual Notes

Split layout: fixed sidebar (25%) + flexible content pane (75%).

Use light background + subtle table separators — dashboard-style clarity.

Persistent project title in header (breadcrumb: Dashboard → Project Name).

Progress bars everywhere: instant visual feedback.

All destructive actions (delete, reset) → confirmation modals.

Keyboard shortcuts (later): ↑/↓ to navigate list, Enter to expand.

Keep body text truncated until expanded — saves bandwidth.