import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const connectDB = async (): Promise<void> => {
  try {
    let mongoUri = process.env.MONGODB_URI;
    
    // Check if running as bundled desktop app with config file
    const configPath = path.join(process.cwd(), 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        mongoUri = config.mongoUri;
        console.log('📦 Using bundled config.json for MongoDB connection');
      } catch (configError) {
        console.warn('⚠️ Failed to read config.json, falling back to environment variables');
      }
    }

    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment or config file');
    }

    const conn = await mongoose.connect(mongoUri, {
      dbName: 'djaja'
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

export default connectDB;
