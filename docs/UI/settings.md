⚙️ Global Settings (/settings)
Purpose

A dedicated page for managing system-wide configuration — API credentials, Gemini parameters, export options, and interface preferences.
These settings apply to every project unless overridden at project level.

1️⃣ Layout Overview
┌───────────────────────────────────────────────┐
│   Header: “Global Settings”                   │
│   Tabs: [Integrations] [Gemini] [Exports] [UI]│
└───────────────────────────────────────────────┘


Each tab isolates one category of settings for clarity.

2️⃣ Tabs
🧩 Integrations

Manage connected services and API keys.

Fields / Sections:

NewsAPI Key

Input field (masked)

“Test Connection” button → calls /api/test/newsapi

Status light: ✅ Connected / ❌ Invalid

Gemini API Key

Input field (masked)

“Test Connection” button → calls /api/test/gemini

Google Sheets / Drive

OAuth connection status (connected/disconnected)

“Connect Google Account” button

“Disconnect” / “Refresh Token” options

Default Data Storage

Radio options:

PostgreSQL (default)

Google Sheets (legacy fallback)

Save Changes button (PATCH /api/settings/integrations)

🧠 Gemini

Controls the behaviour of the Gemini engines globally.

Fields:

Default Model
Dropdown: gemini-1.5-pro, gemini-1.5-flash, etc.

Batch Size Limit
Numeric (default 10)

Analysis Timeout
Numeric (seconds)

Prompt Version Display

Shows current file hashes for article & quote prompts

“Reload Prompts” button → reloads from /prompts/

Error Handling

Toggle: “Auto-retry failed batches”

Retry limit (default 2)

Save Changes button (PATCH /api/settings/gemini)

📤 Exports

Configure how exports to Google Sheets or CSV behave.

Fields:

Default Export Format

Radio: Google Sheet / CSV / JSON

Sheet Naming Convention

Example: projectname_YYYYMMDD

Include Quotes Sheet

Toggle on/off

Auto-Share Settings

Checkbox: “Share exported sheets via public link”

Destination Folder (Drive ID) (optional)

Save Changes button (PATCH /api/settings/export)

🎨 UI / Preferences

Global appearance and interface behaviour.

Fields:

Theme

Light / Dark / Auto

Layout Density

Comfortable / Compact

Default Landing Page

Dashboard / Last Open Project

Autosave Interval

5s / 10s / 30s

Language / Locale

Dropdown (default English-AU)

Notifications

Toggle desktop alerts for completed analyses

Save Changes button (PATCH /api/settings/ui)

3️⃣ API Interactions
Action	Method	Endpoint	Notes
Get settings	GET	/api/settings	Load all current configs
Update settings	PATCH	/api/settings/:category	category = integrations, gemini, export, ui
Test NewsAPI	GET	/api/test/newsapi	Quick validity check
Test Gemini	GET	/api/test/gemini	Checks API key validity
Connect Google OAuth	GET	/api/oauth/google	Redirect flow
Disconnect Google	DELETE	/api/oauth/google	Revoke token
4️⃣ Components
Component	Description
SettingsTabs	Tab navigation wrapper
IntegrationsPanel	API key + OAuth management
GeminiPanel	Engine configuration
ExportPanel	Export preferences
UIPreferencesPanel	Theme + UX options
StatusIndicator	Connection + key validation feedback
SaveBar	Persistent bottom bar: “Save / Cancel”
5️⃣ UX / Visual Notes

Each tab autosaves on “Save Changes” but does not auto-apply until confirmed — use a toast: “Settings updated.”

Mask sensitive API keys by default with “show/hide” toggles.

Connection tests show spinners + icons for clarity.

Keep destructive actions (disconnect, revoke, reset) behind confirmation modals.

Display current versions / last modified timestamps beside config files (useful for debugging).

Small footer showing “Config stored in PostgreSQL” for transparency.