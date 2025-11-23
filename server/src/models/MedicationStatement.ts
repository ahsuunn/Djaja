import mongoose, { Document, Schema } from 'mongoose';

// FHIR-compliant MedicationStatement model
export interface IMedicationStatement extends Document {
  // FHIR Identifiers
  medicationStatementId: string;
  
  // FHIR Status (required)
  status: 'active' | 'completed' | 'entered-in-error' | 'intended' | 'stopped' | 'on-hold' | 'unknown' | 'not-taken';
  
  // FHIR StatusReason
  statusReason?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  }>;
  
  // FHIR Category
  category?: {
    coding: Array<{
      system: string;
      code: string; // inpatient, outpatient, community, patientspecified
      display: string;
    }>;
    text?: string;
  };
  
  // FHIR Medication[x] (required)
  medicationCodeableConcept?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  };
  medicationReference?: {
    reference: string;
    display: string;
  };
  
  // FHIR Subject (Patient) - required
  subject: {
    reference: string;
    display: string;
  };
  
  // FHIR Context (Encounter)
  context?: {
    reference: string;
    display: string;
  };
  
  // FHIR Effective[x]
  effectiveDateTime?: Date;
  effectivePeriod?: {
    start: Date;
    end?: Date;
  };
  
  // FHIR DateAsserted
  dateAsserted?: Date;
  
  // FHIR InformationSource
  informationSource?: {
    reference: string;
    display: string;
  };
  
  // FHIR DerivedFrom
  derivedFrom?: Array<{
    reference: string;
    display: string;
  }>;
  
  // FHIR ReasonCode
  reasonCode?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  }>;
  
  // FHIR ReasonReference
  reasonReference?: Array<{
    reference: string;
    display: string;
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
  
  // FHIR Dosage
  dosage?: Array<{
    sequence?: number;
    text?: string;
    additionalInstruction?: Array<{
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text?: string;
    }>;
    patientInstruction?: string;
    timing?: {
      repeat?: {
        frequency?: number;
        period?: number;
        periodUnit?: 's' | 'min' | 'h' | 'd' | 'wk' | 'mo' | 'a';
        when?: string[];
      };
      code?: {
        coding: Array<{
          system: string;
          code: string;
          display: string;
        }>;
        text?: string;
      };
    };
    asNeededBoolean?: boolean;
    asNeededCodeableConcept?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text?: string;
    };
    site?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text?: string;
    };
    route?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text?: string;
    };
    method?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text?: string;
    };
    doseAndRate?: Array<{
      type?: {
        coding: Array<{
          system: string;
          code: string;
          display: string;
        }>;
        text?: string;
      };
      doseQuantity?: {
        value: number;
        unit: string;
        system: string;
        code: string;
      };
      rateQuantity?: {
        value: number;
        unit: string;
        system: string;
        code: string;
      };
    }>;
    maxDosePerPeriod?: {
      numerator: {
        value: number;
        unit: string;
      };
      denominator: {
        value: number;
        unit: string;
      };
    };
    maxDosePerAdministration?: {
      value: number;
      unit: string;
    };
  }>;
  
  // System fields
  patientId?: mongoose.Types.ObjectId;
  encounterId?: mongoose.Types.ObjectId;
  prescribedBy?: mongoose.Types.ObjectId;
  
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

const MedicationStatementSchema = new Schema<IMedicationStatement>({
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
    type: Schema.Types.ObjectId,
    ref: 'Patient',
  },
  encounterId: {
    type: Schema.Types.ObjectId,
    ref: 'Encounter',
  },
  prescribedBy: {
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

export default mongoose.model<IMedicationStatement>('MedicationStatement', MedicationStatementSchema);
