import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Load article analysis prompt
  const articleAnalysisPath = path.join(__dirname, '..', 'NewsHub-docs', 'docs', 'prompts', 'article-analysis.md');
  const articleAnalysisContent = fs.readFileSync(articleAnalysisPath, 'utf-8');

  // Load quote analysis prompt
  const quoteAnalysisPath = path.join(__dirname, '..', 'NewsHub-docs', 'docs', 'prompts', 'quote-analysis.md');
  const quoteAnalysisContent = fs.readFileSync(quoteAnalysisPath, 'utf-8');

  // Load categories
  const categoriesPath = path.join(__dirname, '..', 'NewsHub-docs', 'docs', 'prompts', 'category-definitions.md');
  const categoriesContent = fs.readFileSync(categoriesPath, 'utf-8');
  const categories = JSON.parse(categoriesContent.trim());

  // Seed PromptTemplate for article analysis
  const existingArticlePrompt = await prisma.promptTemplate.findFirst({
    where: { type: 'article-analysis' }
  });

  if (!existingArticlePrompt) {
    await prisma.promptTemplate.create({
      data: {
        type: 'article-analysis',
        content: articleAnalysisContent,
        version: 1,
        isActive: true,
        description: 'Initial article analysis prompt - analyzes articles for summary, category, sentiment, and translation'
      }
    });
    console.log('✅ Created article-analysis prompt template');
  } else {
    console.log('⏭️  Article-analysis prompt already exists, skipping');
  }

  // Seed PromptTemplate for quote analysis
  const existingQuotePrompt = await prisma.promptTemplate.findFirst({
    where: { type: 'quote-analysis' }
  });

  if (!existingQuotePrompt) {
    await prisma.promptTemplate.create({
      data: {
        type: 'quote-analysis',
        content: quoteAnalysisContent,
        version: 1,
        isActive: true,
        description: 'Initial quote analysis prompt - extracts stakeholders and quotes from articles'
      }
    });
    console.log('✅ Created quote-analysis prompt template');
  } else {
    console.log('⏭️  Quote-analysis prompt already exists, skipping');
  }

  // Seed Categories
  console.log(`\n📋 Processing ${categories.length} categories...`);
  let createdCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    
    const existingCategory = await prisma.category.findUnique({
      where: { name: cat.category }
    });

    if (!existingCategory) {
      await prisma.category.create({
        data: {
          name: cat.category,
          definition: cat.definition,
          keywords: cat.keywords,
          isActive: true,
          sortOrder: i
        }
      });
      createdCount++;
      console.log(`  ✅ Created category: ${cat.category}`);
    } else {
      skippedCount++;
      console.log(`  ⏭️  Category already exists: ${cat.category}`);
    }
  }

  console.log(`\n✅ Seed completed!`);
  console.log(`   - Prompts: 2 checked`);
  console.log(`   - Categories: ${createdCount} created, ${skippedCount} skipped`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
