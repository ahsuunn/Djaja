import mongoose, { Document, Schema } from 'mongoose';

// FHIR-compliant Practitioner model (Healthcare Provider/Doctor/Nakes)
export interface IPractitioner extends Document {
  // FHIR Identifiers
  practitionerId: string; // Internal system ID
  nik?: string; // NIK for Indonesian practitioners
  ihsNumber?: string; // IHS Number from MPI
  licenseNumber?: string; // Professional license number
  sipNumber?: string; // Surat Izin Praktik
  strNumber?: string; // Surat Tanda Registrasi
  
  // FHIR Active
  active: boolean;
  
  // FHIR Name (HumanName)
  name: string; // Primary name for backward compatibility
  names?: Array<{
    use: 'official' | 'usual' | 'nickname' | 'maiden' | 'old';
    text: string;
    family?: string;
    given?: string[];
    prefix?: string[]; // Dr., Prof., etc.
    suffix?: string[]; // MD, PhD, Sp.PD, etc.
    period?: {
      start?: Date;
      end?: Date;
    };
  }>;
  
  // FHIR Telecom
  telecoms?: Array<{
    system: 'phone' | 'email' | 'fax' | 'pager' | 'url' | 'sms' | 'other';
    value: string;
    use: 'home' | 'work' | 'mobile' | 'temp';
    rank?: number;
  }>;
  
  // FHIR Address
  addresses?: Array<{
    use: 'home' | 'work' | 'temp' | 'old';
    type: 'physical' | 'postal' | 'both';
    line: string[];
    city?: string;
    district?: string;
    province?: string;
    postalCode?: string;
    country: string;
    period?: {
      start?: Date;
      end?: Date;
    };
  }>;
  
  // FHIR Gender
  gender?: 'male' | 'female' | 'other' | 'unknown';
  
  // FHIR BirthDate
  birthDate?: Date;
  
  // FHIR Photo
  photo?: string;
  
  // FHIR Qualification
  qualifications?: Array<{
    identifier?: string;
    code: {
      coding?: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text: string;
    };
    period?: {
      start?: Date;
      end?: Date;
    };
    issuer?: {
      reference?: string;
      display: string;
    };
  }>;
  
  // FHIR Communication
  communication?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  
  // Additional fields for system
  specialization?: string; // Backward compatibility
  role: 'doctor' | 'nakes' | 'specialist' | 'nurse' | 'midwife' | 'pharmacist' | 'admin';
  facilityId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId; // Link to User account
  
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

const PractitionerSchema = new Schema<IPractitioner>({
  // FHIR Identifiers
  practitionerId: {
    type: String,
    required: true,
    unique: true,
  },
  nik: {
    type: String,
    sparse: true,
    unique: true,
  },
  ihsNumber: {
    type: String,
    sparse: true,
  },
  licenseNumber: {
    type: String,
    sparse: true,
  },
  sipNumber: {
    type: String,
  },
  strNumber: {
    type: String,
  },
  
  // FHIR Active
  active: {
    type: Boolean,
    default: true,
  },
  
  // FHIR Name
  name: {
    type: String,
    required: true,
  },
  names: [{
    use: {
      type: String,
      enum: ['official', 'usual', 'nickname', 'maiden', 'old'],
    },
    text: String,
    family: String,
    given: [String],
    prefix: [String],
    suffix: [String],
    period: {
      start: Date,
      end: Date,
    },
  }],
  
  // FHIR Telecom
  telecoms: [{
    system: {
      type: String,
      enum: ['phone', 'email', 'fax', 'pager', 'url', 'sms', 'other'],
    },
    value: String,
    use: {
      type: String,
      enum: ['home', 'work', 'mobile', 'temp'],
    },
    rank: Number,
  }],
  
  // FHIR Address
  addresses: [{
    use: {
      type: String,
      enum: ['home', 'work', 'temp', 'old'],
    },
    type: {
      type: String,
      enum: ['physical', 'postal', 'both'],
    },
    line: [String],
    city: String,
    district: String,
    province: String,
    postalCode: String,
    country: { type: String, default: 'ID' },
    period: {
      start: Date,
      end: Date,
    },
  }],
  
  // FHIR Gender
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'unknown'],
  },
  
  // FHIR BirthDate
  birthDate: {
    type: Date,
  },
  
  // FHIR Photo
  photo: String,
  
  // FHIR Qualification
  qualifications: [{
    identifier: String,
    code: {
      coding: [{
        system: String,
        code: String,
        display: String,
      }],
      text: String,
    },
    period: {
      start: Date,
      end: Date,
    },
    issuer: {
      reference: String,
      display: String,
    },
  }],
  
  // FHIR Communication
  communication: [{
    coding: [{
      system: String,
      code: String,
      display: String,
    }],
  }],
  
  // Additional fields
  specialization: String,
  role: {
    type: String,
    enum: ['doctor', 'nakes', 'specialist', 'nurse', 'midwife', 'pharmacist', 'admin'],
    default: 'doctor',
  },
  facilityId: {
    type: Schema.Types.ObjectId,
    ref: 'Facility',
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
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

export default mongoose.model<IPractitioner>('Practitioner', PractitionerSchema);
