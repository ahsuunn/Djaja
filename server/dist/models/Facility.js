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
const FacilitySchema = new mongoose_1.Schema({
    // FHIR Identifiers
    facilityId: {
        type: String,
        required: true,
        unique: true,
    },
    // FHIR Active
    active: {
        type: Boolean,
        default: true,
    },
    // FHIR Type
    type: [{
            coding: [{
                    system: String,
                    code: String,
                    display: String,
                }],
            text: String,
        }],
    // Backward compatibility
    facilityType: {
        type: String,
        enum: ['hospital', 'clinic', 'puskesmas', 'posyandu', 'laboratory', 'pharmacy'],
    },
    // FHIR Name
    name: {
        type: String,
        required: true,
    },
    // FHIR Alias
    alias: [String],
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
    // Backward compatibility
    phoneNumber: String,
    email: String,
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
                enum: ['home', 'work', 'temp', 'old', 'billing'],
            },
            type: {
                type: String,
                enum: ['physical', 'postal', 'both'],
            },
            text: String,
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
            extension: {
                provinceCode: String,
                cityCode: String,
                districtCode: String,
                rt: String,
                rw: String,
            },
        }],
    // FHIR PartOf
    partOf: {
        reference: String,
        display: String,
    },
    // FHIR Contact
    contact: [{
            purpose: {
                coding: [{
                        system: String,
                        code: String,
                        display: String,
                    }],
                text: String,
            },
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
        }],
    // FHIR Endpoint
    endpoint: [{
            reference: String,
            display: String,
        }],
    // Additional system fields
    coordinates: {
        latitude: Number,
        longitude: Number,
    },
    is3TArea: {
        type: Boolean,
        default: false,
    },
    devices: [{
            deviceId: String,
            deviceType: String,
            status: {
                type: String,
                enum: ['online', 'offline', 'maintenance'],
                default: 'offline',
            },
            lastConnected: Date,
        }],
    operatingHours: {
        monday: String,
        tuesday: String,
        wednesday: String,
        thursday: String,
        friday: String,
        saturday: String,
        sunday: String,
    },
    capacity: {
        totalBeds: Number,
        availableBeds: Number,
        icu: {
            total: Number,
            available: Number,
        },
        emergency: {
            total: Number,
            available: Number,
        },
    },
    services: [String],
    // Accreditation
    accreditation: [{
            type: String,
            level: String,
            validFrom: Date,
            validUntil: Date,
            issuedBy: String,
        }],
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
exports.default = mongoose_1.default.model('Facility', FacilitySchema);
