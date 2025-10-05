"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
/**
 * Singleton Prisma client instance shared across all controllers
 * Handles database connections and query execution
 */
const prisma = new client_1.PrismaClient();
exports.default = prisma;
