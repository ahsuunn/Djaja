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
const EncounterSchema = new mongoose_1.Schema({
    // FHIR Identifiers
    encounterId: {
        type: String,
        required: true,
        unique: true,
    },
    // FHIR Status
    status: {
        type: String,
        enum: ['planned', 'arrived', 'triaged', 'in-progress', 'onleave', 'finished', 'cancelled', 'entered-in-error', 'unknown'],
        required: true,
        default: 'planned',
    },
    // FHIR Class
    class: {
        system: {
            type: String,
            required: true,
        },
        code: {
            type: String,
            required: true,
        },
        display: {
            type: String,
            required: true,
        },
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
    // FHIR ServiceType
    serviceType: {
        coding: [{
                system: String,
                code: String,
                display: String,
            }],
        text: String,
    },
    // FHIR Priority
    priority: {
        coding: [{
                system: String,
                code: String,
                display: String,
            }],
        text: String,
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
    // FHIR Participant
    participant: [{
            type: [{
                    coding: [{
                            system: String,
                            code: String,
                            display: String,
                        }],
                    text: String,
                }],
            period: {
                start: Date,
                end: Date,
            },
            individual: {
                reference: String,
                display: String,
            },
        }],
    // FHIR Period
    period: {
        start: {
            type: Date,
            required: true,
        },
        end: Date,
    },
    // FHIR Length
    length: {
        value: Number,
        unit: String,
        system: String,
        code: String,
    },
    // FHIR ReasonCode
    reasonCode: [{
            coding: [{
                    system: String,
                    code: String,
                    display: String,
                }],
            text: String,
        }],
    // FHIR Diagnosis
    diagnosis: [{
            condition: {
                reference: String,
                display: String,
            },
            use: {
                coding: [{
                        system: String,
                        code: String,
                        display: String,
                    }],
                text: String,
            },
            rank: Number,
        }],
    // FHIR Hospitalization
    hospitalization: {
        preAdmissionIdentifier: {
            system: String,
            value: String,
        },
        origin: {
            reference: String,
            display: String,
        },
        admitSource: {
            coding: [{
                    system: String,
                    code: String,
                    display: String,
                }],
        },
        reAdmission: {
            coding: [{
                    system: String,
                    code: String,
                    display: String,
                }],
        },
        dietPreference: [{
                coding: [{
                        system: String,
                        code: String,
                        display: String,
                    }],
            }],
        specialCourtesy: [{
                coding: [{
                        system: String,
                        code: String,
                        display: String,
                    }],
            }],
        specialArrangement: [{
                coding: [{
                        system: String,
                        code: String,
                        display: String,
                    }],
            }],
        destination: {
            reference: String,
            display: String,
        },
        dischargeDisposition: {
            coding: [{
                    system: String,
                    code: String,
                    display: String,
                }],
        },
    },
    // FHIR Location
    location: [{
            location: {
                reference: String,
                display: String,
            },
            status: {
                type: String,
                enum: ['planned', 'active', 'reserved', 'completed'],
            },
            period: {
                start: Date,
                end: Date,
            },
        }],
    // FHIR ServiceProvider
    serviceProvider: {
        reference: String,
        display: String,
    },
    // System fields
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
    },
    practitionerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Practitioner',
    },
    facilityId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Facility',
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
exports.default = mongoose_1.default.model('Encounter', EncounterSchema);
