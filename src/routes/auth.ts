import express from 'express';
import { login, verifyToken } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes (require authentication)
router.get('/verify', authenticateToken, verifyToken);

export default router;
