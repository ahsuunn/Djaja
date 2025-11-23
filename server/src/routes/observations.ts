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
    const observationData: any = {
      ...req.body,
      observationId: `OBS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      performedBy: req.user!._id,
      facilityId: req.user!.facilityId,
    };

    // Set FHIR defaults
    if (!observationData.status) {
      observationData.status = 'final';
    }

    // Set FHIR category if not provided
    if (!observationData.category || observationData.category.length === 0) {
      observationData.category = [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'vital-signs',
          display: 'Vital Signs',
        }],
      }];
    }

    // Transform testType to FHIR code with LOINC if not already provided
    if (!observationData.code && req.body.testType) {
      const loincMap: { [key: string]: { code: string; display: string } } = {
        'blood-pressure': { code: '85354-9', display: 'Blood pressure panel' },
        'heart-rate': { code: '8867-4', display: 'Heart rate' },
        'spo2': { code: '59408-5', display: 'Oxygen saturation' },
        'glucose': { code: '2339-0', display: 'Glucose [Mass/volume] in Blood' },
        'ekg': { code: '11524-6', display: 'EKG study' },
        'temperature': { code: '8310-5', display: 'Body temperature' },
        'comprehensive': { code: '85354-9', display: 'Vital signs panel' },
      };

      const loinc = loincMap[req.body.testType] || { code: '85354-9', display: 'Vital Signs' };
      observationData.code = {
        coding: [{
          system: 'http://loinc.org',
          code: loinc.code,
          display: loinc.display,
        }],
        text: req.body.testType,
      };
    }

    // Set subject reference
    if (!observationData.subject && req.body.patientId) {
      observationData.subject = {
        reference: `Patient/${req.body.patientId}`,
        display: 'Patient',
      };
    }

    // Set effectiveDateTime
    if (!observationData.effectiveDateTime) {
      observationData.effectiveDateTime = new Date();
    }

    // Set issued
    if (!observationData.issued) {
      observationData.issued = new Date();
    }

    // Transform measurements to component array if provided
    if (req.body.measurements && (!observationData.component || observationData.component.length === 0)) {
      const components: any[] = [];

      if (req.body.measurements.bloodPressure) {
        const { systolic, diastolic } = req.body.measurements.bloodPressure;
        
        components.push({
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '8480-6',
              display: 'Systolic blood pressure',
            }],
          },
          valueQuantity: {
            value: systolic,
            unit: 'mmHg',
            system: 'http://unitsofmeasure.org',
            code: 'mm[Hg]',
          },
          interpretation: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
              code: systolic >= 140 ? 'H' : systolic < 90 ? 'L' : 'N',
              display: systolic >= 140 ? 'High' : systolic < 90 ? 'Low' : 'Normal',
            }],
          }],
        });

        components.push({
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '8462-4',
              display: 'Diastolic blood pressure',
            }],
          },
          valueQuantity: {
            value: diastolic,
            unit: 'mmHg',
            system: 'http://unitsofmeasure.org',
            code: 'mm[Hg]',
          },
          interpretation: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
              code: diastolic >= 90 ? 'H' : diastolic < 60 ? 'L' : 'N',
              display: diastolic >= 90 ? 'High' : diastolic < 60 ? 'Low' : 'Normal',
            }],
          }],
        });
      }

      if (req.body.measurements.heartRate) {
        const { value } = req.body.measurements.heartRate;
        components.push({
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '8867-4',
              display: 'Heart rate',
            }],
          },
          valueQuantity: {
            value,
            unit: 'beats/minute',
            system: 'http://unitsofmeasure.org',
            code: '/min',
          },
          interpretation: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
              code: value > 100 ? 'H' : value < 60 ? 'L' : 'N',
              display: value > 100 ? 'High' : value < 60 ? 'Low' : 'Normal',
            }],
          }],
        });
      }

      if (req.body.measurements.spO2) {
        const { value } = req.body.measurements.spO2;
        components.push({
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '59408-5',
              display: 'Oxygen saturation',
            }],
          },
          valueQuantity: {
            value,
            unit: '%',
            system: 'http://unitsofmeasure.org',
            code: '%',
          },
          interpretation: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
              code: value < 95 ? 'L' : 'N',
              display: value < 95 ? 'Low' : 'Normal',
            }],
          }],
        });
      }

      if (req.body.measurements.glucose) {
        const { value } = req.body.measurements.glucose;
        components.push({
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '2339-0',
              display: 'Glucose',
            }],
          },
          valueQuantity: {
            value,
            unit: 'mg/dL',
            system: 'http://unitsofmeasure.org',
            code: 'mg/dL',
          },
          interpretation: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
              code: value > 126 ? 'H' : value < 70 ? 'L' : 'N',
              display: value > 126 ? 'High' : value < 70 ? 'Low' : 'Normal',
            }],
          }],
        });
      }

      if (components.length > 0) {
        observationData.component = components;
      }
    }

    // Add FHIR meta
    observationData.meta = {
      versionId: '1',
      lastUpdated: new Date(),
      profile: ['https://satusehat.kemkes.go.id/fhir/StructureDefinition/Observation'],
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
