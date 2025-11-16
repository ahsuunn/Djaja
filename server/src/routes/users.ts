import express, { Request, Response, Router } from 'express';
import { auth, authorize } from '../middleware/auth';
import User from '../models/User';

const router: Router = express.Router();

// @route   GET /api/users
// @desc    Get all users
// @access  Private (admin)
router.get('/', auth, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find({ isActive: true })
      .select('-password')
      .populate('facilityId')
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('facilityId');

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
