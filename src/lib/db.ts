import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client instance shared across all controllers
 * Handles database connections and query execution
 */
const prisma = new PrismaClient();

export default prisma;
