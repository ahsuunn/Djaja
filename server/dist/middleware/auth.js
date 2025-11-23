"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const User_1 = __importDefault(require("../models/User"));
// Cache JWT secret for performance
let jwtSecret = null;
function getJwtSecret() {
    if (jwtSecret)
        return jwtSecret;
    // Try config file first
    const configPath = path_1.default.join(process.cwd(), 'config.json');
    if (fs_1.default.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs_1.default.readFileSync(configPath, 'utf-8'));
            jwtSecret = config.jwtSecret;
            return jwtSecret;
        }
        catch (error) {
            console.warn('⚠️ Failed to read JWT secret from config.json');
        }
    }
    // Fallback to environment variable
    jwtSecret = process.env.JWT_SECRET || '';
    return jwtSecret;
}
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({ message: 'No authentication token provided' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, getJwtSecret());
        const user = await User_1.default.findById(decoded.userId).select('-password');
        if (!user || !user.isActive) {
            res.status(401).json({ message: 'Invalid or expired token' });
            return;
        }
        req.user = user;
        req.token = token;
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Authentication failed' });
    }
};
exports.auth = auth;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({
                message: 'You do not have permission to perform this action'
            });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
