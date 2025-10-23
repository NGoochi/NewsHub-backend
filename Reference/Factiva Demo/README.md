# News Articles PDF to JSON Converter

A specialized web application that processes PDF files containing collections of news articles, automatically identifies index pages, and extracts individual articles with their page numbers.

## Features

- **Smart Index Detection**: Automatically identifies pages containing article listings with page numbers
- **Article Extraction**: Extracts article titles and their corresponding page numbers from index pages
- **Pattern Recognition**: Handles the specific format: "ARTICLE TITLE ............................................................................................................................ PAGE_NUMBER"
- **Interactive Article List**: Displays extracted articles in a clean, organized list format
- **Multiple Output Formats**: Provides both articles-only JSON and full PDF JSON
- **Drag & Drop Interface**: Easy file upload with drag and drop support
- **Progress Tracking**: Real-time progress bar during processing
- **Document Statistics**: Shows page count, article count, and word count
- **Download Functionality**: Download extracted articles or full PDF data as JSON files
- **Modern UI**: Beautiful, responsive design with smooth animations
- **Error Handling**: Comprehensive error handling and user feedback

## How to Use

1. **Open the Application**: Open `index.html` in your web browser
2. **Upload PDF**: 
   - Drag and drop a news articles PDF file onto the upload area, or
   - Click the upload area to browse and select a file
3. **Extract Articles**: Click the "Extract Articles" button
4. **View Results**: 
   - See detected index pages
   - Browse extracted articles with page numbers
   - View document statistics
5. **Download**: Choose between articles-only JSON or full PDF JSON

## Expected PDF Format

The application is designed to work with PDFs that have:
- **Index Pages**: First few pages containing article listings in the format:
  ```
  WHY EUROPEANS HAVE LESS ............................................................................................................................ 3
  The Depopulation Bomb........................................................................................................................................... 9
  Development and preliminary validation of a survey assessing technology innovation readiness in health care settings ................................................................................................................................................................... 11
  ```
- **Article Pages**: Subsequent pages containing the full article content

## Output Format

### Articles JSON
```json
{
  "metadata": {
    "filename": "Factiva-20250828-1036.pdf",
    "filesize": 304999,
    "pageCount": 37,
    "conversionDate": "2024-01-01T12:00:00.000Z"
  },
  "articles": [
    {
      "title": "WHY EUROPEANS HAVE LESS",
      "pageNumber": 3,
      "indexPage": 1
    },
    {
      "title": "The Depopulation Bomb",
      "pageNumber": 9,
      "indexPage": 1
    }
  ],
  "summary": {
    "totalArticles": 8,
    "totalWords": 15000,
    "totalCharacters": 75000
  }
}
```

### Full PDF JSON
Contains complete page-by-page content with metadata and statistics.

## Technical Details

- **PDF Processing**: Uses PDF.js library for client-side PDF parsing
- **Index Detection**: Intelligent pattern matching to identify index pages
- **Article Parsing**: Regex-based extraction of article titles and page numbers
- **No Server Required**: All processing happens in the browser
- **File Support**: Accepts PDF files only
- **Browser Compatibility**: Works in modern browsers with JavaScript enabled

## Dependencies

- **PDF.js**: Loaded from CDN for PDF parsing capabilities
- **No additional installations required**

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Use Cases

- **News Agencies**: Process daily news digests and extract individual articles
- **Research**: Extract article metadata from academic or industry publications
- **Content Management**: Organize large document collections by article
- **Data Analysis**: Convert PDF content to structured data for analysis

## Limitations

- Large PDF files may take longer to process
- Complex PDF layouts may affect index detection accuracy
- Images and non-text elements are not extracted
- Requires JavaScript to be enabled
- Index pages must follow the expected format pattern

## Troubleshooting

- **No articles found**: Check if the PDF follows the expected index format
- **Index not detected**: Ensure the first few pages contain article listings with page numbers
- **Conversion fails**: Check browser console for error messages
- **Slow performance**: Large PDFs may take time to process
- **Memory issues**: Very large PDFs may cause browser memory issues

## License

This project is open source and available under the MIT License.
