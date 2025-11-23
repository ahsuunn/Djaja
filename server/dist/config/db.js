"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const connectDB = async () => {
    try {
        let mongoUri = process.env.MONGODB_URI;
        // Check if running as bundled desktop app with config file
        const configPath = path_1.default.join(process.cwd(), 'config.json');
        if (fs_1.default.existsSync(configPath)) {
            try {
                const config = JSON.parse(fs_1.default.readFileSync(configPath, 'utf-8'));
                mongoUri = config.mongoUri;
                console.log('📦 Using bundled config.json for MongoDB connection');
            }
            catch (configError) {
                console.warn('⚠️ Failed to read config.json, falling back to environment variables');
            }
        }
        if (!mongoUri) {
            throw new Error('MongoDB URI not found in environment or config file');
        }
        const conn = await mongoose_1.default.connect(mongoUri, {
            dbName: 'djaja'
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    }
    catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};
exports.default = connectDB;
