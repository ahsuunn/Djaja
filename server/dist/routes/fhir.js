"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Patient_1 = __importDefault(require("../models/Patient"));
const Observation_1 = __importDefault(require("../models/Observation"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Apply auth middleware to all routes
router.use(auth_1.auth);
// @route   GET /api/fhir/Patient/:id
// @desc    Get Patient in FHIR R4 format
// @access  Private
router.get('/Patient/:id', async (req, res) => {
    try {
        const patient = await Patient_1.default.findById(req.params.id);
        if (!patient) {
            res.status(404).json({ message: 'Patient not found' });
            return;
        }
        // Convert to FHIR R4 format
        const fhirPatient = {
            resourceType: 'Patient',
            id: String(patient._id),
            identifier: [
                {
                    system: 'http://djaja.health/patient-id',
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
            telecom: patient.phoneNumber
                ? [
                    {
                        system: 'phone',
                        value: patient.phoneNumber,
                        use: 'mobile',
                    },
                ]
                : [],
            gender: patient.gender,
            birthDate: patient.dateOfBirth.toISOString().split('T')[0],
            address: patient.address ? [
                {
                    use: 'home',
                    type: 'physical',
                    line: [patient.address.street],
                    city: patient.address.city,
                    state: patient.address.province,
                    postalCode: patient.address.postalCode,
                    country: patient.address.country,
                },
            ] : [],
            contact: patient.emergencyContact
                ? [
                    {
                        relationship: [
                            {
                                text: patient.emergencyContact.relationship,
                            },
                        ],
                        name: {
                            text: patient.emergencyContact.name,
                        },
                        telecom: [
                            {
                                system: 'phone',
                                value: patient.emergencyContact.phoneNumber,
                            },
                        ],
                    },
                ]
                : [],
        };
        res.json(fhirPatient);
    }
    catch (error) {
        console.error('Error fetching FHIR Patient:', error);
        res.status(500).json({
            message: 'Server error fetching patient',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// @route   GET /api/fhir/Observation/:id
// @desc    Get Observation in FHIR R4 format
// @access  Private
router.get('/Observation/:id', async (req, res) => {
    try {
        // Try to find by MongoDB _id first
        let observation = await Observation_1.default.findById(req.params.id)
            .populate('patientId', 'name patientId')
            .populate('performedBy', 'name licenseNumber')
            .populate('reviewedBy', 'name licenseNumber');
        // If not found, try to find by observationId
        if (!observation) {
            observation = await Observation_1.default.findOne({ observationId: req.params.id })
                .populate('patientId', 'name patientId')
                .populate('performedBy', 'name licenseNumber')
                .populate('reviewedBy', 'name licenseNumber');
        }
        if (!observation) {
            res.status(404).json({ message: 'Observation not found' });
            return;
        }
        // Convert to FHIR R4 format
        const fhirObservation = {
            resourceType: 'Observation',
            id: String(observation._id),
            identifier: [
                {
                    system: 'http://djaja.health/observation-id',
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
                        code: getLoincCode(observation.testType || 'comprehensive'),
                        display: getDisplayName(observation.testType || 'comprehensive'),
                    },
                ],
                text: observation.testType || 'comprehensive',
            },
            subject: observation.patientId ? {
                reference: `Patient/${observation.patientId._id}`,
                display: observation.patientId.name,
            } : undefined,
            effectiveDateTime: observation.createdAt.toISOString(),
            performer: observation.performedBy ? [
                {
                    reference: `Practitioner/${observation.performedBy._id}`,
                    display: observation.performedBy.name,
                },
            ] : [],
            component: [],
        };
        // Add measurements as components
        if (observation.measurements.bloodPressure) {
            fhirObservation.component.push({
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
            }, {
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
            fhirObservation.component.push({
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
                    unit: 'beats/minute',
                    system: 'http://unitsofmeasure.org',
                    code: '/min',
                },
            });
        }
        if (observation.measurements.spO2) {
            fhirObservation.component.push({
                code: {
                    coding: [
                        {
                            system: 'http://loinc.org',
                            code: '2708-6',
                            display: 'Oxygen saturation',
                        },
                    ],
                },
                valueQuantity: {
                    value: observation.measurements.spO2.value,
                    unit: '%',
                    system: 'http://unitsofmeasure.org',
                    code: '%',
                },
            });
        }
        if (observation.measurements.glucose) {
            fhirObservation.component.push({
                code: {
                    coding: [
                        {
                            system: 'http://loinc.org',
                            code: '2339-0',
                            display: 'Glucose',
                        },
                    ],
                },
                valueQuantity: {
                    value: observation.measurements.glucose.value,
                    unit: 'mg/dL',
                    system: 'http://unitsofmeasure.org',
                    code: 'mg/dL',
                },
            });
        }
        // Add doctor notes if available
        if (observation.doctorNotes && observation.reviewedBy && observation.reviewedAt) {
            fhirObservation.note = [
                {
                    authorReference: {
                        reference: `Practitioner/${observation.reviewedBy._id}`,
                        display: observation.reviewedBy.name,
                    },
                    time: observation.reviewedAt.toISOString(),
                    text: observation.doctorNotes,
                },
            ];
        }
        res.json(fhirObservation);
    }
    catch (error) {
        console.error('Error fetching FHIR Observation:', error);
        res.status(500).json({
            message: 'Server error fetching observation',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Helper function to get LOINC code
function getLoincCode(testType) {
    const codes = {
        'blood-pressure': '85354-9',
        'heart-rate': '8867-4',
        'spo2': '2708-6',
        'glucose': '2339-0',
        'ekg': '11524-6',
        'comprehensive': '85354-9',
    };
    return codes[testType] || '85354-9';
}
// Helper function to get display name
function getDisplayName(testType) {
    const names = {
        'blood-pressure': 'Blood Pressure',
        'heart-rate': 'Heart Rate',
        'spo2': 'Oxygen Saturation',
        'glucose': 'Glucose',
        'ekg': 'Electrocardiogram',
        'comprehensive': 'Comprehensive Vital Signs',
    };
    return names[testType] || 'Vital Signs';
}
exports.default = router;
