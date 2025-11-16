const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Patient = require('../models/Patient');
const Observation = require('../models/Observation');

// @route   GET /api/fhir/Patient/:id
// @desc    Get patient in FHIR format
// @access  Private
router.get('/Patient/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Convert to FHIR R4 format
    const fhirPatient = {
      resourceType: 'Patient',
      id: patient._id.toString(),
      identifier: [
        {
          system: 'http://djaja-diagnostics.com/patient-id',
          value: patient.patientId,
        },
      ],
      active: patient.isActive,
      name: [
        {
          use: 'official',
          text: patient.name,
        },
      ],
      telecom: [
        {
          system: 'phone',
          value: patient.phoneNumber,
          use: 'mobile',
        },
      ],
      gender: patient.gender,
      birthDate: patient.dateOfBirth.toISOString().split('T')[0],
      address: [
        {
          use: 'home',
          line: [patient.address?.street || ''],
          city: patient.address?.city || '',
          state: patient.address?.province || '',
          postalCode: patient.address?.postalCode || '',
          country: patient.address?.country || 'Indonesia',
        },
      ],
    };

    res.json(fhirPatient);
  } catch (error) {
    console.error('Get FHIR patient error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/fhir/Observation/:id
// @desc    Get observation in FHIR format
// @access  Private
router.get('/Observation/:id', auth, async (req, res) => {
  try {
    const observation = await Observation.findById(req.params.id)
      .populate('patientId')
      .populate('performedBy');

    if (!observation) {
      return res.status(404).json({ message: 'Observation not found' });
    }

    // Convert to FHIR R4 format
    const components = [];

    if (observation.measurements.bloodPressure) {
      components.push({
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '8480-6',
              display: 'Systolic blood pressure',
            },
          ],
        },
        valueQuantity: {
          value: observation.measurements.bloodPressure.systolic,
          unit: 'mmHg',
          system: 'http://unitsofmeasure.org',
          code: 'mm[Hg]',
        },
      });
      components.push({
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '8462-4',
              display: 'Diastolic blood pressure',
            },
          ],
        },
        valueQuantity: {
          value: observation.measurements.bloodPressure.diastolic,
          unit: 'mmHg',
          system: 'http://unitsofmeasure.org',
          code: 'mm[Hg]',
        },
      });
    }

    if (observation.measurements.heartRate) {
      components.push({
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '8867-4',
              display: 'Heart rate',
            },
          ],
        },
        valueQuantity: {
          value: observation.measurements.heartRate.value,
          unit: 'bpm',
          system: 'http://unitsofmeasure.org',
          code: '/min',
        },
      });
    }

    const fhirObservation = {
      resourceType: 'Observation',
      id: observation._id.toString(),
      identifier: [
        {
          system: 'http://djaja-diagnostics.com/observation-id',
          value: observation.observationId,
        },
      ],
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs',
            },
          ],
        },
      ],
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '85353-1',
            display: 'Vital signs, weight, height, head circumference, oxygen saturation and BMI panel',
          },
        ],
        text: observation.testType,
      },
      subject: {
        reference: `Patient/${observation.patientId._id}`,
        display: observation.patientId.name,
      },
      effectiveDateTime: observation.createdAt.toISOString(),
      performer: [
        {
          reference: `Practitioner/${observation.performedBy._id}`,
          display: observation.performedBy.name,
        },
      ],
      component: components,
    };

    res.json(fhirObservation);
  } catch (error) {
    console.error('Get FHIR observation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/fhir/Observation
// @desc    Create observation from FHIR format
// @access  Private
router.post('/Observation', auth, async (req, res) => {
  try {
    // This is a simplified FHIR receiver
    // In production, you'd validate the FHIR resource structure
    res.status(201).json({ 
      message: 'FHIR Observation endpoint ready',
      note: 'Use /api/observations for creating observations' 
    });
  } catch (error) {
    console.error('Create FHIR observation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
