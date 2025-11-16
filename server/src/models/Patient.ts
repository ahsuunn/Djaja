import mongoose, { Document, Schema } from 'mongoose';

export interface IPatient extends Document {
  patientId: string;
  name: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  address?: {
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country: string;
  };
  phoneNumber: string;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phoneNumber?: string;
  };
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
  allergies?: string[];
  medicalHistory?: string[];
  currentMedications?: string[];
  facilityId?: mongoose.Types.ObjectId;
  registeredBy?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>({
  patientId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true,
  },
  address: {
    street: String,
    city: String,
    province: String,
    postalCode: String,
    country: { type: String, default: 'Indonesia' },
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phoneNumber: String,
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
  },
  allergies: [String],
  medicalHistory: [String],
  currentMedications: [String],
  facilityId: {
    type: Schema.Types.ObjectId,
    ref: 'Facility',
  },
  registeredBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
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

export default mongoose.model<IPatient>('Patient', PatientSchema);
