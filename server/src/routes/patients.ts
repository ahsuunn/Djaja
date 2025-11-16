import express, { Request, Response, Router } from 'express';
import { auth, authorize } from '../middleware/auth';
import Patient from '../models/Patient';
import AuditLog from '../models/AuditLog';

const router: Router = express.Router();

// @route   GET /api/patients
// @desc    Get all patients
// @access  Private (doctor, nakes, admin)
router.get('/', auth, authorize('doctor', 'nakes', 'admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const patients = await Patient.find({ isActive: true })
      .populate('facilityId')
      .populate('registeredBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ patients });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/patients/:id
// @desc    Get patient by ID
// @access  Private
router.get('/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('facilityId')
      .populate('registeredBy', 'name email role');

    if (!patient) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }

    res.json({ patient });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/patients
// @desc    Create new patient
// @access  Private (nakes, admin)
router.post('/', auth, authorize('nakes', 'admin', 'doctor'), async (req: Request, res: Response): Promise<void> => {
  try {
    const patientData = {
      ...req.body,
      registeredBy: req.user!._id,
      patientId: `PT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };

    const patient = new Patient(patientData);
    await patient.save();

    // Create audit log
    await AuditLog.create({
      userId: req.user!._id,
      action: 'PATIENT_CREATED',
      resourceType: 'Patient',
      resourceId: patient._id,
      details: { patientId: patient.patientId, name: patient.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({ message: 'Patient created successfully', patient });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/patients/:id
// @desc    Update patient
// @access  Private (nakes, admin, doctor)
router.put('/:id', auth, authorize('nakes', 'admin', 'doctor'), async (req: Request, res: Response): Promise<void> => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    if (!patient) {
      res.status(404).json({ message: 'Patient not found' });
      return;
    }

    // Create audit log
    await AuditLog.create({
      userId: req.user!._id,
      action: 'PATIENT_UPDATED',
      resourceType: 'Patient',
      resourceId: patient._id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.json({ message: 'Patient updated successfully', patient });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
