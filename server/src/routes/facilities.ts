import express, { Request, Response, Router } from 'express';
import { auth, authorize } from '../middleware/auth';
import Facility from '../models/Facility';

const router: Router = express.Router();

// @route   GET /api/facilities
// @desc    Get all facilities
// @access  Private
router.get('/', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const facilities = await Facility.find({ isActive: true }).sort({ name: 1 });
    res.json({ facilities });
  } catch (error) {
    console.error('Get facilities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/facilities/:id
// @desc    Get facility by ID
// @access  Private
router.get('/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const facility = await Facility.findById(req.params.id);
    
    if (!facility) {
      res.status(404).json({ message: 'Facility not found' });
      return;
    }

    res.json({ facility });
  } catch (error) {
    console.error('Get facility error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/facilities
// @desc    Create new facility
// @access  Private (admin)
router.post('/', auth, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const facilityData = {
      ...req.body,
      facilityId: `FAC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };

    const facility = new Facility(facilityData);
    await facility.save();

    res.status(201).json({ message: 'Facility created successfully', facility });
  } catch (error) {
    console.error('Create facility error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
