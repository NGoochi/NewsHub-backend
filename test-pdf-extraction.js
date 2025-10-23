// Quick test script to debug PDF extraction
const fs = require('fs');
const path = require('path');

// Import the compiled JavaScript version
const { PDFExtractor } = require('./dist/lib/pdfExtractor');

async function testExtraction() {
  try {
    // Check if there's a test PDF file
    const testPdfPath = process.argv[2];
    
    if (!testPdfPath) {
      console.log('Usage: node test-pdf-extraction.js <path-to-pdf>');
      console.log('Example: node test-pdf-extraction.js "Reference/Factiva Demo/test.pdf"');
      return;
    }
    
    if (!fs.existsSync(testPdfPath)) {
      console.error(`File not found: ${testPdfPath}`);
      return;
    }
    
    console.log(`\n📄 Testing PDF extraction on: ${testPdfPath}\n`);
    
    // Read the PDF file
    const pdfBuffer = fs.readFileSync(testPdfPath);
    console.log(`✅ File loaded: ${pdfBuffer.length} bytes\n`);
    
    // Extract articles
    const extractor = new PDFExtractor();
    const articles = await extractor.extractArticles(pdfBuffer);
    
    console.log(`\n📊 RESULTS:`);
    console.log(`   Found ${articles.length} articles\n`);
    
    if (articles.length > 0) {
      console.log('📝 Articles:');
      articles.forEach((article, index) => {
        console.log(`\n  ${index + 1}. "${article.title}"`);
        console.log(`     Page: ${article.pageNumber}`);
        console.log(`     Source: ${article.source || 'N/A'}`);
        console.log(`     Author: ${article.author || 'N/A'}`);
        console.log(`     Date: ${article.publishDate || 'N/A'}`);
        console.log(`     Word Count: ${article.wordCount || 'N/A'}`);
        console.log(`     Text Length: ${article.textContent?.length || 0} chars`);
      });
    } else {
      console.log('❌ No articles found!');
      console.log('\nThis usually means:');
      console.log('  1. The PDF format is not recognized as a Factiva index');
      console.log('  2. The page markers are not being detected correctly');
      console.log('  3. The article title patterns are not matching');
    }
    
  } catch (error) {
    console.error('\n❌ Error during extraction:');
    console.error(error);
  }
}

testExtraction();

