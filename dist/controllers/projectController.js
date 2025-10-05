"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.updateProject = exports.getProjectById = exports.getAllProjects = exports.createProject = void 0;
const db_1 = __importDefault(require("../lib/db"));
const validation_1 = require("../utils/validation");
/**
 * Create a new project
 * POST /projects
 */
const createProject = async (req, res) => {
    try {
        const { name, description } = req.body;
        // Validate input data
        const validation = (0, validation_1.validateProjectData)({ name, description });
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: validation.errors.join(', ')
            });
        }
        const project = await db_1.default.project.create({
            data: { name, description }
        });
        res.status(201).json({
            success: true,
            data: project,
            error: null
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to create project"
        });
    }
};
exports.createProject = createProject;
/**
 * Get all projects with their articles
 * GET /projects
 */
const getAllProjects = async (req, res) => {
    try {
        const projects = await db_1.default.project.findMany({
            include: {
                articles: {
                    include: {
                        quotes: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({
            success: true,
            data: projects,
            error: null
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to fetch projects"
        });
    }
};
exports.getAllProjects = getAllProjects;
/**
 * Get a specific project by ID
 * GET /projects/:id
 */
const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await db_1.default.project.findUnique({
            where: { id },
            include: {
                articles: {
                    include: {
                        quotes: true
                    }
                }
            }
        });
        if (!project) {
            return res.status(404).json({
                success: false,
                error: "Project not found"
            });
        }
        res.json({
            success: true,
            data: project,
            error: null
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to fetch project"
        });
    }
};
exports.getProjectById = getProjectById;
/**
 * Update an existing project
 * PUT /projects/:id
 */
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        // Validate input data
        const validation = (0, validation_1.validateProjectData)({ name, description });
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: validation.errors.join(', ')
            });
        }
        // Check if project exists
        const existingProject = await db_1.default.project.findUnique({
            where: { id }
        });
        if (!existingProject) {
            return res.status(404).json({
                success: false,
                error: "Project not found"
            });
        }
        const project = await db_1.default.project.update({
            where: { id },
            data: { name, description }
        });
        res.json({
            success: true,
            data: project,
            error: null
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to update project"
        });
    }
};
exports.updateProject = updateProject;
/**
 * Delete a project and all associated articles/quotes
 * DELETE /projects/:id
 */
const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.project.delete({
            where: { id }
        });
        res.json({
            success: true,
            data: { message: "Project deleted successfully" },
            error: null
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to delete project"
        });
    }
};
exports.deleteProject = deleteProject;
