# NewsAPI Request Format - Fixed

## ✅ What Was Fixed

The NewsAPI import endpoint (`POST /import/newsapi`) now correctly accepts and processes the full NewsAPI.ai query structure, matching the format from the "Request Demo" file.

## 📋 Correct Request Format

### Endpoint
```
POST /import/newsapi
Content-Type: application/json
```

### Request Body
```json
{
  "projectId": "your-project-uuid-here",
  "query": {
    "$query": {
      "$and": [
        {
          "$or": [
            {
              "$and": [
                {
                  "keyword": "COP30",
                  "keywordLoc": "body"
                },
                {
                  "keyword": "Brazil",
                  "keywordLoc": "body"
                }
              ]
            },
            {
              "keyword": "Climate Conference",
              "keywordLoc": "body"
            }
          ]
        },
        {
          "$or": [
            {
              "sourceUri": "lecho.be"
            },
            {
              "sourceUri": "lexpress.fr"
            }
          ]
        },
        {
          "dateStart": "2025-08-25",
          "dateEnd": "2025-09-18"
        }
      ]
    },
    "$filter": {
      "dataType": [
        "news",
        "blog"
      ]
    }
  }
}
```

## 🔑 Key Points

1. **`projectId`** (required): UUID of the project to import articles into
2. **`query`** (required): The complete NewsAPI.ai query object containing:
   - `$query`: The search query structure with boolean logic
   - `$filter` (optional): Data type filters

## 🏗️ How It Works Now

1. **Frontend sends** the full query structure (as built by the query builder)
2. **Backend validates** the `$query` structure exists
3. **Backend extracts** metadata (search terms, sources, dates) for session tracking
4. **Backend passes** the entire query to the NewsAPI client
5. **NewsAPI client** uses the query directly or falls back to building a simple query

## 📝 Example: Simple Query

For a simple keyword search:

```json
{
  "projectId": "abc-123-def-456",
  "query": {
    "$query": {
      "$and": [
        {
          "keyword": "technology",
          "keywordLoc": "body"
        },
        {
          "dateStart": "2025-01-01",
          "dateEnd": "2025-12-31"
        }
      ]
    },
    "$filter": {
      "dataType": ["news", "blog"]
    }
  }
}
```

## 📝 Example: Complex Boolean Query

With multiple keywords, sources, and operators:

```json
{
  "projectId": "abc-123-def-456",
  "query": {
    "$query": {
      "$and": [
        {
          "$or": [
            { "keyword": "climate change", "keywordLoc": "title" },
            { "keyword": "global warming", "keywordLoc": "title" }
          ]
        },
        {
          "$or": [
            { "sourceUri": "bbc.com" },
            { "sourceUri": "cnn.com" },
            { "sourceUri": "theguardian.com" }
          ]
        },
        {
          "dateStart": "2025-01-01",
          "dateEnd": "2025-12-31"
        }
      ]
    },
    "$filter": {
      "dataType": ["news"]
    }
  }
}
```

## 🔄 Response Format

```json
{
  "success": true,
  "data": {
    "sessionId": "session-uuid",
    "status": "running",
    "message": "Import started successfully. Use the session ID to track progress."
  },
  "error": null
}
```

## 🔍 Tracking Progress

After starting an import, track its progress:

```
GET /import/session/:sessionId
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "session-uuid",
    "projectId": "project-uuid",
    "status": "running",
    "articlesFound": 150,
    "articlesImported": 75,
    "searchTerms": ["technology"],
    "sources": ["bbc.com"],
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-12-31T00:00:00.000Z",
    "createdAt": "2025-10-09T06:00:00.000Z"
  },
  "error": null
}
```

## ⚠️ Important Notes

1. **API Key**: The backend automatically adds the NewsAPI.ai API key from environment variables
2. **`resultType`**: Automatically set to "articles"
3. **`articlesSortBy`**: Automatically set to "date"
4. **Date Format**: Use ISO date format (YYYY-MM-DD)
5. **Source URIs**: Must match exact source URIs from NewsAPI.ai (e.g., "bbc.com", "cnn.com")
6. **Keyword Location**: Can be "title", "body", or other valid locations per NewsAPI.ai docs

## 🧪 Testing with cURL

```bash
curl -X POST http://localhost:8080/import/newsapi \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your-project-id",
    "query": {
      "$query": {
        "$and": [
          {
            "keyword": "technology",
            "keywordLoc": "body"
          },
          {
            "dateStart": "2025-01-01",
            "dateEnd": "2025-12-31"
          }
        ]
      },
      "$filter": {
        "dataType": ["news", "blog"]
      }
    }
  }'
```

## 🐛 Error Handling

### Missing projectId
```json
{
  "success": false,
  "error": "Missing required field: projectId"
}
```

### Invalid query structure
```json
{
  "success": false,
  "error": "Missing or invalid query structure. Expected format: { \"$query\": { ... } }"
}
```

### Project not found
```json
{
  "success": false,
  "error": "Project not found"
}
```

## 🔧 Changes Made

### 1. `src/controllers/importController.ts`
- Removed unnecessary `articleCount` parameter
- Fixed validation to check for `query.$query` structure
- Added better error messages
- Added logging for debugging
- Passes entire query object to ImportService

### 2. `src/lib/newsapi.ts`
- Updated `buildRequest()` to accept and parse the full query structure
- When `useBooleanQuery` is true and `booleanQuery` contains `$query`, uses it directly
- Falls back to building simple query if parsing fails
- Preserves `$filter` from the original query

## ✅ Verification

Build successful:
```
npm run build
```

The endpoint now correctly handles the NewsAPI.ai query format from the Request Demo file and will work seamlessly with the frontend query builder.

