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
const DiagnosticReportSchema = new mongoose_1.Schema({
    // FHIR Identifiers
    reportId: {
        type: String,
        required: true,
        unique: true,
    },
    // FHIR Status
    status: {
        type: String,
        enum: ['registered', 'partial', 'preliminary', 'final', 'amended', 'corrected', 'appended', 'cancelled', 'entered-in-error', 'unknown'],
        required: true,
        default: 'preliminary',
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
    issued: {
        type: Date,
        required: true,
        default: Date.now,
    },
    // FHIR Performer
    performer: [{
            reference: String,
            display: String,
        }],
    // FHIR ResultsInterpreter
    resultsInterpreter: [{
            reference: String,
            display: String,
        }],
    // FHIR Specimen
    specimen: [{
            reference: String,
            display: String,
        }],
    // FHIR Result
    result: [{
            reference: String,
            display: String,
        }],
    // FHIR Conclusion
    conclusion: String,
    // FHIR ConclusionCode
    conclusionCode: [{
            coding: [{
                    system: String,
                    code: String,
                    display: String,
                }],
            text: String,
        }],
    // FHIR PresentedForm
    presentedForm: [{
            contentType: String,
            language: String,
            data: String,
            url: String,
            size: Number,
            hash: String,
            title: String,
            creation: Date,
        }],
    // Additional system fields
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
    // Disease indicators
    diseaseIndicators: [{
            disease: String,
            likelihood: {
                type: String,
                enum: ['Low', 'Moderate', 'High'],
            },
            reasons: [String],
        }],
    // Prescriptions
    prescriptions: [{
            medication: String,
            dosage: String,
            frequency: String,
            duration: String,
        }],
    // Recommendations
    recommendations: [{
            urgency: {
                type: String,
                enum: ['Immediate', 'Routine', 'Low Priority'],
            },
            action: String,
        }],
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
exports.default = mongoose_1.default.model('DiagnosticReport', DiagnosticReportSchema);
