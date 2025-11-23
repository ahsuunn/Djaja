import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import User, { IUser } from '../models/User';

interface JwtPayload {
  userId: string;
  role: string;
}

// Cache JWT secret for performance
let jwtSecret: string | null = null;

function getJwtSecret(): string {
  if (jwtSecret) return jwtSecret;
  
  // Try config file first
  const configPath = path.join(process.cwd(), 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      jwtSecret = config.jwtSecret;
      return jwtSecret!;
    } catch (error) {
      console.warn('⚠️ Failed to read JWT secret from config.json');
    }
  }
  
  // Fallback to environment variable
  jwtSecret = process.env.JWT_SECRET || '';
  return jwtSecret;
}

export const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ message: 'No authentication token provided' });
      return;
    }

    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    const user = await User.findById(decoded.userId).select('-password');

    if (!user || !user.isActive) {
      res.status(401).json({ message: 'Invalid or expired token' });
      return;
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ 
        message: 'You do not have permission to perform this action' 
      });
      return;
    }
    next();
  };
};
