"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Login controller
 * Validates password and returns JWT token
 */
const login = async (req, res) => {
    try {
        const { password } = req.body;
        // Validate input
        if (!password) {
            return res.status(400).json({
                success: false,
                error: 'Password is required'
            });
        }
        // Check environment variables
        const appPassword = process.env.APP_PASSWORD;
        const jwtSecret = process.env.JWT_SECRET;
        const jwtExpiry = process.env.JWT_EXPIRY || '24h';
        if (!appPassword || !jwtSecret) {
            console.error('Missing required environment variables: APP_PASSWORD or JWT_SECRET');
            return res.status(500).json({
                success: false,
                error: 'Server configuration error'
            });
        }
        // Validate password
        if (password !== appPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid password'
            });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({
            authenticated: true,
            timestamp: Date.now()
        }, jwtSecret, { expiresIn: jwtExpiry });
        // Calculate expiry time
        const expiresIn = jwtExpiry;
        const expiresAt = new Date(Date.now() + parseExpiry(jwtExpiry));
        res.json({
            success: true,
            data: {
                token,
                expiresIn,
                expiresAt: expiresAt.toISOString()
            },
            error: null
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.login = login;
/**
 * Verify token controller
 * Returns token validity status
 */
const verifyToken = async (req, res) => {
    try {
        // If we reach here, the token is valid (middleware already verified it)
        res.json({
            success: true,
            data: {
                valid: true,
                user: req.user
            },
            error: null
        });
    }
    catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.verifyToken = verifyToken;
/**
 * Helper function to parse expiry string to milliseconds
 */
function parseExpiry(expiry) {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
        return 24 * 60 * 60 * 1000; // Default to 24 hours
    }
    const value = parseInt(match[1]);
    const unit = match[2];
    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return 24 * 60 * 60 * 1000;
    }
}
