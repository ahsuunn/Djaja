import mongoose, { Document, Schema } from 'mongoose';

// FHIR-compliant Organization model (Healthcare Facility)
export interface IFacility extends Document {
  // FHIR Identifiers
  facilityId: string;
  
  // FHIR Active
  active: boolean;
  
  // FHIR Type
  type?: Array<{
    coding: Array<{
      system: string;
      code: string; // prov (provider), dept (department), team, govt, ins, edu, reli, crs, etc.
      display: string;
    }>;
    text?: string;
  }>;
  
  // Backward compatibility
  facilityType?: 'hospital' | 'clinic' | 'puskesmas' | 'posyandu' | 'laboratory' | 'pharmacy';
  
  // FHIR Name (required)
  name: string;
  
  // FHIR Alias
  alias?: string[];
  
  // FHIR Telecom
  telecoms?: Array<{
    system: 'phone' | 'email' | 'fax' | 'pager' | 'url' | 'sms' | 'other';
    value: string;
    use: 'home' | 'work' | 'mobile' | 'temp';
    rank?: number;
  }>;
  
  // Backward compatibility
  phoneNumber?: string;
  email?: string;
  
  // FHIR Address
  address?: {
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country: string;
  }; // Backward compatibility
  
  addresses?: Array<{
    use: 'home' | 'work' | 'temp' | 'old' | 'billing';
    type: 'physical' | 'postal' | 'both';
    text?: string;
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
    extension?: {
      provinceCode?: string;
      cityCode?: string;
      districtCode?: string;
      rt?: string;
      rw?: string;
    };
  }>;
  
  // FHIR PartOf (parent organization)
  partOf?: {
    reference: string;
    display: string;
  };
  
  // FHIR Contact (contact parties)
  contact?: Array<{
    purpose?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text?: string;
    };
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
  }>;
  
  // FHIR Endpoint (technical endpoints)
  endpoint?: Array<{
    reference: string;
    display: string;
  }>;
  
  // Additional system fields
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
  
  is3TArea: boolean; // 3T: Terdepan, Terpencil, Tertinggal (Indonesian specific)
  
  devices?: Array<{
    deviceId?: string;
    deviceType?: string;
    status: 'online' | 'offline' | 'maintenance';
    lastConnected?: Date;
  }>;
  
  operatingHours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  
  capacity?: {
    totalBeds?: number;
    availableBeds?: number;
    icu?: {
      total?: number;
      available?: number;
    };
    emergency?: {
      total?: number;
      available?: number;
    };
  };
  
  services?: string[];
  
  // FHIR Extension - accreditation
  accreditation?: Array<{
    type: string; // Hospital accreditation level
    level?: string;
    validFrom?: Date;
    validUntil?: Date;
    issuedBy?: string;
  }>;
  
  isActive: boolean; // Backward compatibility
  
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

const FacilitySchema = new Schema<IFacility>({
  // FHIR Identifiers
  facilityId: {
    type: String,
    required: true,
    unique: true,
  },
  
  // FHIR Active
  active: {
    type: Boolean,
    default: true,
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
  
  // Backward compatibility
  facilityType: {
    type: String,
    enum: ['hospital', 'clinic', 'puskesmas', 'posyandu', 'laboratory', 'pharmacy'],
  },
  
  // FHIR Name
  name: {
    type: String,
    required: true,
  },
  
  // FHIR Alias
  alias: [String],
  
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
  
  // Backward compatibility
  phoneNumber: String,
  email: String,
  
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
      enum: ['home', 'work', 'temp', 'old', 'billing'],
    },
    type: {
      type: String,
      enum: ['physical', 'postal', 'both'],
    },
    text: String,
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
    extension: {
      provinceCode: String,
      cityCode: String,
      districtCode: String,
      rt: String,
      rw: String,
    },
  }],
  
  // FHIR PartOf
  partOf: {
    reference: String,
    display: String,
  },
  
  // FHIR Contact
  contact: [{
    purpose: {
      coding: [{
        system: String,
        code: String,
        display: String,
      }],
      text: String,
    },
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
  }],
  
  // FHIR Endpoint
  endpoint: [{
    reference: String,
    display: String,
  }],
  
  // Additional system fields
  coordinates: {
    latitude: Number,
    longitude: Number,
  },
  
  is3TArea: {
    type: Boolean,
    default: false,
  },
  
  devices: [{
    deviceId: String,
    deviceType: String,
    status: {
      type: String,
      enum: ['online', 'offline', 'maintenance'],
      default: 'offline',
    },
    lastConnected: Date,
  }],
  
  operatingHours: {
    monday: String,
    tuesday: String,
    wednesday: String,
    thursday: String,
    friday: String,
    saturday: String,
    sunday: String,
  },
  
  capacity: {
    totalBeds: Number,
    availableBeds: Number,
    icu: {
      total: Number,
      available: Number,
    },
    emergency: {
      total: Number,
      available: Number,
    },
  },
  
  services: [String],
  
  // Accreditation
  accreditation: [{
    type: String,
    level: String,
    validFrom: Date,
    validUntil: Date,
    issuedBy: String,
  }],
  
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

export default mongoose.model<IFacility>('Facility', FacilitySchema);
