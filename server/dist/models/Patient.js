"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const PatientSchema = new mongoose_1.Schema({
    // FHIR Identifiers
    patientId: {
        type: String,
        required: true,
        unique: true,
    },
    nik: {
        type: String,
        sparse: true,
        unique: true,
    },
    ihsNumber: {
        type: String,
        sparse: true,
        unique: true,
    },
    passportNumber: {
        type: String,
        sparse: true,
    },
    kk: {
        type: String,
    },
    // FHIR Name
    name: {
        type: String,
        required: true,
    },
    names: [{
            use: {
                type: String,
                enum: ['official', 'usual', 'nickname', 'maiden', 'old'],
            },
            text: String,
            family: String,
            given: [String],
            prefix: [String],
            suffix: [String],
            period: {
                start: Date,
                end: Date,
            },
        }],
    // FHIR Demographics
    dateOfBirth: {
        type: Date,
        required: true,
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'unknown'],
        required: true,
    },
    // FHIR Address
    address: {
        street: String,
        city: String,
        province: String,
        postalCode: String,
        country: { type: String, default: 'Indonesia' },
    },
    addresses: [{
            use: {
                type: String,
                enum: ['home', 'work', 'temp', 'old'],
            },
            type: {
                type: String,
                enum: ['physical', 'postal', 'both'],
            },
            line: [String],
            city: String,
            district: String,
            subDistrict: String,
            village: String,
            province: String,
            postalCode: String,
            country: { type: String, default: 'ID' },
            extension: {
                provinceCode: String,
                cityCode: String,
                districtCode: String,
                subDistrictCode: String,
                villageCode: String,
                rt: String,
                rw: String,
            },
            period: {
                start: Date,
                end: Date,
            },
        }],
    // FHIR Telecom
    phoneNumber: {
        type: String,
        required: true,
    },
    telecoms: [{
            system: {
                type: String,
                enum: ['phone', 'email', 'fax', 'pager', 'url', 'sms', 'other'],
            },
            value: String,
            use: {
                type: String,
                enum: ['home', 'work', 'mobile', 'temp', 'old'],
            },
            rank: Number,
            period: {
                start: Date,
                end: Date,
            },
        }],
    // FHIR Contact
    emergencyContact: {
        name: String,
        relationship: String,
        phoneNumber: String,
    },
    contacts: [{
            relationship: [{
                    coding: [{
                            system: String,
                            code: String,
                            display: String,
                        }],
                    text: String,
                }],
            name: {
                use: String,
                text: String,
                family: String,
                given: [String],
            },
            telecoms: [{
                    system: String,
                    value: String,
                    use: String,
                }],
            address: mongoose_1.Schema.Types.Mixed,
            gender: String,
            organization: {
                reference: String,
                display: String,
            },
            period: {
                start: Date,
                end: Date,
            },
        }],
    // FHIR Extensions
    citizenshipStatus: {
        type: String,
        enum: ['WNI', 'WNA'],
        default: 'WNI',
    },
    religion: String,
    education: String,
    occupation: String,
    birthPlace: {
        city: String,
        country: String,
    },
    // FHIR Marital Status
    maritalStatus: {
        type: String,
        enum: ['M', 'S', 'D', 'W', 'U', 'A', 'P'],
    },
    // FHIR MultipleBirth
    multipleBirthBoolean: Boolean,
    multipleBirthInteger: Number,
    // FHIR Deceased
    deceasedBoolean: Boolean,
    deceasedDateTime: Date,
    // Medical Information
    bloodType: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    },
    allergies: [String],
    medicalHistory: [String],
    currentMedications: [String],
    // FHIR Communication
    communication: [{
            language: {
                coding: [{
                        system: String,
                        code: String,
                        display: String,
                    }],
            },
            preferred: Boolean,
        }],
    // FHIR Photo
    photo: String,
    // FHIR General Practitioner
    generalPractitioner: [{
            reference: String,
            display: String,
        }],
    // FHIR Managing Organization
    managingOrganization: {
        reference: String,
        display: String,
    },
    // FHIR Link
    link: [{
            other: {
                reference: String,
                display: String,
            },
            type: {
                type: String,
                enum: ['replaced-by', 'replaces', 'refer', 'seealso'],
            },
        }],
    // System fields
    facilityId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Facility',
    },
    registeredBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    active: {
        type: Boolean,
        default: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    // FHIR Meta
    meta: {
        versionId: String,
        lastUpdated: Date,
        source: String,
        profile: [String],
        security: [{
                system: String,
                code: String,
                display: String,
            }],
        tag: [{
                system: String,
                code: String,
                display: String,
            }],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});
exports.default = mongoose_1.default.model('Patient', PatientSchema);
