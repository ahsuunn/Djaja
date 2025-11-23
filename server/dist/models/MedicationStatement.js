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
const MedicationStatementSchema = new mongoose_1.Schema({
    medicationStatementId: {
        type: String,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'entered-in-error', 'intended', 'stopped', 'on-hold', 'unknown', 'not-taken'],
        required: true,
        default: 'active',
    },
    statusReason: [{
            coding: [{
                    system: String,
                    code: String,
                    display: String,
                }],
            text: String,
        }],
    category: {
        coding: [{
                system: String,
                code: String,
                display: String,
            }],
        text: String,
    },
    medicationCodeableConcept: {
        coding: [{
                system: String,
                code: String,
                display: String,
            }],
        text: String,
    },
    medicationReference: {
        reference: String,
        display: String,
    },
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
    context: {
        reference: String,
        display: String,
    },
    effectiveDateTime: Date,
    effectivePeriod: {
        start: Date,
        end: Date,
    },
    dateAsserted: Date,
    informationSource: {
        reference: String,
        display: String,
    },
    derivedFrom: [{
            reference: String,
            display: String,
        }],
    reasonCode: [{
            coding: [{
                    system: String,
                    code: String,
                    display: String,
                }],
            text: String,
        }],
    reasonReference: [{
            reference: String,
            display: String,
        }],
    note: [{
            authorReference: {
                reference: String,
                display: String,
            },
            time: Date,
            text: String,
        }],
    dosage: [{
            sequence: Number,
            text: String,
            additionalInstruction: [{
                    coding: [{
                            system: String,
                            code: String,
                            display: String,
                        }],
                    text: String,
                }],
            patientInstruction: String,
            timing: {
                repeat: {
                    frequency: Number,
                    period: Number,
                    periodUnit: {
                        type: String,
                        enum: ['s', 'min', 'h', 'd', 'wk', 'mo', 'a'],
                    },
                    when: [String],
                },
                code: {
                    coding: [{
                            system: String,
                            code: String,
                            display: String,
                        }],
                    text: String,
                },
            },
            asNeededBoolean: Boolean,
            asNeededCodeableConcept: {
                coding: [{
                        system: String,
                        code: String,
                        display: String,
                    }],
                text: String,
            },
            site: {
                coding: [{
                        system: String,
                        code: String,
                        display: String,
                    }],
                text: String,
            },
            route: {
                coding: [{
                        system: String,
                        code: String,
                        display: String,
                    }],
                text: String,
            },
            method: {
                coding: [{
                        system: String,
                        code: String,
                        display: String,
                    }],
                text: String,
            },
            doseAndRate: [{
                    type: {
                        coding: [{
                                system: String,
                                code: String,
                                display: String,
                            }],
                        text: String,
                    },
                    doseQuantity: {
                        value: Number,
                        unit: String,
                        system: String,
                        code: String,
                    },
                    rateQuantity: {
                        value: Number,
                        unit: String,
                        system: String,
                        code: String,
                    },
                }],
            maxDosePerPeriod: {
                numerator: {
                    value: Number,
                    unit: String,
                },
                denominator: {
                    value: Number,
                    unit: String,
                },
            },
            maxDosePerAdministration: {
                value: Number,
                unit: String,
            },
        }],
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Patient',
    },
    encounterId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Encounter',
    },
    prescribedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Practitioner',
    },
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
exports.default = mongoose_1.default.model('MedicationStatement', MedicationStatementSchema);
