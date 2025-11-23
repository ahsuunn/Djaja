"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const Facility_1 = __importDefault(require("../models/Facility"));
const router = express_1.default.Router();
// @route   GET /api/facilities
// @desc    Get all facilities
// @access  Private
router.get('/', auth_1.auth, async (req, res) => {
    try {
        const facilities = await Facility_1.default.find({ isActive: true }).sort({ name: 1 });
        res.json({ facilities });
    }
    catch (error) {
        console.error('Get facilities error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// @route   GET /api/facilities/:id
// @desc    Get facility by ID
// @access  Private
router.get('/:id', auth_1.auth, async (req, res) => {
    try {
        const facility = await Facility_1.default.findById(req.params.id);
        if (!facility) {
            res.status(404).json({ message: 'Facility not found' });
            return;
        }
        res.json({ facility });
    }
    catch (error) {
        console.error('Get facility error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// @route   POST /api/facilities
// @desc    Create new facility
// @access  Private (admin)
router.post('/', auth_1.auth, (0, auth_1.authorize)('admin'), async (req, res) => {
    try {
        const facilityData = {
            ...req.body,
            facilityId: `FAC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            active: true,
        };
        // Transform facilityType to type array if not already in FHIR format
        if (req.body.facilityType && (!req.body.type || req.body.type.length === 0)) {
            const typeMap = {
                'hospital': 'prov',
                'clinic': 'prov',
                'puskesmas': 'prov',
                'laboratory': 'dept',
            };
            facilityData.type = [{
                    coding: [{
                            system: 'http://terminology.hl7.org/CodeSystem/organization-type',
                            code: typeMap[req.body.facilityType] || 'prov',
                            display: req.body.facilityType,
                        }],
                    text: req.body.facilityType,
                }];
        }
        // Transform phone/email to telecoms array if not already in FHIR format
        if ((!req.body.telecoms || req.body.telecoms.length === 0)) {
            const telecoms = [];
            if (req.body.phoneNumber) {
                telecoms.push({
                    system: 'phone',
                    value: req.body.phoneNumber,
                    use: 'work',
                });
            }
            if (req.body.email) {
                telecoms.push({
                    system: 'email',
                    value: req.body.email,
                    use: 'work',
                });
            }
            if (telecoms.length > 0) {
                facilityData.telecoms = telecoms;
            }
        }
        // Transform address to addresses array if not already in FHIR format
        if (req.body.address && (!req.body.addresses || req.body.addresses.length === 0)) {
            facilityData.addresses = [{
                    use: 'work',
                    type: 'physical',
                    text: `${req.body.address.street || ''}, ${req.body.address.city || ''}, ${req.body.address.province || ''}`,
                    line: req.body.address.street ? [req.body.address.street] : [],
                    city: req.body.address.city,
                    state: req.body.address.province,
                    postalCode: req.body.address.postalCode,
                    country: req.body.address.country || 'Indonesia',
                }];
        }
        // Add FHIR meta
        facilityData.meta = {
            versionId: '1',
            lastUpdated: new Date(),
            profile: ['https://satusehat.kemkes.go.id/fhir/StructureDefinition/Organization'],
        };
        const facility = new Facility_1.default(facilityData);
        await facility.save();
        res.status(201).json({ message: 'Facility created successfully', facility });
    }
    catch (error) {
        console.error('Create facility error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
