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
const PractitionerSchema = new mongoose_1.Schema({
    // FHIR Identifiers
    practitionerId: {
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
    },
    licenseNumber: {
        type: String,
        sparse: true,
    },
    sipNumber: {
        type: String,
    },
    strNumber: {
        type: String,
    },
    // FHIR Active
    active: {
        type: Boolean,
        default: true,
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
    // FHIR Telecom
    telecoms: [{
            system: {
                type: String,
                enum: ['phone', 'email', 'fax', 'pager', 'url', 'sms', 'other'],
            },
            value: String,
            use: {
                type: String,
                enum: ['home', 'work', 'mobile', 'temp'],
            },
            rank: Number,
        }],
    // FHIR Address
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
            province: String,
            postalCode: String,
            country: { type: String, default: 'ID' },
            period: {
                start: Date,
                end: Date,
            },
        }],
    // FHIR Gender
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'unknown'],
    },
    // FHIR BirthDate
    birthDate: {
        type: Date,
    },
    // FHIR Photo
    photo: String,
    // FHIR Qualification
    qualifications: [{
            identifier: String,
            code: {
                coding: [{
                        system: String,
                        code: String,
                        display: String,
                    }],
                text: String,
            },
            period: {
                start: Date,
                end: Date,
            },
            issuer: {
                reference: String,
                display: String,
            },
        }],
    // FHIR Communication
    communication: [{
            coding: [{
                    system: String,
                    code: String,
                    display: String,
                }],
        }],
    // Additional fields
    specialization: String,
    role: {
        type: String,
        enum: ['doctor', 'nakes', 'specialist', 'nurse', 'midwife', 'pharmacist', 'admin'],
        default: 'doctor',
    },
    facilityId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Facility',
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    // FHIR Meta
    meta: {
        versionId: String,
        lastUpdated: Date,
        source: String,
        profile: [String],
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
exports.default = mongoose_1.default.model('Practitioner', PractitionerSchema);
