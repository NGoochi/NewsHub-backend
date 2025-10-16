-- Fix foreign key constraints to use CASCADE deletion
-- This allows proper cascade deletion of projects and their related data

-- Drop existing foreign key constraints
ALTER TABLE "Article" DROP CONSTRAINT "Article_projectId_fkey";
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_articleId_fkey";
ALTER TABLE "AnalysisBatch" DROP CONSTRAINT "AnalysisBatch_projectId_fkey";
ALTER TABLE "ImportSession" DROP CONSTRAINT "ImportSession_projectId_fkey";

-- Recreate foreign key constraints with CASCADE deletion
ALTER TABLE "Article" ADD CONSTRAINT "Article_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalysisBatch" ADD CONSTRAINT "AnalysisBatch_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImportSession" ADD CONSTRAINT "ImportSession_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
