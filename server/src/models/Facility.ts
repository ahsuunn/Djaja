import mongoose, { Document, Schema } from 'mongoose';

export interface IFacility extends Document {
  facilityId: string;
  name: string;
  type: 'hospital' | 'clinic' | 'puskesmas' | 'posyandu';
  address?: {
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country: string;
  };
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
  phoneNumber?: string;
  email?: string;
  is3TArea: boolean;
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
  };
  services?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FacilitySchema = new Schema<IFacility>({
  facilityId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['hospital', 'clinic', 'puskesmas', 'posyandu'],
    required: true,
  },
  address: {
    street: String,
    city: String,
    province: String,
    postalCode: String,
    country: { type: String, default: 'Indonesia' },
  },
  coordinates: {
    latitude: Number,
    longitude: Number,
  },
  phoneNumber: {
    type: String,
  },
  email: {
    type: String,
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
  },
  services: [String],
  isActive: {
    type: Boolean,
    default: true,
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
