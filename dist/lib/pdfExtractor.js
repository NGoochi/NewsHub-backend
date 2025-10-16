"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFExtractor = void 0;
const pdf_parse_1 = require("pdf-parse");
class PDFExtractor {
    /**
     * Main extraction function - orchestrates the entire process
     */
    async extractArticles(pdfBuffer) {
        // Step 1: Extract raw text from PDF
        const pdfData = await (0, pdf_parse_1.pdf)(pdfBuffer);
        const fullText = pdfData.text;
        const pageCount = pdfData.total;
        console.log(`PDF has ${pageCount} pages, ${fullText.length} characters`);
        // Step 2: Parse into pages
        const pages = this.splitIntoPages(fullText, pageCount);
        // Step 3: Find index pages and extract article listings
        const articleIndex = this.extractArticleIndex(pages);
        console.log(`Found ${articleIndex.length} articles in index`);
        // If no articles found in index, try direct extraction from first page
        if (articleIndex.length === 0) {
            console.log('No index pages found, trying Factiva fallback extraction...');
            const firstPageText = pages.length > 0 ? pages[0].text : '';
            const factivaArticles = this.extractFactivaArticles(firstPageText);
            if (factivaArticles.length > 0) {
                articleIndex.push(...factivaArticles);
                console.log(`Factiva fallback found ${factivaArticles.length} articles`);
            }
        }
        // Step 4: Extract full text for each article
        const articles = this.extractArticleContents(articleIndex, pages);
        // Step 5: Extract metadata for each article (before cleaning)
        articles.forEach(article => {
            const metadata = this.extractMetadata(article.textContent, article.title);
            Object.assign(article, metadata);
        });
        // Step 6: Clean Factiva headers and footers (after metadata extraction)
        articles.forEach(article => {
            article.textContent = this.cleanFactivaText(article.textContent);
        });
        // Step 7: Filter out invalid articles
        const validArticles = this.filterArticles(articles);
        console.log(`Returning ${validArticles.length} valid articles`);
        return validArticles;
    }
    /**
     * Split full text into pages
     */
    splitIntoPages(fullText, pageCount) {
        const pages = [];
        // Common Factiva page marker: "Page X of Y"
        const pageMarkerRegex = /Page (\d+) of \d+/g;
        const markers = [];
        let match;
        while ((match = pageMarkerRegex.exec(fullText)) !== null) {
            markers.push({
                pageNum: parseInt(match[1]),
                index: match.index
            });
        }
        // If we found page markers, split by them
        if (markers.length > 0) {
            for (let i = 0; i < markers.length; i++) {
                const current = markers[i];
                const next = markers[i + 1];
                const pageText = next
                    ? fullText.substring(current.index, next.index)
                    : fullText.substring(current.index);
                pages.push({
                    pageNumber: current.pageNum,
                    text: pageText.trim()
                });
            }
        }
        else {
            // Fallback: Treat entire text as one page
            pages.push({
                pageNumber: 1,
                text: fullText
            });
        }
        return pages;
    }
    /**
     * Extract article index from first few pages
     */
    extractArticleIndex(pages) {
        const articles = [];
        // Check first 10 pages for index content
        const indexPages = pages.slice(0, Math.min(10, pages.length));
        for (const page of indexPages) {
            const pageArticles = this.parseIndexPage(page.text);
            articles.push(...pageArticles);
        }
        // Remove duplicates and sort by page number
        const uniqueArticles = articles.filter((article, index, self) => index === self.findIndex(a => a.pageNumber === article.pageNumber && a.title === article.title));
        return uniqueArticles.sort((a, b) => a.pageNumber - b.pageNumber);
    }
    /**
     * Parse a single index page to find article titles and page numbers
     */
    parseIndexPage(text) {
        const articles = [];
        console.log('=== PARSING INDEX PAGE ===');
        console.log('Raw text length:', text.length);
        console.log('First 500 chars of raw text:', text.substring(0, 500));
        // Clean up Factiva headers
        let cleanText = text
            .replace(/Page \d+ of \d+\s*© \d+ Factiva, Inc\. All rights reserved\./g, '')
            .replace(/Page \d+ of \d+/g, '')
            .replace(/© \d+ Factiva, Inc\. All rights reserved\./g, '');
        console.log('After cleaning, text length:', cleanText.length);
        console.log('First 500 chars after cleaning:', cleanText.substring(0, 500));
        // Pattern: "Article Title .............. PageNumber"
        const pagePattern = /\.{2,}\s*(\d+)/g;
        const matches = [];
        let match;
        while ((match = pagePattern.exec(cleanText)) !== null) {
            const pageNum = parseInt(match[1]);
            // Valid page numbers are typically 1-500
            if (pageNum > 1 && pageNum < 500) {
                console.log(`Found page pattern: ...${pageNum} at index ${match.index}`);
                matches.push({
                    number: pageNum,
                    index: match.index
                });
            }
        }
        console.log(`Total page number matches found: ${matches.length}`);
        // Extract titles (text before each page number)
        let lastIndex = 0;
        for (const current of matches) {
            const titleText = cleanText.substring(lastIndex, current.index).trim();
            // Clean the title
            let cleanTitle = titleText
                .replace(/\.{3,}/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            // Remove leading page numbers that might have been concatenated (e.g., "2Today in History" -> "Today in History")
            cleanTitle = cleanTitle.replace(/^\d+/, '').trim();
            console.log(`Extracted title candidate: "${cleanTitle}" -> page ${current.number}`);
            // Validate title
            if (cleanTitle.length >= 5 && this.isValidArticleTitle(cleanTitle)) {
                console.log(`  ✓ Valid title`);
                articles.push({
                    title: cleanTitle,
                    pageNumber: current.number
                });
            }
            else {
                console.log(`  ✗ Invalid title (length: ${cleanTitle.length}, valid: ${this.isValidArticleTitle(cleanTitle)})`);
            }
            lastIndex = current.index + current.number.toString().length;
        }
        console.log(`=== PARSE COMPLETE: ${articles.length} articles found ===\n`);
        return articles;
    }
    /**
     * Validate article title
     */
    isValidArticleTitle(title) {
        if (!title || title.length < 3)
            return false;
        // Filter out common non-article text
        const invalidPatterns = [
            'Page', 'Factiva', 'Inc', 'All rights reserved',
            '©', 'Document', 'Unknown', 'Dow Jones'
        ];
        if (invalidPatterns.some(pattern => title.includes(pattern))) {
            return false;
        }
        // Title should contain letters (not just numbers/symbols)
        const letterCount = (title.match(/[A-Za-z]/g) || []).length;
        return letterCount / title.length >= 0.1;
    }
    /**
     * Extract full text content for each article
     */
    extractArticleContents(articleIndex, pages) {
        return articleIndex.map((article, index) => {
            const startPage = article.pageNumber;
            const nextArticle = articleIndex[index + 1];
            const endPage = nextArticle ? nextArticle.pageNumber - 1 : pages.length;
            // Extract text from page range
            let textContent = '';
            for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
                const page = pages.find(p => p.pageNumber === pageNum);
                if (page) {
                    textContent += page.text + '\n\n';
                }
            }
            return {
                title: article.title,
                pageNumber: article.pageNumber,
                textContent: textContent.trim()
            };
        });
    }
    /**
     * Extract metadata from article text
     */
    extractMetadata(articleText, articleTitle) {
        const metadata = {};
        const lines = articleText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        // Look for word count pattern in first 20 lines
        for (let i = 0; i < Math.min(20, lines.length); i++) {
            const line = lines[i];
            // Pattern: "X,XXX words" or "XXX words"
            const wordCountPattern = /^(\d{1,3}(?:,\d{3})*)\s+words$/i;
            const wordCountMatch = line.match(wordCountPattern);
            if (wordCountMatch) {
                // Extract word count
                metadata.wordCount = parseInt(wordCountMatch[1].replace(/,/g, ''));
                // Next line is typically the date
                if (i + 1 < lines.length) {
                    const dateText = lines[i + 1].trim();
                    metadata.publishDate = this.parseDate(dateText);
                    // Look for source (skip time lines)
                    if (i + 2 < lines.length) {
                        const lineAfterDate = lines[i + 2].trim();
                        const timePattern = /^\d{1,2}:\d{2}\s*(AM|PM|am|pm)?$/;
                        const isTimeLine = timePattern.test(lineAfterDate);
                        if (isTimeLine && i + 3 < lines.length) {
                            const sourceLine = lines[i + 3].trim();
                            if (this.isValidSourceName(sourceLine)) {
                                metadata.source = sourceLine;
                            }
                        }
                        else if (!isTimeLine && this.isValidSourceName(lineAfterDate)) {
                            metadata.source = lineAfterDate;
                        }
                    }
                }
                // Look for author (line before word count)
                if (i > 0) {
                    const potentialAuthor = lines[i - 1].trim();
                    const processedAuthor = this.processAuthorText(potentialAuthor);
                    if (processedAuthor &&
                        processedAuthor !== articleTitle &&
                        !this.isSourceLikeText(processedAuthor)) {
                        metadata.author = processedAuthor;
                    }
                }
                break;
            }
        }
        return metadata;
    }
    /**
     * Parse date from various formats
     */
    parseDate(dateText) {
        const monthNames = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ];
        // Try "1 September 2025" format
        const match = dateText.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
        if (match) {
            const day = parseInt(match[1]);
            const month = match[2].toLowerCase();
            const year = parseInt(match[3]);
            const monthIndex = monthNames.indexOf(month);
            if (monthIndex !== -1) {
                const date = new Date(year, monthIndex, day);
                return date.toISOString().split('T')[0]; // YYYY-MM-DD
            }
        }
        // Fallback: return as-is
        return dateText;
    }
    /**
     * Process author text according to Factiva rules
     */
    processAuthorText(text) {
        if (!text || text.trim().length === 0)
            return null;
        // Single word authors are typically not valid
        const words = text.trim().split(/\s+/);
        if (words.length === 1)
            return null;
        // If contains "|", only take part before pipe
        if (text.includes('|')) {
            const beforePipe = text.split('|')[0].trim();
            const beforePipeWords = beforePipe.split(/\s+/);
            if (beforePipeWords.length === 1)
                return null;
            return beforePipe;
        }
        return text;
    }
    /**
     * Check if text is a valid source name
     */
    isValidSourceName(text) {
        if (!text || text.length < 3)
            return false;
        // Should contain letters
        const letterCount = (text.match(/[A-Za-z]/g) || []).length;
        if (letterCount < 2)
            return false;
        // Should not be time pattern
        if (/^\d{1,2}:\d{2}\s*(AM|PM|am|pm)?$/i.test(text))
            return false;
        // Should not be just numbers
        if (/^\d+$/.test(text))
            return false;
        return true;
    }
    /**
     * Check if text looks like source name rather than author
     */
    isSourceLikeText(text) {
        if (!text || text.length < 3)
            return false;
        const pressPattern = /\bPress\b/i;
        const wordCount = text.trim().split(/\s+/).length;
        return pressPattern.test(text) && wordCount > 2;
    }
    /**
     * Clean Factiva headers and footers from text
     */
    cleanFactivaText(text) {
        if (!text || typeof text !== 'string')
            return text;
        let cleanedText = text;
        // Header patterns
        const headerPatterns = [
            /Page\s+\d+\s+of\s+\d+\s*©\s*\d{4}\s+Factiva, Inc\.\s+All\s+rights\s+reserved\./gi,
            /^Page\s+\d+\s+of\s+\d+$/gm,
            /©\s*\d{4}\s+Factiva, Inc\.\s+All\s+rights\s+reserved\./gi,
            /©\s*\d{4}\s+Factiva, Inc\./gi,
            /^All\s+rights\s+reserved\.$/gm,
            /^Factiva, Inc\.$/gm,
            /^Factiva$/gm
        ];
        headerPatterns.forEach(pattern => {
            cleanedText = cleanedText.replace(pattern, '');
        });
        // Footer patterns  
        const footerPatterns = [
            /ISSN:\s*\d{4}-\d{4}/gi,
            /Volume\s+\d+;\s*Issue\s+\d+/gi,
            /Vol\.\s*\d+;\s*Issue\s+\d+/gi,
            /Document\s+\d+/gi,
            /^English$/gm,
            /^\d+-\d+$/gm,
            /©\s*\d{4}\s+[^.]+\s*provided\s+by/gi,
            /^Volume\s+\d+$/gm,
            /^Issue\s+\d+$/gm,
            /^Document\s+\d+$/gm
        ];
        footerPatterns.forEach(pattern => {
            cleanedText = cleanedText.replace(pattern, '');
        });
        // Clean up whitespace
        cleanedText = cleanedText
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .replace(/^\s+|\s+$/g, '')
            .replace(/\s+/g, ' ')
            .replace(/\n\s+/g, '\n')
            .replace(/\s+\n/g, '\n');
        return cleanedText;
    }
    /**
     * Filter out invalid articles
     */
    filterArticles(articles) {
        const maxCharacters = 50000;
        const originalCount = articles.length;
        const filtered = articles.filter(article => {
            // Must have text
            if (!article.textContent || article.textContent.length === 0) {
                console.log(`Discarding "${article.title}" - no text`);
                return false;
            }
            // Must not be too long
            if (article.textContent.length > maxCharacters) {
                console.log(`Discarding "${article.title}" - too long (${article.textContent.length.toLocaleString()} chars)`);
                return false;
            }
            return true;
        });
        const discarded = originalCount - filtered.length;
        if (discarded > 0) {
            console.log(`Filtered out ${discarded} invalid article(s)`);
        }
        return filtered;
    }
    /**
     * Extract Factiva articles directly from index text (fallback method)
     * This is used when the standard index parsing fails
     */
    extractFactivaArticles(text) {
        const articles = [];
        console.log('Extracting Factiva articles from text length:', text.length);
        // Step 1: Filter out Factiva headers
        let cleanText = text
            .replace(/Page \d+ of \d+\s*© \d+ Factiva, Inc\. All rights reserved\./g, '')
            .replace(/Page \d+ of \d+/g, '')
            .replace(/© \d+ Factiva, Inc\. All rights reserved\./g, '');
        console.log('Text after filtering headers length:', cleanText.length);
        // Step 2: Find all page numbers in the text
        const pageNumbers = [];
        // Primary pattern: Look for numbers preceded by dots (page numbers in index)
        const dotPagePattern = /\.{2,}\s*(\d+)/g;
        let dotMatch;
        while ((dotMatch = dotPagePattern.exec(cleanText)) !== null) {
            const pageNum = parseInt(dotMatch[1]);
            // Valid page numbers are typically 1-500
            if (pageNum > 1 && pageNum < 500) {
                pageNumbers.push({
                    number: pageNum,
                    index: dotMatch.index + dotMatch[0].length - pageNum.toString().length
                });
            }
        }
        // Secondary pattern: Numbers at end of lines
        const endLinePattern = /(\d+)(?:\s*$|\s*\n)/g;
        let endLineMatch;
        while ((endLineMatch = endLinePattern.exec(cleanText)) !== null) {
            const pageNum = parseInt(endLineMatch[1]);
            if (pageNum > 1 && pageNum < 500) {
                const beforeText = cleanText.substring(Math.max(0, endLineMatch.index - 30), endLineMatch.index);
                // Check for indicators this is a page number
                const isPageNumber = beforeText.includes('...') ||
                    beforeText.includes('..') ||
                    beforeText.includes('.') ||
                    beforeText.trim().endsWith('.') ||
                    /\s{3,}$/.test(beforeText) || // Multiple spaces at end
                    /[A-Z]\s*$/.test(beforeText); // Ends with capital letter
                if (isPageNumber) {
                    const existingPage = pageNumbers.find(p => p.number === pageNum && Math.abs(p.index - endLineMatch.index) < 5);
                    if (!existingPage) {
                        pageNumbers.push({
                            number: pageNum,
                            index: endLineMatch.index
                        });
                    }
                }
            }
        }
        // Tertiary pattern: Numbers after article-like text
        const articleNumberPattern = /([A-Z][A-Z\s]+[A-Z])\s*(\d+)/g;
        let articleMatch;
        while ((articleMatch = articleNumberPattern.exec(cleanText)) !== null) {
            const potentialTitle = articleMatch[1].trim();
            const pageNum = parseInt(articleMatch[2]);
            if (pageNum > 1 && pageNum < 500 &&
                potentialTitle.length > 5 &&
                !potentialTitle.includes('Page') &&
                !potentialTitle.includes('Factiva')) {
                const existingPage = pageNumbers.find(p => p.number === pageNum && Math.abs(p.index - (articleMatch.index + articleMatch[1].length)) < 5);
                if (!existingPage) {
                    pageNumbers.push({
                        number: pageNum,
                        index: articleMatch.index + articleMatch[1].length
                    });
                }
            }
        }
        // Sort page numbers by position
        pageNumbers.sort((a, b) => a.index - b.index);
        console.log('Found page numbers:', pageNumbers);
        // Step 3: Extract titles before each page number
        for (let i = 0; i < pageNumbers.length; i++) {
            const currentPage = pageNumbers[i];
            let startIndex = 0;
            if (i > 0) {
                const previousPage = pageNumbers[i - 1];
                startIndex = previousPage.index + previousPage.number.toString().length;
            }
            const endIndex = currentPage.index;
            if (endIndex > startIndex) {
                const textSegment = cleanText.substring(startIndex, endIndex).trim();
                let cleanTitle = textSegment
                    .replace(/\.{3,}/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                // Remove leading page numbers that might have been concatenated
                cleanTitle = cleanTitle.replace(/^\d+/, '').trim();
                if (cleanTitle.length >= 5 && this.isValidArticleTitle(cleanTitle)) {
                    console.log(`Article found: "${cleanTitle}" -> page ${currentPage.number}`);
                    articles.push({
                        title: cleanTitle,
                        pageNumber: currentPage.number
                    });
                }
            }
        }
        // Handle text at the beginning (before first page number)
        if (pageNumbers.length > 0) {
            const firstPage = pageNumbers[0];
            const textBeforeFirstPage = cleanText.substring(0, firstPage.index).trim();
            if (textBeforeFirstPage.length > 0) {
                let potentialTitle = textBeforeFirstPage
                    .replace(/\.{3,}/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                // Remove leading page numbers
                potentialTitle = potentialTitle.replace(/^\d+/, '').trim();
                if (potentialTitle.length >= 5 && this.isValidArticleTitle(potentialTitle)) {
                    console.log(`First article found: "${potentialTitle}" -> page ${firstPage.number}`);
                    // Insert at beginning
                    articles.unshift({
                        title: potentialTitle,
                        pageNumber: firstPage.number
                    });
                }
            }
        }
        // Remove duplicates and sort
        const uniqueArticles = articles.filter((article, index, self) => index === self.findIndex(a => a.pageNumber === article.pageNumber && a.title === article.title));
        uniqueArticles.sort((a, b) => a.pageNumber - b.pageNumber);
        console.log(`Total Factiva articles found: ${uniqueArticles.length}`, uniqueArticles);
        return uniqueArticles;
    }
}
exports.PDFExtractor = PDFExtractor;
