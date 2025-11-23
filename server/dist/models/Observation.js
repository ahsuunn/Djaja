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
const ObservationSchema = new mongoose_1.Schema({
    // FHIR Identifiers
    observationId: {
        type: String,
        required: true,
        unique: true,
    },
    // FHIR Status
    status: {
        type: String,
        enum: ['registered', 'preliminary', 'final', 'amended', 'corrected', 'cancelled', 'entered-in-error', 'unknown'],
        required: true,
        default: 'final',
    },
    // FHIR Category
    category: [{
            coding: [{
                    system: String,
                    code: String,
                    display: String,
                }],
            text: String,
        }],
    // FHIR Code
    code: {
        coding: [{
                system: String,
                code: String,
                display: String,
            }],
        text: {
            type: String,
            required: true,
        },
    },
    // FHIR Subject
    subject: {
        reference: {
            type: String,
            required: true,
        },
        display: {
            type: String,
            required: true,
        },
    },
    // FHIR Encounter
    encounter: {
        reference: String,
        display: String,
    },
    // FHIR Effective[x]
    effectiveDateTime: Date,
    effectivePeriod: {
        start: Date,
        end: Date,
    },
    // FHIR Issued
    issued: Date,
    // FHIR Performer
    performer: [{
            reference: String,
            display: String,
        }],
    // FHIR Value[x]
    valueQuantity: {
        value: Number,
        unit: String,
        system: String,
        code: String,
    },
    valueCodeableConcept: {
        coding: [{
                system: String,
                code: String,
                display: String,
            }],
        text: String,
    },
    valueString: String,
    valueBoolean: Boolean,
    valueInteger: Number,
    valueRange: {
        low: {
            value: Number,
            unit: String,
        },
        high: {
            value: Number,
            unit: String,
        },
    },
    // FHIR DataAbsentReason
    dataAbsentReason: {
        coding: [{
                system: String,
                code: String,
                display: String,
            }],
        text: String,
    },
    // FHIR Interpretation
    interpretation: [{
            coding: [{
                    system: String,
                    code: String,
                    display: String,
                }],
            text: String,
        }],
    // FHIR Note
    note: [{
            authorReference: {
                reference: String,
                display: String,
            },
            time: Date,
            text: String,
        }],
    // FHIR BodySite
    bodySite: {
        coding: [{
                system: String,
                code: String,
                display: String,
            }],
        text: String,
    },
    // FHIR Method
    method: {
        coding: [{
                system: String,
                code: String,
                display: String,
            }],
        text: String,
    },
    // FHIR ReferenceRange
    referenceRange: [{
            low: {
                value: Number,
                unit: String,
                system: String,
                code: String,
            },
            high: {
                value: Number,
                unit: String,
                system: String,
                code: String,
            },
            type: {
                coding: [{
                        system: String,
                        code: String,
                        display: String,
                    }],
                text: String,
            },
            appliesTo: [{
                    coding: [{
                            system: String,
                            code: String,
                            display: String,
                        }],
                    text: String,
                }],
            age: {
                low: {
                    value: Number,
                    unit: String,
                },
                high: {
                    value: Number,
                    unit: String,
                },
            },
            text: String,
        }],
    // FHIR Component
    component: [{
            code: {
                coding: [{
                        system: String,
                        code: String,
                        display: String,
                    }],
                text: String,
            },
            valueQuantity: {
                value: Number,
                unit: String,
                system: String,
                code: String,
            },
            dataAbsentReason: {
                coding: [{
                        system: String,
                        code: String,
                        display: String,
                    }],
            },
            interpretation: [{
                    coding: [{
                            system: String,
                            code: String,
                            display: String,
                        }],
                    text: String,
                }],
            referenceRange: [mongoose_1.Schema.Types.Mixed],
        }],
    // FHIR Device
    device: {
        reference: String,
        display: String,
    },
    // Backward compatibility fields
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
    },
    performedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    facilityId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Facility',
    },
    testType: {
        type: String,
        enum: ['blood-pressure', 'heart-rate', 'spo2', 'glucose', 'ekg', 'comprehensive'],
    },
    measurements: mongoose_1.Schema.Types.Mixed,
    analysis: mongoose_1.Schema.Types.Mixed,
    overallStatus: {
        type: String,
        enum: ['normal', 'caution', 'warning', 'critical'],
    },
    doctorNotes: String,
    reviewedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    reviewedAt: Date,
    deviceInfo: {
        deviceId: String,
        deviceType: String,
        manufacturer: String,
    },
    syncStatus: {
        type: String,
        enum: ['pending', 'synced', 'failed'],
        default: 'synced',
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
exports.default = mongoose_1.default.model('Observation', ObservationSchema);
