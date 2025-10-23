# Google Sheets Integration Setup

This document explains how to set up and use the Google Sheets integration feature for exporting extracted articles.

## Prerequisites

1. A Google Cloud Platform account
2. A Google Sheets document that you want to write to
3. A service account with Google Sheets API access

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API for your project

### 2. Create a Service Account

1. In the Google Cloud Console, go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Give it a name (e.g., "factiva-sheets-integration")
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

### 3. Generate Service Account Key

1. Find your service account in the list
2. Click on the service account email
3. Go to the "Keys" tab
4. Click "Add Key" > "Create new key"
5. Choose "JSON" format
6. Download the JSON file (this is your service account key)

### 4. Share Google Sheets with Service Account

1. Open your Google Sheets document
2. Click "Share" in the top-right corner
3. Add the service account email (found in the JSON file as `client_email`)
4. Give it "Editor" permissions
5. Click "Send"

## Using the Integration

### 1. Extract Articles

1. Upload and process your PDF file as usual
2. Wait for the articles to be extracted

### 2. Configure Google Sheets

1. The Google Sheets section will appear after articles are extracted
2. Paste your Google Sheets URL in the "Google Sheets URL" field
3. Upload your service account key JSON file
4. Optionally change the sheet name (default: "Articles")

### 3. Test Connection

1. Click "Test Connection" to verify your setup
2. You should see a success message if everything is configured correctly

### 4. Write to Google Sheets

1. Click "Write to Google Sheets" to export your articles
2. The data will be written in the following format:
   - Column A: Source
   - Column B: Article Title
   - Column C: Article Author/s
   - Column D: Article URL (N/A if not available)
   - Column E: Article Body Text

## Data Format

The exported data includes:
- **Source**: The news source (e.g., "Reuters", "BBC News")
- **Article Title**: The extracted article title
- **Article Author/s**: The author name(s) if detected
- **Article URL**: Currently shows "N/A" (not available in PDF extraction)
- **Article Body Text**: The full text content of the article

## Troubleshooting

### Common Issues

1. **"Service account key not loaded"**
   - Make sure you've uploaded the correct JSON file
   - Check that the file is valid JSON

2. **"Connection failed"**
   - Verify the service account has access to the Google Sheets API
   - Check that the service account email has been shared with the spreadsheet

3. **"Invalid Google Sheets URL"**
   - Make sure you're using the full Google Sheets URL
   - The URL should look like: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

4. **"Sheets API write failed"**
   - Check that the service account has "Editor" permissions on the spreadsheet
   - Verify the sheet name exists (it will be created if it doesn't exist)

### Security Notes

- Keep your service account key file secure
- Don't share the JSON file publicly
- The key is stored temporarily in your browser's localStorage for convenience
- You can clear it by refreshing the page or using the "Clear All" button

## API Limits

- Google Sheets API has rate limits
- Large datasets are automatically chunked to avoid hitting limits
- If you encounter rate limit errors, wait a few minutes and try again
