import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

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
