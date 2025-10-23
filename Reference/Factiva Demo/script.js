// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const stats = document.getElementById('stats');
const indexInfo = document.getElementById('indexInfo');
const indexPages = document.getElementById('indexPages');
const convertBtn = document.getElementById('convertBtn');
const clearBtn = document.getElementById('clearBtn');

// Google Sheets integration elements
const sheetsSection = document.getElementById('sheetsSection');
const sheetsUrl = document.getElementById('sheetsUrl');
const serviceAccountKey = document.getElementById('serviceAccountKey');
const sheetName = document.getElementById('sheetName');
const testConnectionBtn = document.getElementById('testConnectionBtn');
const writeToSheetsBtn = document.getElementById('writeToSheetsBtn');
const sheetsStatus = document.getElementById('sheetsStatus');

let selectedFile = null;
let pdfData = null;
let articlesData = null;

// Event listeners
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);
convertBtn.addEventListener('click', extractArticles);
clearBtn.addEventListener('click', clearAll);

// Google Sheets event listeners
serviceAccountKey.addEventListener('change', handleServiceAccountKeyUpload);
testConnectionBtn.addEventListener('click', testGoogleSheetsConnection);
writeToSheetsBtn.addEventListener('click', writeArticlesToGoogleSheets);

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        const tabId = tab.dataset.tab + 'Tab';
        document.getElementById(tabId).classList.add('active');
    });
});

// Drag and drop handlers
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
        handleFile(files[0]);
    } else {
        showError('Please drop a valid PDF file.');
    }
}

// File selection handler
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
        handleFile(file);
    } else {
        showError('Please select a valid PDF file.');
    }
}

// Handle selected file
function handleFile(file) {
    selectedFile = file;
    showFileInfo(file);
    convertBtn.disabled = false;
    hideError();
    hideResult();
    hideStats();
    hideIndexInfo();
    hideArticlesSection();
}

// Show file information
function showFileInfo(file) {
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.classList.add('show');
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Extract articles from PDF
async function extractArticles() {
    if (!selectedFile) return;

    try {
        showLoading();
        hideError();
        hideResult();
        hideStats();
        hideIndexInfo();
        hideArticlesSection();

        const arrayBuffer = await readFileAsArrayBuffer(selectedFile);
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        const result = {
            metadata: {
                filename: selectedFile.name,
                filesize: selectedFile.size,
                pageCount: pdf.numPages,
                conversionDate: new Date().toISOString()
            },
            pages: []
        };

        let totalWords = 0;
        let totalChars = 0;

        // Process each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            updateProgress((pageNum / pdf.numPages) * 100);
            
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            let pageText = '';
            let lastY = null;
            let lineHeight = 0;
            
            // Calculate average line height from first few text items
            if (textContent.items.length > 0) {
                const firstItems = textContent.items.slice(0, Math.min(10, textContent.items.length));
                const heights = firstItems.map(item => item.height || 0).filter(h => h > 0);
                if (heights.length > 0) {
                    lineHeight = heights.reduce((a, b) => a + b, 0) / heights.length;
                }
            }
            
            textContent.items.forEach((item, index) => {
                const currentY = item.transform[5]; // Y position from transform matrix
                
                // Add line break if Y position changed significantly (indicating new line)
                if (lastY !== null && Math.abs(currentY - lastY) > lineHeight * 0.5) {
                    pageText += '\n';
                }
                
                // Add the text
                pageText += item.str;
                
                // Update last Y position
                lastY = currentY;
            });

            const pageData = {
                pageNumber: pageNum,
                text: pageText.trim(),
                wordCount: pageText.trim().split(/\s+/).filter(word => word.length > 0).length,
                characterCount: pageText.trim().length
            };

            result.pages.push(pageData);
            totalWords += pageData.wordCount;
            totalChars += pageData.characterCount;
        }

        // Add summary statistics
        result.summary = {
            totalWords: totalWords,
            totalCharacters: totalChars,
            averageWordsPerPage: Math.round(totalWords / pdf.numPages),
            averageCharactersPerPage: Math.round(totalChars / pdf.numPages)
        };

        pdfData = result;

        // Extract articles from the index
        const articles = extractArticlesFromIndex(result.pages);
        
        articlesData = {
            metadata: result.metadata,
            articles: articles,
            summary: {
                totalArticles: articles.length,
                totalWords: totalWords,
                totalCharacters: totalChars,
                articlesWithText: articles.filter(a => a.textContent).length
            }
        };

        // Display results
        showIndexInfo(articles);
        showArticles(articles);
        showStats(articles.length, pdf.numPages, totalWords);
        showResult(articlesData, pdfData);
        hideLoading();
        hideProgress();

    } catch (err) {
        console.error('Error processing PDF:', err);
        showError('Error processing PDF: ' + err.message);
        hideLoading();
        hideProgress();
    }
}

// Extract articles from index pages
function extractArticlesFromIndex(pages) {
    let articles = [];
    const indexPages = [];
    
    // Look for index pages (pages with article titles and page numbers)
    for (let i = 0; i < Math.min(10, pages.length); i++) {
        const page = pages[i];
        const text = page.text;
        
        console.log(`Checking page ${page.pageNumber} for index patterns...`);
        
        // Check if this page contains article listings with page numbers
        if (isIndexPage(text)) {
            console.log(`Page ${page.pageNumber} identified as index page`);
            indexPages.push(page.pageNumber);
            const pageArticles = parseIndexPage(text, page.pageNumber);
            console.log(`Found ${pageArticles.length} articles on page ${page.pageNumber}:`, pageArticles);
            articles.push(...pageArticles);
        } else {
            console.log(`Page ${page.pageNumber} is not an index page`);
        }
    }

    // If no index pages found, try to identify articles by looking for patterns
    if (articles.length === 0) {
        console.log('No index pages found, trying pattern-based extraction...');
        articles.push(...extractArticlesByPattern(pages));
    }

    // If still no articles, try the Factiva fallback method on the first page
    if (articles.length === 0 && pages.length > 0) {
        console.log('Pattern-based extraction failed, trying Factiva fallback...');
        const firstPageText = pages[0].text;
        const factivaArticles = extractFactivaArticles(firstPageText);
        console.log(`Factiva fallback found ${factivaArticles.length} articles:`, factivaArticles);
        articles.push(...factivaArticles);
    }

    // Extract text content for each article
    if (articles.length > 0) {
        console.log('Extracting text content for articles...');
        articles.forEach((article, index) => {
            article.textContent = extractArticleText(article, pages, articles, index);
            console.log(`Article "${article.title}" text length: ${article.textContent.length} characters`);
        });
        
        // Extract metadata from the RAW text content for each article (before cleaning)
        console.log('Extracting metadata from articles...');
        articles.forEach((article, index) => {
            if (article.textContent) {
                const metadata = extractArticleMetadata(article.textContent, article.title);
                Object.assign(article, metadata);
                console.log(`Metadata extracted for "${article.title}":`, metadata);
            }
        });
        
        // Store original text before cleaning for viewing purposes
        console.log('Storing original text for viewing...');
        articles.forEach((article, index) => {
            if (article.textContent) {
                article.originalTextContent = article.textContent; // Store original text
            }
        });
        
        // NOW clean the text content after metadata extraction
        console.log('Cleaning article text...');
        articles.forEach((article, index) => {
            if (article.textContent) {
                article.textContent = cleanFactivaText(article.textContent);
                console.log(`Cleaned text for "${article.title}": ${article.textContent.length} characters`);
            }
        });
        
        // Filter out articles that are excessively long (over 50,000 characters)
        articles = filterExcessivelyLongArticles(articles);
    }

    console.log(`Total articles extracted: ${articles.length}`, articles);
    return articles;
}

// Extract text content for a specific article
function extractArticleText(article, pages, allArticles, currentIndex) {
    const startPage = article.pageNumber;
    let endPage = startPage;
    
    // Find the next article's page number to determine where this article ends
    const nextArticle = allArticles.find((a, index) => index > currentIndex && a.pageNumber > startPage);
    if (nextArticle) {
        endPage = nextArticle.pageNumber - 1;
    } else {
        // If this is the last article, extract to the end of the PDF
        endPage = pages.length;
    }
    
    console.log(`Extracting text for article "${article.title}" from page ${startPage} to ${endPage}`);
    
    let articleText = '';
    
    // Extract text from each page in the range
    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
        const page = pages.find(p => p.pageNumber === pageNum);
        if (page) {
            // Add page separator if not the first page
            if (pageNum > startPage) {
                articleText += '\n\n--- Page ' + pageNum + ' ---\n\n';
            }
            articleText += page.text;
        }
    }
    
    return articleText.trim();
}

// Extract article metadata (word count, date, author, source) from article text
function extractArticleMetadata(articleText, articleTitle) {
    const metadata = {
        wordCount: null,
        publishDate: null,
        author: null,
        source: null
    };
    
    if (!articleText || articleText.length === 0) {
        return metadata;
    }
    
    // Split text into lines for analysis
    const lines = articleText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Look for the word count and date pattern in the first few lines
    for (let i = 0; i < Math.min(20, lines.length); i++) {
        const line = lines[i];
        
        // Pattern 1: "X,XXX words" or "XXX words" (word count only)
        const wordCountPattern = /^(\d{1,3}(?:,\d{3})*)\s+words$/i;
        const wordCountMatch = line.match(wordCountPattern);
        
        if (wordCountMatch) {
            // Extract word count (remove commas and convert to number)
            const wordCountStr = wordCountMatch[1].replace(/,/g, '');
            metadata.wordCount = parseInt(wordCountStr);
            
            // Look for date on the next line
            if (i + 1 < lines.length) {
                const nextLine = lines[i + 1].trim();
                const dateText = nextLine;
                metadata.publishDate = parseDate(dateText);
                
                // Look for source information after the date
                if (i + 2 < lines.length) {
                    const lineAfterDate = lines[i + 2].trim();
                    
                    // Check if this line contains a time pattern (e.g., "06:50 PM", "04:37", "11:03 AM")
                    const timePattern = /^\d{1,2}:\d{2}\s*(AM|PM|am|pm)?$/;
                    const isTimeLine = timePattern.test(lineAfterDate);
                    
                    if (isTimeLine) {
                        // If it's a time line, look for source on the next line
                        if (i + 3 < lines.length) {
                            const sourceLine = lines[i + 3].trim();
                            if (sourceLine.length > 0 && !isCommonNonSourceText(sourceLine) && isValidSourceName(sourceLine)) {
                                metadata.source = sourceLine;
                            }
                        }
                    } else {
                        // If it's not a time line, it might be the source
                        if (lineAfterDate.length > 0 && !isCommonNonSourceText(lineAfterDate) && isValidSourceName(lineAfterDate)) {
                            metadata.source = lineAfterDate;
                        }
                    }
                }
            }
            
                         // Enhanced author detection logic
             if (i > 0) {
                 const lineAboveWordCount = lines[i - 1].trim();
                 
                 // Check if the line above word count is the same as the source
                 if (metadata.source && lineAboveWordCount === metadata.source) {
                     // If they match, look above that for the actual author
                     if (i > 1) {
                         const potentialAuthor = lines[i - 2].trim();
                         
                         // Process the potential author text according to filtering rules
                         const processedAuthor = processAuthorText(potentialAuthor);
                         
                         // Only consider as author if it's different from the article title
                         // and doesn't contain common non-author patterns
                         // and is not source-like text
                         if (processedAuthor && 
                             processedAuthor !== articleTitle && 
                             !isCommonNonAuthorText(processedAuthor) &&
                             !isSourceLikeText(processedAuthor)) {
                             metadata.author = processedAuthor;
                         }
                     }
                 } else {
                     // If they don't match, check if the line above word count could be the author
                     // But first check if it looks like a source name
                     if (isSourceLikeText(lineAboveWordCount)) {
                         // If it looks like a source, look above for the actual author
                         if (i > 1) {
                             const potentialAuthor = lines[i - 2].trim();
                             const processedAuthor = processAuthorText(potentialAuthor);
                             if (processedAuthor && 
                                 processedAuthor !== articleTitle && 
                                 !isCommonNonAuthorText(processedAuthor) &&
                                 !isSourceLikeText(processedAuthor)) {
                                 metadata.author = processedAuthor;
                             }
                         }
                     } else {
                         const processedAuthor = processAuthorText(lineAboveWordCount);
                         if (processedAuthor && 
                             processedAuthor !== articleTitle && 
                             !isCommonNonAuthorText(processedAuthor) &&
                             !isSourceLikeText(processedAuthor)) {
                             metadata.author = processedAuthor;
                         }
                     }
                 }
             }
            
            console.log(`Extracted metadata for "${articleTitle}":`, metadata);
            break;
        }
        
        // Pattern 2: Legacy pattern for backward compatibility
        // "X,XXX words" or "XXX words" followed by date on same line
        const legacyPattern = /^(\d{1,3}(?:,\d{3})*)\s+words\s+(.+)$/i;
        const legacyMatch = line.match(legacyPattern);
        
        if (legacyMatch) {
            // Extract word count (remove commas and convert to number)
            const wordCountStr = legacyMatch[1].replace(/,/g, '');
            metadata.wordCount = parseInt(wordCountStr);
            
            // Extract date
            const dateText = legacyMatch[2].trim();
            metadata.publishDate = parseDate(dateText);
            
                         // Enhanced author detection logic for legacy pattern
             if (i > 0) {
                 const lineAboveWordCount = lines[i - 1].trim();
                 
                 // Check if the line above word count is the same as the source
                 if (metadata.source && lineAboveWordCount === metadata.source) {
                     // If they match, look above that for the actual author
                     if (i > 1) {
                         const potentialAuthor = lines[i - 2].trim();
                         
                         // Process the potential author text according to filtering rules
                         const processedAuthor = processAuthorText(potentialAuthor);
                         
                         // Only consider as author if it's different from the article title
                         // and doesn't contain common non-author patterns
                         // and is not source-like text
                         if (processedAuthor && 
                             processedAuthor !== articleTitle && 
                             !isCommonNonAuthorText(processedAuthor) &&
                             !isSourceLikeText(processedAuthor)) {
                             metadata.author = processedAuthor;
                         }
                     }
                 } else {
                     // If they don't match, check if the line above word count could be the author
                     // But first check if it looks like a source name
                     if (isSourceLikeText(lineAboveWordCount)) {
                         // If it looks like a source, look above for the actual author
                         if (i > 1) {
                             const potentialAuthor = lines[i - 2].trim();
                             const processedAuthor = processAuthorText(potentialAuthor);
                             if (processedAuthor && 
                                 processedAuthor !== articleTitle && 
                                 !isCommonNonAuthorText(processedAuthor) &&
                                 !isSourceLikeText(processedAuthor)) {
                                 metadata.author = processedAuthor;
                             }
                         }
                     } else {
                         const processedAuthor = processAuthorText(lineAboveWordCount);
                         if (processedAuthor && 
                             processedAuthor !== articleTitle && 
                             !isCommonNonAuthorText(processedAuthor) &&
                             !isSourceLikeText(processedAuthor)) {
                             metadata.author = processedAuthor;
                         }
                     }
                 }
             }
            
            console.log(`Extracted metadata for "${articleTitle}":`, metadata);
            break;
        }
    }
    
    return metadata;
}

// Parse date from various formats
function parseDate(dateText) {
    // Common date patterns
    const datePatterns = [
        // "1 September 2025" format
        /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/,
        // "September 1, 2025" format
        /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/,
        // "1/9/2025" format
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
        // "2025-09-01" format
        /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    ];
    
    for (const pattern of datePatterns) {
        const match = dateText.match(pattern);
        if (match) {
            try {
                if (pattern.source.includes('[A-Za-z]+')) {
                    // Text-based date format
                    const day = parseInt(match[1]);
                    const month = match[2];
                    const year = parseInt(match[3]);
                    
                    // Convert month name to number
                    const monthNames = [
                        'january', 'february', 'march', 'april', 'may', 'june',
                        'july', 'august', 'september', 'october', 'november', 'december'
                    ];
                    const monthIndex = monthNames.indexOf(month.toLowerCase());
                    
                    if (monthIndex !== -1) {
                        const date = new Date(year, monthIndex, day);
                        if (!isNaN(date.getTime())) {
                            return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
                        }
                    }
                } else {
                    // Numeric date format
                    const parts = match.slice(1).map(Number);
                    let date;
                    
                    if (pattern.source.includes('\\d{4}-')) {
                        // YYYY-MM-DD format
                        date = new Date(parts[0], parts[1] - 1, parts[2]);
                    } else {
                        // MM/DD/YYYY or DD/MM/YYYY format (assuming MM/DD/YYYY)
                        date = new Date(parts[2], parts[0] - 1, parts[1]);
                    }
                    
                    if (!isNaN(date.getTime())) {
                        return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
                    }
                }
            } catch (error) {
                console.warn('Error parsing date:', dateText, error);
            }
        }
    }
    
    // If no pattern matches, return the original text
    return dateText;
}

// Check if text is likely not an author name
function isCommonNonAuthorText(text) {
    const nonAuthorPatterns = [
        /^page\s+\d+/i,           // "Page X"
        /^©\s*\d{4}/i,           // Copyright notices
        /^factiva/i,              // Factiva references
        /^all\s+rights\s+reserved/i, // Rights text
        /^\d+$/,                  // Just numbers
        /^\s*$/,                 // Empty or whitespace only
        /^volume\s+\d+/i,        // Volume references
        /^issue\s+\d+/i,         // Issue references
        /^document\s+\d+/i       // Document references
    ];
    
    return nonAuthorPatterns.some(pattern => pattern.test(text));
}

// Check if text is likely not a source name
function isCommonNonSourceText(text) {
    const nonSourcePatterns = [
        /^page\s+\d+/i,           // "Page X"
        /^©\s*\d{4}/i,           // Copyright notices
        /^factiva/i,              // Factiva references
        /^all\s+rights\s+reserved/i, // Rights text
        /^\d+$/,                  // Just numbers
        /^\s*$/,                 // Empty or whitespace only
        /^volume\s+\d+/i,        // Volume references
        /^issue\s+\d+/i,         // Issue references
        /^document\s+\d+/i,      // Document references
        /^issn:/i,               // ISSN references
        /^english/i,              // Language indicators
        /^gaan/i,                // Common non-source text
        /^640-644/i,             // Page ranges
        /^volume\s+\d+;\s*issue\s+\d+/i, // Volume/Issue format
        /^©\s*\d{4}\s+[^.]+\s*provided\s+by/i, // Copyright provider text
        /^\d{1,2}:\d{2}\s*(AM|PM|am|pm)?$/i, // Time patterns like "04:37", "11:03 AM"
        /^\d{1,2}:\d{2}$/i       // Time patterns without AM/PM like "04:37"
    ];
    
    return nonSourcePatterns.some(pattern => pattern.test(text));
}

// Check if text is likely a valid source name
function isValidSourceName(text) {
    // Source names should be reasonably long and contain letters
    if (!text || text.length < 3) return false;
    
    // Should contain at least some letters (not just numbers or symbols)
    const letterCount = (text.match(/[A-Za-z]/g) || []).length;
    if (letterCount < 2) return false;
    
    // Should not be just a time pattern
    if (/^\d{1,2}:\d{2}\s*(AM|PM|am|pm)?$/i.test(text)) return false;
    
    // Should not be just numbers
    if (/^\d+$/.test(text)) return false;
    
    // Should not be common non-source patterns
    if (isCommonNonSourceText(text)) return false;
    
    return true;
}

// Process author text according to filtering rules
function processAuthorText(text) {
    if (!text || text.trim().length === 0) return null;
    
    // If it's a single word, ignore it
    const words = text.trim().split(/\s+/);
    if (words.length === 1) {
        return null;
    }
    
    // If it contains "|", only return the part before the pipe symbol
    if (text.includes('|')) {
        const beforePipe = text.split('|')[0].trim();
        // Check if the part before pipe is still valid (not single word)
        const beforePipeWords = beforePipe.split(/\s+/);
        if (beforePipeWords.length === 1) {
            return null;
        }
        return beforePipe;
    }
    
    // Return the original text if it passes the single word check
    return text;
}

// Check if text looks like a source name rather than an author
function isSourceLikeText(text) {
    if (!text || text.length < 3) return false;
    
    // Check if it contains "Press" as a standalone word and is more than 2 words
    const pressPattern = /\bPress\b/i;
    const wordCount = text.trim().split(/\s+/).length;
    
    if (pressPattern.test(text) && wordCount > 2) {
        return true;
    }
    
    // Check for other common source patterns
    const sourcePatterns = [
        /\b(News|Times|Post|Journal|Herald|Tribune|Gazette|Chronicle|Observer|Guardian|Telegraph|Sun|Mirror|Express|Mail|Standard|Independent|Financial|Business|Wall Street|Associated|Reuters|Bloomberg|CNN|BBC|NBC|CBS|ABC|Fox|NPR|AP|AFP|UPI|Xinhua|Kyodo|DPA|ANSA|EFE|RIA|TASS|Interfax|Sputnik|RT|Al Jazeera|DW|France 24|Euronews|Deutsche Welle|Voice of America|Radio Free Europe|Radio Liberty|Moscow Times|Times of India|Hindustan Times|The Hindu|Dawn|Gulf News|Khaleej Times|Arab News|Asharq Al-Awsat|Al-Ahram|Al-Monitor|Middle East Eye|Haaretz|Jerusalem Post|Times of Israel|Yedioth Ahronoth|Maariv|Israel Hayom|Globes|Calcalist|TheMarker|Walla|N12|Channel 2|Channel 10|Kan|Reshet|Keshet|Hot|Yes|Cellcom|Pelephone|Partner|Golan Telecom|Rami Levy|Super-Pharm|Mega|Shufersal|Victory|Coop|Osher Ad|Rami Levy|Super-Pharm|Mega|Shufersal|Victory|Coop|Osher Ad)\b/i
    ];
    
    return sourcePatterns.some(pattern => pattern.test(text));
}

// Check if a page is an index page
function isIndexPage(text) {
    // Look for multiple patterns that indicate this is an index page
    
    // Pattern 1: Multiple article titles with dots and page numbers
    const dotPattern = /[A-Z][A-Z\s]+\.{3,}\s+\d+/g;
    const dotMatches = text.match(dotPattern);
    
    // Pattern 2: Article titles followed by page numbers
    const titlePagePattern = /[A-Z][A-Z\s]+\s+\d+/g;
    const titlePageMatches = text.match(titlePagePattern);
    
    // Pattern 3: Look for multiple page numbers in sequence
    const pageNumbers = text.match(/\d+/g);
    const uniquePageNumbers = [...new Set(pageNumbers)].map(n => parseInt(n)).sort((a, b) => a - b);
    
    // Check if we have multiple potential articles
    const hasMultipleArticles = (dotMatches && dotMatches.length >= 2) || 
                             (titlePageMatches && titlePageMatches.length >= 2);
    
    // Check if page numbers make sense (not just random numbers)
    const hasReasonablePageNumbers = uniquePageNumbers.length >= 2 && 
                                   uniquePageNumbers.every((num, i) => i === 0 || num > uniquePageNumbers[i-1]);
    
    return hasMultipleArticles || hasReasonablePageNumbers;
}

// Parse index page to extract articles
function parseIndexPage(text, pageNumber) {
    const articles = [];
    
    console.log(`Parsing index page ${pageNumber} with text length: ${text.length}`);
    console.log('Text preview:', text.substring(0, 1000));
    
    // Step 1: Filter out the header text
    let cleanText = text;
    
    // Remove "Page X of Y © 2025 Factiva, Inc. All rights reserved."
    cleanText = cleanText.replace(/Page \d+ of \d+\s*© \d+ Factiva, Inc\. All rights reserved\./g, '');
    
    // Remove any remaining "Page X of Y" patterns
    cleanText = cleanText.replace(/Page \d+ of \d+/g, '');
    
    // Remove any remaining Factiva header text
    cleanText = cleanText.replace(/© \d+ Factiva, Inc\. All rights reserved\./g, '');
    
    console.log('Text after filtering headers:', cleanText.substring(0, 500));
    
    // Step 2: Find all page numbers in the text
    const pageNumbers = [];
    
    // Primary pattern: Look for numbers that are preceded by dots (indicating they are page numbers)
    const dotPagePattern = /\.{2,}\s*(\d+)/g;
    let dotMatch;
    
    while ((dotMatch = dotPagePattern.exec(cleanText)) !== null) {
        const pageNum = parseInt(dotMatch[1]);
        // Filter out very small numbers that are likely not page numbers
        if (pageNum > 1 && pageNum < 500) {
            pageNumbers.push({
                number: pageNum,
                index: dotMatch.index + dotMatch[0].length - pageNum.toString().length // Position of the page number
            });
        }
    }
    
    // Secondary pattern: Look for numbers that appear at the end of lines or after significant whitespace
    // This catches articles that might not have the standard dot format
    const endLinePattern = /(\d+)(?:\s*$|\s*\n)/g;
    let endLineMatch;
    
    while ((endLineMatch = endLinePattern.exec(cleanText)) !== null) {
        const pageNum = parseInt(endLineMatch[1]);
        // Only consider numbers that are reasonable page numbers
        if (pageNum > 1 && pageNum < 500) {
            // Check if this number is preceded by dots, significant whitespace, or appears to be a page number
            const beforeText = cleanText.substring(Math.max(0, endLineMatch.index - 30), endLineMatch.index);
            
            // Look for various indicators that this is a page number
            const isPageNumber = 
                beforeText.includes('...') || 
                beforeText.includes('..') || 
                beforeText.includes('.') ||
                beforeText.trim().endsWith('.') ||
                beforeText.match(/\s{3,}$/) || // Multiple spaces at end
                beforeText.match(/[A-Z]\s*$/); // Ends with capital letter
            
            if (isPageNumber) {
                // Check if this number is already found (avoid duplicates)
                const existingPage = pageNumbers.find(p => p.number === pageNum);
                if (!existingPage) {
                    pageNumbers.push({
                        number: pageNum,
                        index: endLineMatch.index
                    });
                }
            }
        }
    }
    
    // Tertiary pattern: Look for numbers that appear after article-like text
    // This catches articles that might have unusual formatting
    const articleNumberPattern = /([A-Z][A-Z\s]+[A-Z])\s*(\d+)/g;
    let articleMatch;
    
    while ((articleMatch = articleNumberPattern.exec(cleanText)) !== null) {
        const potentialTitle = articleMatch[1].trim();
        const pageNum = parseInt(articleMatch[2]);
        
        // Only consider if this looks like a reasonable article title and page number
        if (pageNum > 1 && pageNum < 500 && 
            potentialTitle.length > 5 && 
            !potentialTitle.includes('Page') &&
            !potentialTitle.includes('Factiva')) {
            
            // Check if this number is already found (avoid duplicates)
            const existingPage = pageNumbers.find(p => p.number === pageNum);
            if (!existingPage) {
                pageNumbers.push({
                    number: pageNum,
                    index: articleMatch.index + articleMatch[1].length
                });
            }
        }
    }
    
    // Sort page numbers by their position in the text
    pageNumbers.sort((a, b) => a.index - b.index);
    
    console.log('Found page numbers:', pageNumbers);
    
    // Step 3: Extract all text before each page number as potential article titles
    // This ensures titles are correctly linked to their page numbers
    for (let i = 0; i < pageNumbers.length; i++) {
        const currentPage = pageNumbers[i];
        
        // Find the start index for text before this page number
        let startIndex = 0;
        if (i > 0) {
            // Start from the end of the previous page number
            const previousPage = pageNumbers[i - 1];
            startIndex = previousPage.index + previousPage.number.toString().length;
        }
        
        // Find the text before this page number
        const endIndex = currentPage.index;
        
        if (endIndex > startIndex) {
            const textSegment = cleanText.substring(startIndex, endIndex).trim();
            
            // Clean up the text segment - remove excessive dots and normalize
            let cleanTitle = textSegment
                .replace(/\.{3,}/g, ' ') // Replace multiple dots with single space
                .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
                .trim();
            
            // Skip if the title is too short or contains invalid patterns
            if (cleanTitle.length >= 5 && isValidArticleTitle(cleanTitle, currentPage.number)) {
                console.log(`Article found: "${cleanTitle}" -> page ${currentPage.number}`);
                articles.push({
                    title: cleanTitle,
                    pageNumber: currentPage.number,
                    indexPage: pageNumber
                });
            }
        }
    }
    
    // Step 3.5: Handle the case where there might be text after the last page number
    // This catches articles that might be associated with the last page number
    if (pageNumbers.length > 0) {
        const lastPage = pageNumbers[pageNumbers.length - 1];
        const textAfterLastPage = cleanText.substring(lastPage.index + lastPage.number.toString().length).trim();
        
        if (textAfterLastPage.length > 0) {
            // Look for any remaining text that might be an article title
            const remainingText = textAfterLastPage
                .replace(/\.{3,}/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            
            if (remainingText.length >= 5 && isValidArticleTitle(remainingText, lastPage.number)) {
                console.log(`Last article found: "${remainingText}" -> page ${lastPage.number}`);
                articles.push({
                    title: remainingText,
                    pageNumber: lastPage.number,
                    indexPage: pageNumber
                });
            }
        }
    }
    
    // Step 4: If we still don't have enough articles, try line-based parsing as backup
    if (articles.length < 3) {
        console.log('Trying line-based parsing as backup...');
        const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Look for any line that contains a page number
            const pageMatch = line.match(/(.+?)\s*(\d+)$/);
            if (pageMatch) {
                const title = pageMatch[1].trim();
                const pageNum = parseInt(pageMatch[2]);
                
                // Clean up the title
                let cleanTitle = title
                    .replace(/\.{3,}/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                
                if (cleanTitle.length >= 5 && isValidArticleTitle(cleanTitle, pageNum)) {
                    console.log(`Backup article found: "${cleanTitle}" -> page ${pageNum}`);
                    articles.push({
                        title: cleanTitle,
                        pageNumber: pageNum,
                        indexPage: pageNumber
                    });
                }
            }
        }
    }
    
    // Step 4.5: Final attempt - look for any remaining text that looks like article titles
    if (articles.length < 5) {
        console.log('Trying final comprehensive text analysis...');
        
        // Split the text into potential segments and look for article-like patterns
        const textSegments = cleanText.split(/\d+/).filter(segment => segment.trim().length > 10);
        
        for (const segment of textSegments) {
            const cleanSegment = segment
                .replace(/\.{3,}/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            
            // Look for text that has characteristics of article titles
            if (cleanSegment.length >= 10 && 
                cleanSegment.match(/[A-Z][A-Z\s]+/) && // Contains uppercase words
                !cleanSegment.includes('Page') &&
                !cleanSegment.includes('Factiva') &&
                !cleanSegment.includes('©')) {
                
                // Try to find a page number near this segment
                const pageNumMatch = cleanText.match(new RegExp(cleanSegment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*(\\d+)'));
                if (pageNumMatch) {
                    const pageNum = parseInt(pageNumMatch[1]);
                    if (pageNum > 1 && pageNum < 500) {
                        console.log(`Comprehensive article found: "${cleanSegment}" -> page ${pageNum}`);
                        articles.push({
                            title: cleanSegment,
                            pageNumber: pageNum,
                            indexPage: pageNumber
                        });
                    }
                }
            }
        }
    }
    
    // Step 5: Remove duplicates and sort by page number
    const uniqueArticles = articles.filter((article, index, self) => 
        index === self.findIndex(a => a.pageNumber === article.pageNumber && a.title === article.title)
    );
    
    uniqueArticles.sort((a, b) => a.pageNumber - b.pageNumber);
    
    console.log(`Final articles found on page ${pageNumber}:`, uniqueArticles);
    return uniqueArticles;
}

// Helper function to validate article titles
function isValidArticleTitle(title, pageNum) {
    // Basic validation
    if (!title || !pageNum) return false;
    
    // Title should be reasonably long
    if (title.length < 3) return false;
    
    // Page number should be reasonable
    if (pageNum < 1 || pageNum > 1000) return false;
    
    // Filter out common non-article text
    const invalidPatterns = [
        'Page',
        'Factiva',
        'Inc',
        'All rights reserved',
        '©',
        'Document',
        'Unknown',
        'Dow Jones'
    ];
    
    for (const pattern of invalidPatterns) {
        if (title.includes(pattern)) return false;
    }
    
    // Title should contain some letters (not just numbers or symbols)
    const letterCount = (title.match(/[A-Za-z]/g) || []).length;
    const totalLength = title.length;
    
    if (letterCount === 0) return false;
    
    // Allow more flexibility - only require some letters, not a majority
    if (letterCount / totalLength < 0.1) return false;
    
    return true;
}

// Error checking function to filter out articles that are too long or have no text
function filterExcessivelyLongArticles(articles) {
    const maxCharacters = 50000;
    const originalCount = articles.length;
    
    // Filter out articles with text content over 50,000 characters or no text content
    const filteredArticles = articles.filter(article => {
        // Check if article has no text content
        if (!article.textContent || article.textContent.length === 0) {
            console.log(`Discarding article "${article.title}" - no text content`);
            return false;
        }
        
        // Check if article is too long
        if (article.textContent.length > maxCharacters) {
            console.log(`Discarding article "${article.title}" - too long (${article.textContent.length.toLocaleString()} characters)`);
            return false;
        }
        
        return true;
    });
    
    const discardedCount = originalCount - filteredArticles.length;
    if (discardedCount > 0) {
        console.log(`Filtered out ${discardedCount} article(s) that exceeded ${maxCharacters.toLocaleString()} characters or had no text content`);
    }
    
    return filteredArticles;
}

// Parse a single line from the index
function parseIndexLine(line) {
    // Pattern: "ARTICLE TITLE ............................................................................................................................ PAGE_NUMBER"
    const match = line.match(/^(.+?)\s*\.{3,}\s*(\d+)$/);
    
    if (match) {
        const title = match[1].trim();
        const pageNumber = parseInt(match[2]);
        
        if (title && pageNumber && title.length > 10) {
            return {
                title: title,
                pageNumber: pageNumber,
                indexPage: null
            };
        }
    }
    
    return null;
}

// Extract articles by pattern if no index is found
function extractArticlesByPattern(pages) {
    const articles = [];
    
    for (const page of pages) {
        const text = page.text;
        
        // Look for article headers (titles in all caps, followed by author info)
        const articleMatches = text.match(/[A-Z][A-Z\s]+(?:\s+[A-Z][a-z]+\s+\d+,\d+\s+words)/g);
        
        if (articleMatches) {
            for (const match of articleMatches) {
                const title = match.split(/\s+\d+,\d+\s+words/)[0].trim();
                if (title.length > 10) {
                    articles.push({
                        title: title,
                        pageNumber: page.pageNumber,
                        indexPage: null
                    });
                }
            }
        }
    }
    
    return articles;
}

// Special method for Factiva format when other methods fail
function extractFactivaArticles(text) {
    const articles = [];
    
    console.log('Extracting Factiva articles from text length:', text.length);
    console.log('Text preview:', text.substring(0, 1000));
    
    // Use the same approach as the main parsing function
    // Step 1: Filter out the header text
    let cleanText = text;
    
    // Remove "Page X of Y © 2025 Factiva, Inc. All rights reserved."
    cleanText = cleanText.replace(/Page \d+ of \d+\s*© \d+ Factiva, Inc\. All rights reserved\./g, '');
    
    // Remove any remaining "Page X of Y" patterns
    cleanText = cleanText.replace(/Page \d+ of \d+/g, '');
    
    // Remove any remaining Factiva header text
    cleanText = cleanText.replace(/© \d+ Factiva, Inc\. All rights reserved\./g, '');
    
    console.log('Text after filtering headers:', cleanText.substring(0, 500));
    
    // Step 2: Find all page numbers in the text
    const pageNumbers = [];
    
    // Primary pattern: Look for numbers that are preceded by dots (indicating they are page numbers)
    const dotPagePattern = /\.{2,}\s*(\d+)/g;
    let dotMatch;
    
    while ((dotMatch = dotPagePattern.exec(cleanText)) !== null) {
        const pageNum = parseInt(dotMatch[1]);
        // Filter out very small numbers that are likely not page numbers
        if (pageNum > 1 && pageNum < 500) {
            pageNumbers.push({
                number: pageNum,
                index: dotMatch.index + dotMatch[0].length - pageNum.toString().length // Position of the page number
            });
        }
    }
    
    // Secondary pattern: Look for numbers that appear at the end of lines or after significant whitespace
    // This catches articles that might not have the standard dot format
    const endLinePattern = /(\d+)(?:\s*$|\s*\n)/g;
    let endLineMatch;
    
    while ((endLineMatch = endLinePattern.exec(cleanText)) !== null) {
        const pageNum = parseInt(endLineMatch[1]);
        // Only consider numbers that are reasonable page numbers
        if (pageNum > 1 && pageNum < 500) {
            // Check if this number is preceded by dots, significant whitespace, or appears to be a page number
            const beforeText = cleanText.substring(Math.max(0, endLineMatch.index - 30), endLineMatch.index);
            
            // Look for various indicators that this is a page number
            const isPageNumber = 
                beforeText.includes('...') || 
                beforeText.includes('..') || 
                beforeText.includes('.') ||
                beforeText.trim().endsWith('.') ||
                beforeText.match(/\s{3,}$/) || // Multiple spaces at end
                beforeText.match(/[A-Z]\s*$/); // Ends with capital letter
            
            if (isPageNumber) {
                // Check if this number is already found (avoid duplicates)
                const existingPage = pageNumbers.find(p => p.number === pageNum);
                if (!existingPage) {
                    pageNumbers.push({
                        number: pageNum,
                        index: endLineMatch.index
                    });
                }
            }
        }
    }
    
    // Tertiary pattern: Look for numbers that appear after article-like text
    // This catches articles that might have unusual formatting
    const articleNumberPattern = /([A-Z][A-Z\s]+[A-Z])\s*(\d+)/g;
    let articleMatch;
    
    while ((articleMatch = articleNumberPattern.exec(cleanText)) !== null) {
        const potentialTitle = articleMatch[1].trim();
        const pageNum = parseInt(articleMatch[2]);
        
        // Only consider if this looks like a reasonable article title and page number
        if (pageNum > 1 && pageNum < 500 && 
            potentialTitle.length > 5 && 
            !potentialTitle.includes('Page') &&
            !potentialTitle.includes('Factiva')) {
            
            // Check if this number is already found (avoid duplicates)
            const existingPage = pageNumbers.find(p => p.number === pageNum);
            if (!existingPage) {
                pageNumbers.push({
                    number: pageNum,
                    index: articleMatch.index + articleMatch[1].length
                });
            }
        }
    }
    
    // Sort page numbers by their position in the text
    pageNumbers.sort((a, b) => a.index - b.index);
    
    console.log('Found page numbers:', pageNumbers);
    
    // Step 3: Extract all text before each page number as potential article titles
    // This ensures titles are correctly linked to their page numbers
    for (let i = 0; i < pageNumbers.length; i++) {
        const currentPage = pageNumbers[i];
        
        // Find the start index for text before this page number
        let startIndex = 0;
        if (i > 0) {
            // Start from the end of the previous page number
            const previousPage = pageNumbers[i - 1];
            startIndex = previousPage.index + previousPage.number.toString().length;
        }
        
        // Find the text before this page number
        const endIndex = currentPage.index;
        
        if (endIndex > startIndex) {
            const textSegment = cleanText.substring(startIndex, endIndex).trim();
            
            // Clean up the text segment - remove excessive dots and normalize
            let cleanTitle = textSegment
                .replace(/\.{3,}/g, ' ') // Replace multiple dots with single space
                .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
                .trim();
            
            // Skip if the title is too short or contains invalid patterns
            if (cleanTitle.length >= 5 && isValidArticleTitle(cleanTitle, currentPage.number)) {
                console.log(`Article found: "${cleanTitle}" -> page ${currentPage.number}`);
                articles.push({
                    title: cleanTitle,
                    pageNumber: currentPage.number,
                    indexPage: 1
                });
            }
        }
    }
    
    // Step 3.5: Handle the case where there might be text after the last page number
    if (pageNumbers.length > 0) {
        const lastPage = pageNumbers[pageNumbers.length - 1];
        const textAfterLastPage = cleanText.substring(lastPage.index + lastPage.number.toString().length).trim();
        
        if (textAfterLastPage.length > 0) {
            const remainingText = textAfterLastPage
                .replace(/\.{3,}/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            
            if (remainingText.length >= 5 && isValidArticleTitle(remainingText, lastPage.number)) {
                console.log(`Last article found: "${remainingText}" -> page ${lastPage.number}`);
                articles.push({
                    title: remainingText,
                    pageNumber: lastPage.number,
                    indexPage: 1
                });
            }
        }
    }
    
    // Step 3.6: Look for any text at the very beginning that might be an article title
    if (pageNumbers.length > 0) {
        const firstPage = pageNumbers[0];
        const textBeforeFirstPage = cleanText.substring(0, firstPage.index).trim();
        
        if (textBeforeFirstPage.length > 0) {
            const potentialTitle = textBeforeFirstPage
                .replace(/\.{3,}/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            
            if (potentialTitle.length >= 5 && isValidArticleTitle(potentialTitle, firstPage.number)) {
                console.log(`First article found: "${potentialTitle}" -> page ${firstPage.number}`);
                articles.push({
                    title: potentialTitle,
                    pageNumber: firstPage.number,
                    indexPage: 1
                });
            }
        }
    }
    
    // Step 4: If we still don't have enough articles, try line-based parsing as backup
    if (articles.length < 3) {
        console.log('Trying line-based parsing as backup...');
        const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Look for any line that contains a page number
            const pageMatch = line.match(/(.+?)\s*(\d+)$/);
            if (pageMatch) {
                const title = pageMatch[1].trim();
                const pageNum = parseInt(pageMatch[2]);
                
                // Clean up the title
                let cleanTitle = title
                    .replace(/\.{3,}/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                
                if (cleanTitle.length >= 5 && isValidArticleTitle(cleanTitle, pageNum)) {
                    console.log(`Backup article found: "${cleanTitle}" -> page ${pageNum}`);
                    articles.push({
                        title: cleanTitle,
                        pageNumber: pageNum,
                        indexPage: 1
                    });
                }
            }
        }
    }
    
    // Step 4.5: Final attempt - look for any remaining text that looks like article titles
    if (articles.length < 5) {
        console.log('Trying final comprehensive text analysis...');
        
        // Split the text into potential segments and look for article-like patterns
        const textSegments = cleanText.split(/\d+/).filter(segment => segment.trim().length > 10);
        
        for (const segment of textSegments) {
            const cleanSegment = segment
                .replace(/\.{3,}/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            
            // Look for text that has characteristics of article titles
            if (cleanSegment.length >= 10 && 
                cleanSegment.match(/[A-Z][A-Z\s]+/) && // Contains uppercase words
                !cleanSegment.includes('Page') &&
                !cleanSegment.includes('Factiva') &&
                !cleanSegment.includes('©')) {
                
                // Try to find a page number near this segment
                const pageNumMatch = cleanText.match(new RegExp(cleanSegment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*(\\d+)'));
                if (pageNumMatch) {
                    const pageNum = parseInt(pageNumMatch[1]);
                    if (pageNum > 1 && pageNum < 500) {
                        console.log(`Comprehensive article found: "${cleanSegment}" -> page ${pageNum}`);
                        articles.push({
                            title: cleanSegment,
                            pageNumber: pageNum,
                            indexPage: 1
                        });
                    }
                }
            }
        }
    }
    
    // Step 5: Remove duplicates and sort by page number
    const uniqueArticles = articles.filter((article, index, self) => 
        index === self.findIndex(a => a.pageNumber === article.pageNumber && a.title === article.title)
    );
    
    uniqueArticles.sort((a, b) => a.pageNumber - b.pageNumber);
    
    // Filter out articles that are excessively long (over 50,000 characters)
    const finalArticles = filterExcessivelyLongArticles(uniqueArticles);
    
    console.log(`Total Factiva articles found: ${finalArticles.length}`, finalArticles);
    return finalArticles;
}

// Show index information
function showIndexInfo(articles) {
    if (articles.length > 0) {
        const indexPageNumbers = [...new Set(articles.map(a => a.indexPage).filter(p => p))];
        if (indexPageNumbers.length > 0) {
            indexPages.textContent = `Pages ${indexPageNumbers.join(', ')}`;
            indexInfo.classList.add('show');
        }
    }
}

// Show articles list
function showArticles(articles) {
    // Just show the Google Sheets section when articles are ready
    sheetsSection.style.display = 'block';
}

// Create article element
function createArticleElement(article, index) {
    const div = document.createElement('div');
    div.className = 'article-item';
    
    const textLength = article.textContent ? article.textContent.length : 0;
    const wordCount = article.textContent ? article.textContent.split(/\s+/).filter(word => word.length > 0).length : 0;
    
    // Build metadata display
    let metadataHtml = '';
    
    if (article.publishDate) {
        metadataHtml += `<span class="article-date">${article.publishDate}</span>`;
    }
    
    if (article.author) {
        metadataHtml += `<span class="article-author">${article.author}</span>`;
    }
    
    if (article.source) {
        metadataHtml += `<span class="article-source">${article.source}</span>`;
    }
    
    div.innerHTML = `
        <div class="article-title">${article.title}</div>
        <div class="article-meta">
            <span class="article-page">Page ${article.pageNumber}</span>
            ${metadataHtml ? `<div class="article-metadata">${metadataHtml}</div>` : ''}
            <div class="article-actions">
                <button class="btn btn-small btn-secondary" onclick="viewArticle(${index})">View Text</button>
                <button class="btn btn-small" onclick="copyArticleTitle(${index})">Copy Title</button>
                <button class="btn btn-small btn-secondary" onclick="copyArticleText(${index})">Copy Text</button>
            </div>
        </div>
    `;
    return div;
}

// View article details
function viewArticle(index) {
    if (articlesData && articlesData.articles[index]) {
        const article = articlesData.articles[index];
        const textContent = article.originalTextContent || article.textContent || 'No text content available';
        
        // Create a modal or expandable section to show the text
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${article.title}</h3>
                    <span class="close" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="article-info">
                        <strong>Page:</strong> ${article.pageNumber}<br>
                        <strong>Text Length:</strong> ${textContent.length.toLocaleString()} characters<br>
                        <strong>Word Count:</strong> ${textContent.split(/\s+/).filter(word => word.length > 0).length.toLocaleString()} words
                        ${article.wordCount ? `<br><strong>Published Word Count:</strong> ${article.wordCount.toLocaleString()} words` : ''}
                        ${article.publishDate ? `<br><strong>Publish Date:</strong> ${article.publishDate}` : ''}
                                                 ${article.author ? `<br><strong>Author:</strong> ${article.author}` : ''}
                         ${article.source ? `<br><strong>Source:</strong> ${article.source}` : ''}
                    </div>
                    <div class="text-content">
                        <h4>Original Extracted Text (Before Cleaning):</h4>
                        <pre>${textContent}</pre>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
}

// Copy article title
function copyArticleTitle(index) {
    if (articlesData && articlesData.articles[index]) {
        const title = articlesData.articles[index].title;
        navigator.clipboard.writeText(title).then(() => {
            // Show temporary feedback
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            btn.style.background = '#28a745';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 1000);
        });
    }
}

// Copy article text content
function copyArticleText(index) {
    if (articlesData && articlesData.articles[index]) {
        const textContent = articlesData.articles[index].textContent;
        if (textContent) {
            navigator.clipboard.writeText(textContent).then(() => {
                // Show temporary feedback
                const btn = event.target;
                const originalText = btn.textContent;
                btn.textContent = 'Copied!';
                btn.style.background = '#28a745';
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '';
                }, 1000);
            });
        } else {
            alert('No text content available for this article.');
        }
    }
}

// Read file as ArrayBuffer
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

// Update progress bar
function updateProgress(percentage) {
    progressFill.style.width = percentage + '%';
}

// Show/hide functions
function showLoading() {
    loading.classList.add('show');
    convertBtn.disabled = true;
}

function hideLoading() {
    loading.classList.remove('show');
    convertBtn.disabled = false;
}

function showProgress() {
    progressBar.classList.add('show');
}

function hideProgress() {
    progressBar.classList.remove('show');
    progressFill.style.width = '0%';
}

function showError(message) {
    error.textContent = message;
    error.classList.add('show');
}

function hideError() {
    error.classList.remove('show');
}

function showResult(articlesData, fullData) {
    // Result display removed - data is only available for Google Sheets export
}

function hideResult() {
    // Result display removed
}

function showStats(articleCount, pageCount, totalWords) {
    document.getElementById('pageCount').textContent = pageCount;
    document.getElementById('articleCount').textContent = articleCount;
    document.getElementById('wordCount').textContent = totalWords.toLocaleString();
    
    // Add articles with text count if available
    if (articlesData && articlesData.summary.articlesWithText !== undefined) {
        const articlesWithTextElement = document.getElementById('articlesWithText');
        if (articlesWithTextElement) {
            articlesWithTextElement.textContent = articlesData.summary.articlesWithText;
        }
    }
    
    stats.classList.add('show');
}

function hideStats() {
    stats.classList.remove('show');
}

function hideIndexInfo() {
    indexInfo.classList.remove('show');
}

function hideArticlesSection() {
    // Articles section removed
}

// Download JSON
function downloadJson(data, type) {
    if (!data) return;

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    const suffix = type === 'articles' ? '_articles' : '_full';
    link.download = selectedFile.name.replace('.pdf', suffix + '.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Clear all
function clearAll() {
    selectedFile = null;
    pdfData = null;
    articlesData = null;
    fileInput.value = '';
    fileInfo.classList.remove('show');
    stats.classList.remove('show');
    indexInfo.classList.remove('show');
    sheetsSection.style.display = 'none';
    sheetsUrl.value = '';
    serviceAccountKey.value = '';
    resetSheetNameDropdown();
    sheetsStatus.style.display = 'none';
    error.classList.remove('show');
    loading.classList.remove('show');
    progressBar.classList.remove('show');
    convertBtn.disabled = true;
    hideError();
}

// Text Cleaning Functions

// Clean Factiva headers and footers from article text
function cleanFactivaText(text) {
    if (!text || typeof text !== 'string') {
        return text;
    }
    
    let cleanedText = text;
    
    // Remove common Factiva header patterns
    const headerPatterns = [
        // "Page X of Y © 2025 Factiva, Inc. All rights reserved."
        /Page\s+\d+\s+of\s+\d+\s*©\s*\d{4}\s+Factiva, Inc\.\s+All\s+rights\s+reserved\./gi,
        // "Page X of Y" (standalone)
        /^Page\s+\d+\s+of\s+\d+$/gm,
        // "© 2025 Factiva, Inc. All rights reserved."
        /©\s*\d{4}\s+Factiva, Inc\.\s+All\s+rights\s+reserved\./gi,
        // "© 2025 Factiva, Inc."
        /©\s*\d{4}\s+Factiva, Inc\./gi,
        // "All rights reserved." (standalone)
        /^All\s+rights\s+reserved\.$/gm,
        // "Factiva, Inc." (standalone)
        /^Factiva, Inc\.$/gm,
        // "Factiva" (standalone line)
        /^Factiva$/gm
    ];
    
    // Remove header patterns
    headerPatterns.forEach(pattern => {
        cleanedText = cleanedText.replace(pattern, '');
    });
    
    // Remove common Factiva footer patterns
    const footerPatterns = [
        // ISSN patterns
        /ISSN:\s*\d{4}-\d{4}/gi,
        // Volume/Issue patterns
        /Volume\s+\d+;\s*Issue\s+\d+/gi,
        /Vol\.\s*\d+;\s*Issue\s+\d+/gi,
        // Document references
        /Document\s+\d+/gi,
        // Language indicators (standalone)
        /^English$/gm,
        // Page range patterns (standalone)
        /^\d+-\d+$/gm,
        // Copyright provider text
        /©\s*\d{4}\s+[^.]+\s*provided\s+by/gi,
        // Additional common patterns
        /^Volume\s+\d+$/gm,
        /^Issue\s+\d+$/gm,
        /^Document\s+\d+$/gm
    ];
    
    // Remove footer patterns
    footerPatterns.forEach(pattern => {
        cleanedText = cleanedText.replace(pattern, '');
    });
    
    // Clean up extra whitespace and empty lines
    cleanedText = cleanedText
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace multiple newlines with double newlines
        .replace(/^\s+|\s+$/g, '') // Trim start and end
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n\s+/g, '\n') // Remove spaces at start of lines
        .replace(/\s+\n/g, '\n'); // Remove spaces at end of lines
    
    return cleanedText;
}

// Google Sheets Integration Functions

// Find the next empty row in a Google Sheet
async function findNextEmptyRow(spreadsheetId, sheetName) {
    try {
        // Read a large range to find existing data (check first 1000 rows)
        const range = `${sheetName}!A1:A1000`;
        const existingData = await sheetsAPI.readFromSheet(spreadsheetId, range);
        
        // Find the last row with data
        let lastRowWithData = 0;
        for (let i = 0; i < existingData.length; i++) {
            if (existingData[i] && existingData[i][0] && existingData[i][0].trim() !== '') {
                lastRowWithData = i + 1; // Convert to 1-based indexing
            }
        }
        
        // Return the next empty row (last row with data + 1)
        return lastRowWithData + 1;
    } catch (error) {
        console.error('Error finding next empty row:', error);
        // If there's an error reading, assume we should start from row 1
        return 1;
    }
}

// Extract spreadsheet ID from Google Sheets URL
function extractSpreadsheetId(url) {
    const patterns = [
        /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
        /\/d\/([a-zA-Z0-9-_]+)/,
        /spreadsheetId=([a-zA-Z0-9-_]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }
    
    throw new Error('Invalid Google Sheets URL. Please provide a valid Google Sheets URL.');
}

// Handle service account key file upload
async function handleServiceAccountKeyUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        showSheetsStatus('Loading service account key...', 'loading');
        
        const success = await sheetsAPI.loadServiceAccountKeyFromFile(file);
        if (success) {
            showSheetsStatus('Service account key loaded successfully!', 'success');
            updateSheetsButtons();
            
            // If there's already a URL entered, fetch sheet names
            const url = sheetsUrl.value.trim();
            if (url) {
                await fetchSheetNames();
            }
        } else {
            showSheetsStatus('Failed to load service account key. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error loading service account key:', error);
        showSheetsStatus(`Error loading service account key: ${error.message}`, 'error');
    }
}

// Test Google Sheets connection
async function testGoogleSheetsConnection() {
    try {
        showSheetsStatus('Testing connection...', 'loading');
        
        const result = await sheetsAPI.testConnection();
        if (result.success) {
            showSheetsStatus('Connection successful! Ready to write to Google Sheets.', 'success');
        } else {
            showSheetsStatus(`Connection failed: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Error testing connection:', error);
        showSheetsStatus(`Connection test failed: ${error.message}`, 'error');
    }
}

// Write articles to Google Sheets
async function writeArticlesToGoogleSheets() {
    if (!articlesData || !articlesData.articles || articlesData.articles.length === 0) {
        showSheetsStatus('No articles to write. Please extract articles first.', 'error');
        return;
    }
    
    const url = sheetsUrl.value.trim();
    const sheetNameValue = sheetName.value.trim();
    
    if (!sheetNameValue) {
        showSheetsStatus('Please select a sheet to write to.', 'error');
        return;
    }
    
    if (!url) {
        showSheetsStatus('Please enter a Google Sheets URL.', 'error');
        return;
    }
    
    try {
        showSheetsStatus('Preparing data for Google Sheets...', 'loading');
        
        // Extract spreadsheet ID from URL
        const spreadsheetId = extractSpreadsheetId(url);
        
        // Find the next empty row to append data
        showSheetsStatus('Checking for existing data...', 'loading');
        const startRow = await findNextEmptyRow(spreadsheetId, sheetNameValue);
        
        // Format articles data for Google Sheets
        // Only include headers if we're starting from row 1 (new sheet or empty sheet)
        const includeHeaders = startRow === 1;
        const formattedData = formatArticlesForSheets(articlesData.articles, includeHeaders);
        
        showSheetsStatus(`Writing to Google Sheets starting at row ${startRow}...`, 'loading');
        
        // Write to Google Sheets starting from the next empty row
        const endRow = startRow + formattedData.length - 1;
        const range = `${sheetNameValue}!A${startRow}:F${endRow}`;
        const rowsWritten = await sheetsAPI.writeToSheet(spreadsheetId, range, formattedData);
        
        showSheetsStatus(`Successfully wrote ${rowsWritten} articles to Google Sheets starting at row ${startRow}!`, 'success');
        
    } catch (error) {
        console.error('Error writing to Google Sheets:', error);
        showSheetsStatus(`Error writing to Google Sheets: ${error.message}`, 'error');
    }
}

// Format articles data for Google Sheets
function formatArticlesForSheets(articles, includeHeaders = true) {
    // Data rows
    const dataRows = articles.map(article => [
        article.source || '',
        article.title || '',
        article.author || '',
        article.url || '', // We don't have URL in current data structure
        (article.textContent || '').replace(/\n/g, ' ').substring(0, 50000), // Limit length and replace newlines
        article.publishDate || ''
    ]);
    
    if (includeHeaders) {
        // Header row
        const header = ['Source', 'Article Title', 'Article Author/s', 'Article URL', 'Article Body Text', 'Publish Date'];
        return [header, ...dataRows];
    }
    
    return dataRows;
}

// Show status message for Google Sheets operations
function showSheetsStatus(message, type) {
    sheetsStatus.textContent = message;
    sheetsStatus.className = `sheets-status ${type}`;
    sheetsStatus.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            sheetsStatus.style.display = 'none';
        }, 5000);
    }
}

// Update Google Sheets buttons state
function updateSheetsButtons() {
    const hasServiceAccount = sheetsAPI.serviceAccountKey !== null;
    const hasUrl = sheetsUrl.value.trim() !== '';
    const hasSelectedSheet = sheetName.value.trim() !== '';
    
    testConnectionBtn.disabled = !hasServiceAccount;
    writeToSheetsBtn.disabled = !hasServiceAccount || !hasUrl || !hasSelectedSheet || !articlesData;
}

// Add event listeners for URL input to enable/disable buttons
sheetsUrl.addEventListener('input', handleSheetsUrlChange);
sheetName.addEventListener('change', updateSheetsButtons);

// Handle Google Sheets URL change
async function handleSheetsUrlChange() {
    const url = sheetsUrl.value.trim();
    
    if (!url) {
        resetSheetNameDropdown();
        updateSheetsButtons();
        return;
    }
    
    // If we have a service account key loaded, try to fetch sheet names
    if (sheetsAPI.serviceAccountKey) {
        await fetchSheetNames();
    } else {
        resetSheetNameDropdown();
        updateSheetsButtons();
    }
}

// Reset sheet name dropdown to loading state
function resetSheetNameDropdown() {
    sheetName.innerHTML = '<option value="">Loading sheets...</option>';
    sheetName.disabled = true;
}

// Fetch sheet names from Google Sheets
async function fetchSheetNames() {
    const url = sheetsUrl.value.trim();
    if (!url) return;
    
    try {
        resetSheetNameDropdown();
        showSheetsStatus('Fetching sheet names...', 'loading');
        
        // Extract spreadsheet ID from URL
        const spreadsheetId = extractSpreadsheetId(url);
        
        // Get sheet names using the API
        const sheets = await sheetsAPI.listSheets(spreadsheetId);
        
        // Populate dropdown with sheet names
        populateSheetNameDropdown(sheets);
        
        showSheetsStatus(`Found ${sheets.length} sheet(s)`, 'success');
        updateSheetsButtons();
        
    } catch (error) {
        console.error('Error fetching sheet names:', error);
        showSheetsStatus(`Error fetching sheet names: ${error.message}`, 'error');
        resetSheetNameDropdown();
        updateSheetsButtons();
    }
}

// Populate sheet name dropdown with available sheets
function populateSheetNameDropdown(sheets) {
    sheetName.innerHTML = '';
    
    if (sheets.length === 0) {
        sheetName.innerHTML = '<option value="">No sheets found</option>';
        sheetName.disabled = true;
        return;
    }
    
    // Add default option
    sheetName.innerHTML = '<option value="">Select a sheet...</option>';
    
    // Add sheet options
    sheets.forEach(sheet => {
        const option = document.createElement('option');
        option.value = sheet.title;
        option.textContent = sheet.title;
        sheetName.appendChild(option);
    });
    
    // Enable dropdown
    sheetName.disabled = false;
    
    // Try to select "Articles" if it exists, otherwise select the first sheet
    const articlesOption = Array.from(sheetName.options).find(option => option.value === 'Articles');
    if (articlesOption) {
        articlesOption.selected = true;
    } else if (sheets.length > 0) {
        sheetName.selectedIndex = 1; // Select first sheet (skip the "Select a sheet..." option)
    }
}
