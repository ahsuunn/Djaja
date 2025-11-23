import mongoose, { Document, Schema } from 'mongoose';

// FHIR-compliant DiagnosticReport model
export interface IDiagnosticReport extends Document {
  // FHIR Identifiers
  reportId: string;
  
  // FHIR Status (required)
  status: 'registered' | 'partial' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'appended' | 'cancelled' | 'entered-in-error' | 'unknown';
  
  // FHIR Category (required)
  category: Array<{
    coding: Array<{
      system: string;
      code: string; // LAB, RAD, CARD, etc.
      display: string;
    }>;
    text?: string;
  }>;
  
  // FHIR Code (required)
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  };
  
  // FHIR Subject (Patient) - required
  subject: {
    reference: string;
    display: string;
  };
  
  // FHIR Encounter
  encounter?: {
    reference: string;
    display: string;
  };
  
  // FHIR Effective[x]
  effectiveDateTime?: Date;
  effectivePeriod?: {
    start: Date;
    end?: Date;
  };
  
  // FHIR Issued (required)
  issued: Date;
  
  // FHIR Performer
  performer?: Array<{
    reference: string; // Reference to Practitioner/Organization
    display: string;
  }>;
  
  // FHIR ResultsInterpreter
  resultsInterpreter?: Array<{
    reference: string;
    display: string;
  }>;
  
  // FHIR Specimen
  specimen?: Array<{
    reference: string;
    display: string;
  }>;
  
  // FHIR Result (Observations)
  result?: Array<{
    reference: string; // Reference to Observation
    display: string;
  }>;
  
  // FHIR Conclusion
  conclusion?: string;
  
  // FHIR ConclusionCode
  conclusionCode?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  }>;
  
  // FHIR PresentedForm (PDF, images, etc.)
  presentedForm?: Array<{
    contentType: string;
    language?: string;
    data?: string; // base64
    url?: string;
    size?: number;
    hash?: string;
    title?: string;
    creation?: Date;
  }>;
  
  // Additional system fields
  patientId?: mongoose.Types.ObjectId;
  practitionerId?: mongoose.Types.ObjectId;
  facilityId?: mongoose.Types.ObjectId;
  
  // Disease indicators and recommendations (from ML analysis)
  diseaseIndicators?: Array<{
    disease: string;
    likelihood: 'Low' | 'Moderate' | 'High';
    reasons: string[];
  }>;
  
  prescriptions?: Array<{
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  
  recommendations?: Array<{
    urgency: 'Immediate' | 'Routine' | 'Low Priority';
    action: string;
  }>;
  
  // FHIR Meta
  meta?: {
    versionId?: string;
    lastUpdated?: Date;
    source?: string;
    profile?: string[];
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const DiagnosticReportSchema = new Schema<IDiagnosticReport>({
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
    type: Schema.Types.ObjectId,
    ref: 'Patient',
  },
  practitionerId: {
    type: Schema.Types.ObjectId,
    ref: 'Practitioner',
  },
  facilityId: {
    type: Schema.Types.ObjectId,
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

export default mongoose.model<IDiagnosticReport>('DiagnosticReport', DiagnosticReportSchema);
