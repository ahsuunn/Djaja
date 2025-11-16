import express, { Request, Response, Router } from 'express';
import { auth, authorize } from '../middleware/auth';
import Observation from '../models/Observation';
import AuditLog from '../models/AuditLog';

const router: Router = express.Router();

// @route   GET /api/observations
// @desc    Get all observations
// @access  Private
router.get('/', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId, status, limit = '50' } = req.query;
    
    const filter: any = {};
    if (patientId) filter.patientId = patientId;
    if (status) filter.overallStatus = status;

    const observations = await Observation.find(filter)
      .populate('patientId', 'name patientId')
      .populate('performedBy', 'name role')
      .populate('reviewedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string));

    res.json({ observations });
  } catch (error) {
    console.error('Get observations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/observations
// @desc    Create new observation
// @access  Private (nakes, doctor)
router.post('/', auth, authorize('nakes', 'doctor'), async (req: Request, res: Response): Promise<void> => {
  try {
    const observationData = {
      ...req.body,
      observationId: `OBS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      performedBy: req.user!._id,
      facilityId: req.user!.facilityId,
    };

    const observation = new Observation(observationData);
    await observation.save();

    // Create audit log
    await AuditLog.create({
      userId: req.user!._id,
      action: 'OBSERVATION_CREATED',
      resourceType: 'Observation',
      resourceId: observation._id,
      details: { 
        observationId: observation.observationId, 
        testType: observation.testType,
        patientId: observation.patientId,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({ 
      message: 'Observation created successfully', 
      observation 
    });
  } catch (error) {
    console.error('Create observation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/observations/:id/review
// @desc    Add doctor review to observation
// @access  Private (doctor)
router.put('/:id/review', auth, authorize('doctor'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorNotes } = req.body;

    const observation = await Observation.findByIdAndUpdate(
      req.params.id,
      {
        doctorNotes,
        reviewedBy: req.user!._id,
        reviewedAt: Date.now(),
        updatedAt: Date.now(),
      },
      { new: true }
    ).populate('patientId').populate('performedBy').populate('reviewedBy');

    if (!observation) {
      res.status(404).json({ message: 'Observation not found' });
      return;
    }

    // Create audit log
    await AuditLog.create({
      userId: req.user!._id,
      action: 'OBSERVATION_REVIEWED',
      resourceType: 'Observation',
      resourceId: observation._id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ message: 'Review added successfully', observation });
  } catch (error) {
    console.error('Review observation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/observations/stats
// @desc    Get observation statistics
// @access  Private
router.get('/stats/summary', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const totalTests = await Observation.countDocuments();
    const criticalTests = await Observation.countDocuments({ overallStatus: 'critical' });
    const warningTests = await Observation.countDocuments({ overallStatus: 'warning' });
    const normalTests = await Observation.countDocuments({ overallStatus: 'normal' });
    
    const recentTests = await Observation.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('patientId', 'name patientId')
      .populate('performedBy', 'name');

    res.json({
      stats: {
        total: totalTests,
        critical: criticalTests,
        warning: warningTests,
        normal: normalTests,
      },
      recentTests,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
