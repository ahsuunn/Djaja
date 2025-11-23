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
    // Transform legacy fields to FHIR format
    const patientData: any = {
      ...req.body,
      registeredBy: req.user!._id,
      patientId: `PT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      active: true,
    };

    // Transform name to names array if not already in FHIR format
    if (req.body.name && (!req.body.names || req.body.names.length === 0)) {
      patientData.names = [{
        use: 'official',
        text: req.body.name,
        family: req.body.name.split(' ').pop() || req.body.name,
        given: req.body.name.split(' ').slice(0, -1),
      }];
    }

    // Transform address to addresses array if not already in FHIR format
    if (req.body.address && (!req.body.addresses || req.body.addresses.length === 0)) {
      patientData.addresses = [{
        use: 'home',
        type: 'physical',
        text: `${req.body.address.street || ''}, ${req.body.address.city || ''}, ${req.body.address.province || ''}`,
        line: req.body.address.street ? [req.body.address.street] : [],
        city: req.body.address.city,
        state: req.body.address.province,
        postalCode: req.body.address.postalCode,
        country: req.body.address.country || 'Indonesia',
      }];
    }

    // Transform phone to telecoms array if not already in FHIR format
    if (req.body.phoneNumber && (!req.body.telecoms || req.body.telecoms.length === 0)) {
      patientData.telecoms = [{
        system: 'phone',
        value: req.body.phoneNumber,
        use: 'mobile',
        rank: 1,
      }];
    }

    // Transform emergency contact to contacts array if not already in FHIR format
    if (req.body.emergencyContact && (!req.body.contacts || req.body.contacts.length === 0)) {
      patientData.contacts = [{
        relationship: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v2-0131',
            code: 'C',
            display: req.body.emergencyContact.relationship || 'Emergency Contact',
          }],
          text: req.body.emergencyContact.relationship,
        }],
        name: {
          text: req.body.emergencyContact.name,
        },
        telecom: req.body.emergencyContact.phoneNumber ? [{
          system: 'phone',
          value: req.body.emergencyContact.phoneNumber,
          use: 'mobile',
        }] : [],
      }];
    }

    // Add FHIR meta
    patientData.meta = {
      versionId: '1',
      lastUpdated: new Date(),
      profile: ['https://satusehat.kemkes.go.id/fhir/StructureDefinition/Patient'],
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
    // Transform legacy fields to FHIR format
    const updateData: any = { ...req.body, updatedAt: Date.now() };

    // Transform name to names array if provided
    if (req.body.name && (!req.body.names || req.body.names.length === 0)) {
      updateData.names = [{
        use: 'official',
        text: req.body.name,
        family: req.body.name.split(' ').pop() || req.body.name,
        given: req.body.name.split(' ').slice(0, -1),
      }];
    }

    // Transform address to addresses array if provided
    if (req.body.address && (!req.body.addresses || req.body.addresses.length === 0)) {
      updateData.addresses = [{
        use: 'home',
        type: 'physical',
        text: `${req.body.address.street || ''}, ${req.body.address.city || ''}, ${req.body.address.province || ''}`,
        line: req.body.address.street ? [req.body.address.street] : [],
        city: req.body.address.city,
        state: req.body.address.province,
        postalCode: req.body.address.postalCode,
        country: req.body.address.country || 'Indonesia',
      }];
    }

    // Transform phone to telecoms array if provided
    if (req.body.phoneNumber && (!req.body.telecoms || req.body.telecoms.length === 0)) {
      updateData.telecoms = [{
        system: 'phone',
        value: req.body.phoneNumber,
        use: 'mobile',
        rank: 1,
      }];
    }

    // Update meta version
    const existingPatient = await Patient.findById(req.params.id);
    if (existingPatient?.meta?.versionId) {
      const currentVersion = parseInt(existingPatient.meta.versionId);
      updateData.meta = {
        ...existingPatient.meta,
        versionId: String(currentVersion + 1),
        lastUpdated: new Date(),
      };
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      updateData,
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
