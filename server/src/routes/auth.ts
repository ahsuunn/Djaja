import express, { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import AuditLog from '../models/AuditLog';

const router: Router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public (should be protected in production)
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['admin', 'doctor', 'nakes', 'patient']).withMessage('Invalid role'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { name, email, password, role, facilityId, licenseNumber, specialization, phoneNumber } = req.body;

      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        res.status(400).json({ message: 'User already exists with this email' });
        return;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      user = new User({
        name,
        email,
        password: hashedPassword,
        role,
        facilityId,
        licenseNumber,
        specialization,
        phoneNumber,
      });

      await user.save();

      // Create audit log
      await AuditLog.create({
        userId: user._id,
        action: 'USER_REGISTERED',
        resourceType: 'User',
        resourceId: user._id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined');
      }

      const token = jwt.sign(
        { userId: user._id, role: user.role },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRE || '7d' } as jwt.SignOptions
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Server error during registration' });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password } = req.body;

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      // Check if user is active
      if (!user.isActive) {
        res.status(401).json({ message: 'Account is deactivated' });
        return;
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Create audit log
      await AuditLog.create({
        userId: user._id,
        action: 'USER_LOGIN',
        resourceType: 'User',
        resourceId: user._id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined');
      }

      const token = jwt.sign(
        { userId: user._id, role: user.role },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRE || '7d' } as jwt.SignOptions
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          facilityId: user.facilityId,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    const user = await User.findById(decoded.userId).select('-password').populate('facilityId');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
