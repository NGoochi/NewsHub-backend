🧾 NewsHub — Definitions (v0.1)

A living lexicon describing the structural, conceptual, and functional elements of the NewsHub project.
This file ensures consistent terminology across code, prompts, and UI development.

🔧 Project Overview

Project Name: NewsHub
Purpose: A webapp that searches, catalogues, and analyses news articles using external APIs (NewsAPI, Gemini) and stores results in a local database (PostgreSQL via Prisma).
Primary Use Case: Provide structured insights into media coverage by summarising and classifying articles, identifying key stakeholders, and exporting data for external analysis (e.g., Google Sheets).

📚 Core Data Structure
Project

A self-contained workspace containing a collection of Articles and their associated Quotes.

Fields:

id – unique UUID identifier

name – project name

description – optional description

createdAt, updatedAt – timestamps

Relationships: has many Articles

Article

A single news item imported from NewsAPI or added manually.
Holds both the raw metadata and the analysed data returned by Gemini.

Fields:

id – unique UUID

projectId – foreign key to Project

newsOutlet – publication or source

title – headline of the article

authors – array of author names

url – original article link

fullBodyText – full article content

dateWritten – date of publication

inputMethod – enum: newsapi, manual, csv

summaryGemini – short summarisation by Gemini

categoryGemini – thematic category assigned by Gemini

sentimentGemini – sentiment classification (enum: positive, neutral, negative)

translatedGemini – boolean; whether translation occurred

analysedAt – timestamp marking analysis completion

Relationships: has many Quotes

Quote

A statement extracted from an Article by Gemini, attributed to an identified stakeholder.

Fields:

id – unique UUID

articleId – foreign key to Article

stakeholderNameGemini – person or entity name

stakeholderAffiliationGemini – organisational or contextual link

quoteGemini – extracted statement text

🧠 Core Processes
Search

Retrieves article metadata and content via NewsAPI, populating the Articles table.
Input parameters: search term, date range, and other filters.
Output: structured JSON containing article metadata and text.

Analysis (Gemini)

A structured process where the app sends article data (≤10 per batch) to Gemini for summarisation, categorisation, translation, and stakeholder extraction.

Input: JSON array of article data.

Output: JSON array matching the schema of Article and Quote fields.

Behaviour:

Runs manually on user request.

Operates in batches of up to 10 articles.

Executes asynchronously via a job queue so the user can navigate away.

Updates the database once analysis is complete.

Export

Converts the full Project dataset (Articles + Quotes) into a Google Sheets file.
Creates two tabs: Articles and Quotes.
Handles authentication via Google OAuth.

🖥️ User Interface Definitions
Dashboard

Landing screen displaying all Projects.

Create / delete Projects

Open an existing Project

Project Page

Workspace showing all articles belonging to a Project.

Displays article title, author, date, sentiment, and category

Expandable rows reveal full body text and summary

Multi-select to run Gemini analysis

Tabs for Articles and Quotes

Option to export to Google Sheets

Settings Dialogue

Allows users to edit:

Custom Gemini prompt fragments (for analysis style)

Category definitions

Export preferences
Admin-only fields:

Gemini system formatting schema (“System I/O Contract”)

Database field mapping

⚙️ Supporting Concepts

Input Method
Describes how an article entered the system. Can be newsapi, manual, or csv.

Analysis Status
Whether an article has been analysed (analysedAt not null).

Job Queue
Background system that processes Gemini analyses in batches of ≤10.

System I/O Contract
An admin-only specification defining the strict JSON schema Gemini must follow when returning analysed data for insertion into the database.

🧩 Planned Integrations

NewsAPI: Retrieve article metadata and body text.

Gemini API: Run structured NLP analysis (summaries, sentiment, stakeholder extraction).

Google Sheets API: Export completed project data to Sheets with two tabs (Articles, Quotes).

🧱 Stack Overview

Server: Express (TypeScript)

Database: PostgreSQL (Neon)

ORM: Prisma

Hosting: Render

Analysis: Gemini API

Search: NewsAPI

Export: Google Sheets API

🚧 Future Reserved Terms

(to be defined later)

“Batch Job” — internal process of sequential Gemini calls

“Prompt Schema” — editable portion of Gemini request

“Category Set” — controlled list of article topics, user-editable in settings