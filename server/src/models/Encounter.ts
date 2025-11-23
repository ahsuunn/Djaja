import mongoose, { Document, Schema } from 'mongoose';

// FHIR-compliant Encounter model (Visit/Consultation)
export interface IEncounter extends Document {
  // FHIR Identifiers
  encounterId: string;
  
  // FHIR Status
  status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled' | 'entered-in-error' | 'unknown';
  
  // FHIR Class (required)
  class: {
    system: string;
    code: string; // AMB (ambulatory), EMER (emergency), IMP (inpatient), VR (virtual), etc.
    display: string;
  };
  
  // FHIR Type
  type?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  }>;
  
  // FHIR ServiceType
  serviceType?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  };
  
  // FHIR Priority
  priority?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  };
  
  // FHIR Subject (Patient) - required
  subject: {
    reference: string; // Reference to Patient
    display: string;
  };
  
  // FHIR Participant
  participant?: Array<{
    type?: Array<{
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text?: string;
    }>;
    period?: {
      start?: Date;
      end?: Date;
    };
    individual?: {
      reference: string; // Reference to Practitioner
      display: string;
    };
  }>;
  
  // FHIR Period
  period?: {
    start: Date;
    end?: Date;
  };
  
  // FHIR Length (duration in minutes)
  length?: {
    value: number;
    unit: string;
    system: string;
    code: string;
  };
  
  // FHIR ReasonCode
  reasonCode?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  }>;
  
  // FHIR Diagnosis
  diagnosis?: Array<{
    condition: {
      reference: string; // Reference to Condition
      display: string;
    };
    use?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text?: string;
    };
    rank?: number;
  }>;
  
  // FHIR Hospitalization
  hospitalization?: {
    preAdmissionIdentifier?: {
      system?: string;
      value?: string;
    };
    origin?: {
      reference?: string;
      display?: string;
    };
    admitSource?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
    reAdmission?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
    dietPreference?: Array<{
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    }>;
    specialCourtesy?: Array<{
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    }>;
    specialArrangement?: Array<{
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    }>;
    destination?: {
      reference?: string;
      display?: string;
    };
    dischargeDisposition?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
  };
  
  // FHIR Location
  location?: Array<{
    location: {
      reference: string;
      display: string;
    };
    status?: 'planned' | 'active' | 'reserved' | 'completed';
    period?: {
      start?: Date;
      end?: Date;
    };
  }>;
  
  // FHIR ServiceProvider (Organization)
  serviceProvider?: {
    reference: string;
    display: string;
  };
  
  // System fields
  patientId?: mongoose.Types.ObjectId; // Backward compatibility
  practitionerId?: mongoose.Types.ObjectId; // Backward compatibility
  facilityId?: mongoose.Types.ObjectId;
  
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

const EncounterSchema = new Schema<IEncounter>({
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

export default mongoose.model<IEncounter>('Encounter', EncounterSchema);
