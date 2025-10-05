"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 8080;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Basic health check
app.get("/", (_, res) => res.send("NewsHub API running!"));
// Example: list all projects
app.get("/projects", async (_, res) => {
    const projects = await prisma.project.findMany({ include: { articles: true } });
    res.json(projects);
});
// Example: create a project
app.post("/projects", async (req, res) => {
    const { name, description } = req.body;
    const project = await prisma.project.create({ data: { name, description } });
    res.json(project);
});
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
