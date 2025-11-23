import mongoose, { Document, Schema } from 'mongoose';

// FHIR-compliant Patient model following SATUSEHAT Kemenkes framework
export interface IPatient extends Document {
  // FHIR Identifiers
  patientId: string; // Internal system ID
  nik?: string; // NIK (Nomor Induk Kependudukan) - Indonesian National ID
  ihsNumber?: string; // IHS Number from Master Patient Index (MPI)
  passportNumber?: string; // For foreign patients
  kk?: string; // Kartu Keluarga (Family Card)
  
  // FHIR Name (HumanName)
  name: string; // Primary name for backward compatibility
  names?: Array<{
    use: 'official' | 'usual' | 'nickname' | 'maiden' | 'old';
    text: string;
    family?: string; // Last name
    given?: string[]; // First/middle names
    prefix?: string[]; // Dr., Prof., etc.
    suffix?: string[]; // Jr., Sr., etc.
    period?: {
      start?: Date;
      end?: Date;
    };
  }>;
  
  // FHIR Demographics
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other' | 'unknown';
  
  // FHIR Address (multiple addresses)
  address?: {
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country: string;
  }; // Backward compatibility
  addresses?: Array<{
    use: 'home' | 'work' | 'temp' | 'old';
    type: 'physical' | 'postal' | 'both';
    line: string[]; // Street address lines
    city?: string;
    district?: string; // Kecamatan
    subDistrict?: string; // Kelurahan/Desa
    village?: string;
    province?: string;
    postalCode?: string;
    country: string;
    // FHIR Extension: Administrative Code
    extension?: {
      provinceCode?: string; // Kode Provinsi
      cityCode?: string; // Kode Kota/Kabupaten
      districtCode?: string; // Kode Kecamatan
      subDistrictCode?: string; // Kode Kelurahan/Desa
      villageCode?: string;
      rt?: string; // RT
      rw?: string; // RW
    };
    period?: {
      start?: Date;
      end?: Date;
    };
  }>;
  
  // FHIR Telecom (ContactPoint) - multiple contact points
  phoneNumber: string; // Backward compatibility
  telecoms?: Array<{
    system: 'phone' | 'email' | 'fax' | 'pager' | 'url' | 'sms' | 'other';
    value: string;
    use: 'home' | 'work' | 'mobile' | 'temp' | 'old';
    rank?: number; // Priority
    period?: {
      start?: Date;
      end?: Date;
    };
  }>;
  
  // FHIR Contact (Emergency/Next of Kin)
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phoneNumber?: string;
  }; // Backward compatibility
  contacts?: Array<{
    relationship: Array<{
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text?: string;
    }>;
    name?: {
      use?: string;
      text: string;
      family?: string;
      given?: string[];
    };
    telecoms?: Array<{
      system: string;
      value: string;
      use: string;
    }>;
    address?: any;
    gender?: string;
    organization?: {
      reference: string;
      display: string;
    };
    period?: {
      start?: Date;
      end?: Date;
    };
  }>;
  
  // FHIR Extensions - Indonesian specific
  citizenshipStatus?: 'WNI' | 'WNA'; // Indonesian Citizen or Foreign
  religion?: string; // Required in Indonesia
  education?: string;
  occupation?: string;
  birthPlace?: {
    city?: string;
    country?: string;
  };
  
  // FHIR Marital Status
  maritalStatus?: 'M' | 'S' | 'D' | 'W' | 'U' | 'A' | 'P'; // Married, Single, Divorced, Widowed, Unmarried, Annulled, Polygamous
  
  // FHIR MultipleBirth
  multipleBirthBoolean?: boolean;
  multipleBirthInteger?: number;
  
  // FHIR Deceased
  deceasedBoolean?: boolean;
  deceasedDateTime?: Date;
  
  // Medical Information
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
  allergies?: string[];
  medicalHistory?: string[];
  currentMedications?: string[];
  
  // FHIR Communication
  communication?: Array<{
    language: {
      coding: Array<{
        system: string;
        code: string; // e.g., 'id-ID', 'en-US'
        display: string;
      }>;
    };
    preferred?: boolean;
  }>;
  
  // FHIR Photo
  photo?: string; // Base64 encoded or URL
  
  // FHIR General Practitioner
  generalPractitioner?: Array<{
    reference: string; // Reference to Practitioner resource
    display: string;
  }>;
  
  // FHIR Managing Organization
  managingOrganization?: {
    reference: string;
    display: string;
  };
  
  // FHIR Link (to other patient resources)
  link?: Array<{
    other: {
      reference: string;
      display: string;
    };
    type: 'replaced-by' | 'replaces' | 'refer' | 'seealso';
  }>;
  
  // System fields
  facilityId?: mongoose.Types.ObjectId;
  registeredBy?: mongoose.Types.ObjectId;
  active: boolean; // FHIR active field
  isActive: boolean; // Backward compatibility
  
  // FHIR Meta
  meta?: {
    versionId?: string;
    lastUpdated?: Date;
    source?: string;
    profile?: string[];
    security?: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    tag?: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>({
  // FHIR Identifiers
  patientId: {
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
    unique: true,
  },
  passportNumber: {
    type: String,
    sparse: true,
  },
  kk: {
    type: String,
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
  
  // FHIR Demographics
  dateOfBirth: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'unknown'],
    required: true,
  },
  
  // FHIR Address
  address: {
    street: String,
    city: String,
    province: String,
    postalCode: String,
    country: { type: String, default: 'Indonesia' },
  },
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
    subDistrict: String,
    village: String,
    province: String,
    postalCode: String,
    country: { type: String, default: 'ID' },
    extension: {
      provinceCode: String,
      cityCode: String,
      districtCode: String,
      subDistrictCode: String,
      villageCode: String,
      rt: String,
      rw: String,
    },
    period: {
      start: Date,
      end: Date,
    },
  }],
  
  // FHIR Telecom
  phoneNumber: {
    type: String,
    required: true,
  },
  telecoms: [{
    system: {
      type: String,
      enum: ['phone', 'email', 'fax', 'pager', 'url', 'sms', 'other'],
    },
    value: String,
    use: {
      type: String,
      enum: ['home', 'work', 'mobile', 'temp', 'old'],
    },
    rank: Number,
    period: {
      start: Date,
      end: Date,
    },
  }],
  
  // FHIR Contact
  emergencyContact: {
    name: String,
    relationship: String,
    phoneNumber: String,
  },
  contacts: [{
    relationship: [{
      coding: [{
        system: String,
        code: String,
        display: String,
      }],
      text: String,
    }],
    name: {
      use: String,
      text: String,
      family: String,
      given: [String],
    },
    telecoms: [{
      system: String,
      value: String,
      use: String,
    }],
    address: Schema.Types.Mixed,
    gender: String,
    organization: {
      reference: String,
      display: String,
    },
    period: {
      start: Date,
      end: Date,
    },
  }],
  
  // FHIR Extensions
  citizenshipStatus: {
    type: String,
    enum: ['WNI', 'WNA'],
    default: 'WNI',
  },
  religion: String,
  education: String,
  occupation: String,
  birthPlace: {
    city: String,
    country: String,
  },
  
  // FHIR Marital Status
  maritalStatus: {
    type: String,
    enum: ['M', 'S', 'D', 'W', 'U', 'A', 'P'],
  },
  
  // FHIR MultipleBirth
  multipleBirthBoolean: Boolean,
  multipleBirthInteger: Number,
  
  // FHIR Deceased
  deceasedBoolean: Boolean,
  deceasedDateTime: Date,
  
  // Medical Information
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
  },
  allergies: [String],
  medicalHistory: [String],
  currentMedications: [String],
  
  // FHIR Communication
  communication: [{
    language: {
      coding: [{
        system: String,
        code: String,
        display: String,
      }],
    },
    preferred: Boolean,
  }],
  
  // FHIR Photo
  photo: String,
  
  // FHIR General Practitioner
  generalPractitioner: [{
    reference: String,
    display: String,
  }],
  
  // FHIR Managing Organization
  managingOrganization: {
    reference: String,
    display: String,
  },
  
  // FHIR Link
  link: [{
    other: {
      reference: String,
      display: String,
    },
    type: {
      type: String,
      enum: ['replaced-by', 'replaces', 'refer', 'seealso'],
    },
  }],
  
  // System fields
  facilityId: {
    type: Schema.Types.ObjectId,
    ref: 'Facility',
  },
  registeredBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  active: {
    type: Boolean,
    default: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // FHIR Meta
  meta: {
    versionId: String,
    lastUpdated: Date,
    source: String,
    profile: [String],
    security: [{
      system: String,
      code: String,
      display: String,
    }],
    tag: [{
      system: String,
      code: String,
      display: String,
    }],
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

export default mongoose.model<IPatient>('Patient', PatientSchema);
