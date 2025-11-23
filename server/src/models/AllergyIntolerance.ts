import mongoose, { Document, Schema } from 'mongoose';

// FHIR-compliant AllergyIntolerance model
export interface IAllergyIntolerance extends Document {
  // FHIR Identifiers
  allergyId: string;
  
  // FHIR ClinicalStatus
  clinicalStatus?: {
    coding: Array<{
      system: string;
      code: string; // active, inactive, resolved
      display: string;
    }>;
    text?: string;
  };
  
  // FHIR VerificationStatus
  verificationStatus?: {
    coding: Array<{
      system: string;
      code: string; // unconfirmed, confirmed, refuted, entered-in-error
      display: string;
    }>;
    text?: string;
  };
  
  // FHIR Type
  type?: 'allergy' | 'intolerance';
  
  // FHIR Category
  category?: Array<'food' | 'medication' | 'environment' | 'biologic'>;
  
  // FHIR Criticality
  criticality?: 'low' | 'high' | 'unable-to-assess';
  
  // FHIR Code (allergen)
  code?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  };
  
  // FHIR Patient (required)
  patient: {
    reference: string;
    display: string;
  };
  
  // FHIR Encounter
  encounter?: {
    reference: string;
    display: string;
  };
  
  // FHIR Onset[x]
  onsetDateTime?: Date;
  onsetAge?: {
    value: number;
    unit: string;
  };
  onsetPeriod?: {
    start?: Date;
    end?: Date;
  };
  onsetRange?: {
    low?: {
      value: number;
      unit: string;
    };
    high?: {
      value: number;
      unit: string;
    };
  };
  onsetString?: string;
  
  // FHIR RecordedDate
  recordedDate?: Date;
  
  // FHIR Recorder
  recorder?: {
    reference: string;
    display: string;
  };
  
  // FHIR Asserter
  asserter?: {
    reference: string;
    display: string;
  };
  
  // FHIR LastOccurrence
  lastOccurrence?: Date;
  
  // FHIR Note
  note?: Array<{
    authorReference?: {
      reference: string;
      display: string;
    };
    time?: Date;
    text: string;
  }>;
  
  // FHIR Reaction
  reaction?: Array<{
    substance?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text?: string;
    };
    manifestation: Array<{
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text?: string;
    }>;
    description?: string;
    onset?: Date;
    severity?: 'mild' | 'moderate' | 'severe';
    exposureRoute?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text?: string;
    };
    note?: Array<{
      text: string;
    }>;
  }>;
  
  // System fields
  patientId?: mongoose.Types.ObjectId;
  encounterId?: mongoose.Types.ObjectId;
  recordedBy?: mongoose.Types.ObjectId;
  
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

const AllergyIntoleranceSchema = new Schema<IAllergyIntolerance>({
  allergyId: {
    type: String,
    required: true,
    unique: true,
  },
  
  clinicalStatus: {
    coding: [{
      system: String,
      code: String,
      display: String,
    }],
    text: String,
  },
  
  verificationStatus: {
    coding: [{
      system: String,
      code: String,
      display: String,
    }],
    text: String,
  },
  
  type: {
    type: String,
    enum: ['allergy', 'intolerance'],
  },
  
  category: [{
    type: String,
    enum: ['food', 'medication', 'environment', 'biologic'],
  }],
  
  criticality: {
    type: String,
    enum: ['low', 'high', 'unable-to-assess'],
  },
  
  code: {
    coding: [{
      system: String,
      code: String,
      display: String,
    }],
    text: String,
  },
  
  patient: {
    reference: {
      type: String,
      required: true,
    },
    display: {
      type: String,
      required: true,
    },
  },
  
  encounter: {
    reference: String,
    display: String,
  },
  
  onsetDateTime: Date,
  onsetAge: {
    value: Number,
    unit: String,
  },
  onsetPeriod: {
    start: Date,
    end: Date,
  },
  onsetRange: {
    low: {
      value: Number,
      unit: String,
    },
    high: {
      value: Number,
      unit: String,
    },
  },
  onsetString: String,
  
  recordedDate: Date,
  
  recorder: {
    reference: String,
    display: String,
  },
  
  asserter: {
    reference: String,
    display: String,
  },
  
  lastOccurrence: Date,
  
  note: [{
    authorReference: {
      reference: String,
      display: String,
    },
    time: Date,
    text: String,
  }],
  
  reaction: [{
    substance: {
      coding: [{
        system: String,
        code: String,
        display: String,
      }],
      text: String,
    },
    manifestation: [{
      coding: [{
        system: String,
        code: String,
        display: String,
      }],
      text: String,
    }],
    description: String,
    onset: Date,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
    },
    exposureRoute: {
      coding: [{
        system: String,
        code: String,
        display: String,
      }],
      text: String,
    },
    note: [{
      text: String,
    }],
  }],
  
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
  },
  encounterId: {
    type: Schema.Types.ObjectId,
    ref: 'Encounter',
  },
  recordedBy: {
    type: Schema.Types.ObjectId,
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

export default mongoose.model<IAllergyIntolerance>('AllergyIntolerance', AllergyIntoleranceSchema);
