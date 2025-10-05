🏠 Dashboard (/)
Purpose

The central hub of the app.
Displays all existing projects, lets users create new ones, access project-specific pages, and view basic system stats (like pending analysis queues or API usage).

Sections
1️⃣ Header

App title/logo: “NewsHub”

Global actions:

New Project (button → opens modal)

Settings (gear icon → global settings page)

Status indicators:

Small queue counter (shows number of active Gemini batches)

Database connection light (green/red ping indicator, optional)

2️⃣ Project List

A list or grid of existing projects fetched from /api/projects.

Each Project Card displays:

project.name

createdAt

number of articles

number of analysed articles

Progress bar (analysed / total)

Timestamp of last Gemini run

Actions:

Click → navigates to /project/:id

Hover → shows options:

✏️ Rename Project

🗑️ Delete Project (confirmation modal)

3️⃣ New Project Modal

Triggered by “New Project” button.
Fields:

Project name (required)

Optional description

Optional NewsAPI search parameters:

Keyword(s)

Date range

Source filters (checkboxes or tags)

Buttons:

Create Project

Posts to /api/projects

Redirects to new project page (/project/:id)

Cancel

4️⃣ Global Info (optional bottom section)

Total number of articles across all projects

Total analysed

Average sentiment (for fun)

System status (Gemini API key OK / DB connected)

Routes + API Interactions
Action	Method	Endpoint	Notes
Fetch all projects	GET	/api/projects	Load dashboard list
Create new project	POST	/api/projects	From modal
Delete project	DELETE	/api/projects/:id	With confirmation
Rename project	PATCH	/api/projects/:id	Inline edit
Queue status	GET	/api/analysis/status	Dashboard summary indicator
Frontend Components
Component	Description
DashboardHeader	Logo, global buttons, indicators
ProjectGrid	Responsive grid of project cards
ProjectCard	Individual project info + actions
NewProjectModal	Form for creating a project
StatsFooter	Optional analytics + connection info
Design / UX Notes

Keep the Dashboard lightweight — this is the entry point, so render instantly even on cold start.

Load project metadata (counts, statuses) lazily if needed.

When creating a project, give instant feedback (“Creating project…”) before redirect.

Consider a “demo” placeholder project if list is empty.