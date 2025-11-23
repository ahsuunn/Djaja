import mongoose, { Document, Schema } from 'mongoose';

// FHIR-compliant Observation model (Vital Signs & Lab Results)
export interface IObservation extends Document {
  // FHIR Identifiers
  observationId: string;
  
  // FHIR Status (required)
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown';
  
  // FHIR Category (required)
  category: Array<{
    coding: Array<{
      system: string;
      code: string; // vital-signs, laboratory, imaging, etc.
      display: string;
    }>;
    text?: string;
  }>;
  
  // FHIR Code (required) - using LOINC codes
  code: {
    coding: Array<{
      system: string; // http://loinc.org
      code: string; // LOINC code (e.g., '8867-4' for heart rate)
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
  
  // FHIR Issued
  issued?: Date;
  
  // FHIR Performer
  performer?: Array<{
    reference: string; // Reference to Practitioner/Organization
    display: string;
  }>;
  
  // FHIR Value[x] - different types for different observations
  valueQuantity?: {
    value: number;
    unit: string;
    system: string; // http://unitsofmeasure.org (UCUM)
    code: string; // UCUM code
  };
  valueCodeableConcept?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  };
  valueString?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueRange?: {
    low?: {
      value: number;
      unit: string;
    };
    high?: {
      value: number;
      unit: string;
    };
  };
  
  // FHIR DataAbsentReason (if no value)
  dataAbsentReason?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  };
  
  // FHIR Interpretation
  interpretation?: Array<{
    coding: Array<{
      system: string;
      code: string; // H (high), L (low), N (normal), HH (critical high), LL (critical low)
      display: string;
    }>;
    text?: string;
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
  
  // FHIR BodySite
  bodySite?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  };
  
  // FHIR Method
  method?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  };
  
  // FHIR ReferenceRange
  referenceRange?: Array<{
    low?: {
      value: number;
      unit: string;
      system?: string;
      code?: string;
    };
    high?: {
      value: number;
      unit: string;
      system?: string;
      code?: string;
    };
    type?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text?: string;
    };
    appliesTo?: Array<{
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text?: string;
    }>;
    age?: {
      low?: {
        value: number;
        unit: string;
      };
      high?: {
        value: number;
        unit: string;
      };
    };
    text?: string;
  }>;
  
  // FHIR Component (for multi-component observations like Blood Pressure)
  component?: Array<{
    code: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text?: string;
    };
    valueQuantity?: {
      value: number;
      unit: string;
      system: string;
      code: string;
    };
    dataAbsentReason?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
    interpretation?: Array<{
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text?: string;
    }>;
    referenceRange?: Array<any>;
  }>;
  
  // FHIR Device
  device?: {
    reference: string;
    display: string;
  };
  
  // Backward compatibility fields
  patientId?: mongoose.Types.ObjectId;
  performedBy?: mongoose.Types.ObjectId;
  facilityId?: mongoose.Types.ObjectId;
  testType?: 'blood-pressure' | 'heart-rate' | 'spo2' | 'glucose' | 'ekg' | 'comprehensive';
  measurements?: any; // Old structure
  analysis?: any; // Old structure
  overallStatus?: 'normal' | 'caution' | 'warning' | 'critical';
  doctorNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  deviceInfo?: {
    deviceId?: string;
    deviceType?: string;
    manufacturer?: string;
  };
  syncStatus?: 'pending' | 'synced' | 'failed';
  
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

const ObservationSchema = new Schema<IObservation>({
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
    referenceRange: [Schema.Types.Mixed],
  }],
  
  // FHIR Device
  device: {
    reference: String,
    display: String,
  },
  
  // Backward compatibility fields
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  facilityId: {
    type: Schema.Types.ObjectId,
    ref: 'Facility',
  },
  testType: {
    type: String,
    enum: ['blood-pressure', 'heart-rate', 'spo2', 'glucose', 'ekg', 'comprehensive'],
  },
  measurements: Schema.Types.Mixed,
  analysis: Schema.Types.Mixed,
  overallStatus: {
    type: String,
    enum: ['normal', 'caution', 'warning', 'critical'],
  },
  doctorNotes: String,
  reviewedBy: {
    type: Schema.Types.ObjectId,
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

export default mongoose.model<IObservation>('Observation', ObservationSchema);
