import mongoose, { Document, Schema } from 'mongoose';

// FHIR-compliant Condition model (Diagnoses/Medical History)
export interface ICondition extends Document {
  // FHIR Identifiers
  conditionId: string;
  
  // FHIR ClinicalStatus
  clinicalStatus?: {
    coding: Array<{
      system: string;
      code: string; // active, recurrence, relapse, inactive, remission, resolved
      display: string;
    }>;
    text?: string;
  };
  
  // FHIR VerificationStatus
  verificationStatus?: {
    coding: Array<{
      system: string;
      code: string; // unconfirmed, provisional, differential, confirmed, refuted, entered-in-error
      display: string;
    }>;
    text?: string;
  };
  
  // FHIR Category
  category?: Array<{
    coding: Array<{
      system: string;
      code: string; // problem-list-item, encounter-diagnosis, etc.
      display: string;
    }>;
    text?: string;
  }>;
  
  // FHIR Severity
  severity?: {
    coding: Array<{
      system: string;
      code: string; // mild, moderate, severe
      display: string;
    }>;
    text?: string;
  };
  
  // FHIR Code (required) - diagnosis/condition code
  code: {
    coding: Array<{
      system: string; // ICD-10, SNOMED CT
      code: string;
      display: string;
    }>;
    text: string;
  };
  
  // FHIR BodySite
  bodySite?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  }>;
  
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
  
  // FHIR Onset[x]
  onsetDateTime?: Date;
  onsetAge?: {
    value: number;
    unit: string;
    system: string;
    code: string;
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
  
  // FHIR Abatement[x] (when condition ended)
  abatementDateTime?: Date;
  abatementAge?: {
    value: number;
    unit: string;
  };
  abatementPeriod?: {
    start?: Date;
    end?: Date;
  };
  abatementRange?: {
    low?: {
      value: number;
      unit: string;
    };
    high?: {
      value: number;
      unit: string;
    };
  };
  abatementString?: string;
  
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
  
  // FHIR Stage
  stage?: Array<{
    summary?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text?: string;
    };
    assessment?: Array<{
      reference: string;
      display: string;
    }>;
    type?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text?: string;
    };
  }>;
  
  // FHIR Evidence
  evidence?: Array<{
    code?: Array<{
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text?: string;
    }>;
    detail?: Array<{
      reference: string;
      display: string;
    }>;
  }>;
  
  // FHIR Note
  note?: Array<{
    authorReference?: {
      reference: string;
      display: string;
    };
    time?: Date;
    text: string;
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

const ConditionSchema = new Schema<ICondition>({
  conditionId: {
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
  
  category: [{
    coding: [{
      system: String,
      code: String,
      display: String,
    }],
    text: String,
  }],
  
  severity: {
    coding: [{
      system: String,
      code: String,
      display: String,
    }],
    text: String,
  },
  
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
  
  bodySite: [{
    coding: [{
      system: String,
      code: String,
      display: String,
    }],
    text: String,
  }],
  
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
  
  encounter: {
    reference: String,
    display: String,
  },
  
  onsetDateTime: Date,
  onsetAge: {
    value: Number,
    unit: String,
    system: String,
    code: String,
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
  
  abatementDateTime: Date,
  abatementAge: {
    value: Number,
    unit: String,
  },
  abatementPeriod: {
    start: Date,
    end: Date,
  },
  abatementRange: {
    low: {
      value: Number,
      unit: String,
    },
    high: {
      value: Number,
      unit: String,
    },
  },
  abatementString: String,
  
  recordedDate: Date,
  
  recorder: {
    reference: String,
    display: String,
  },
  
  asserter: {
    reference: String,
    display: String,
  },
  
  stage: [{
    summary: {
      coding: [{
        system: String,
        code: String,
        display: String,
      }],
      text: String,
    },
    assessment: [{
      reference: String,
      display: String,
    }],
    type: {
      coding: [{
        system: String,
        code: String,
        display: String,
      }],
      text: String,
    },
  }],
  
  evidence: [{
    code: [{
      coding: [{
        system: String,
        code: String,
        display: String,
      }],
      text: String,
    }],
    detail: [{
      reference: String,
      display: String,
    }],
  }],
  
  note: [{
    authorReference: {
      reference: String,
      display: String,
    },
    time: Date,
    text: String,
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

export default mongoose.model<ICondition>('Condition', ConditionSchema);
