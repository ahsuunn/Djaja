import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'doctor' | 'nakes' | 'patient';
  facilityId?: mongoose.Types.ObjectId;
  licenseNumber?: string;
  specialization?: string;
  phoneNumber?: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'doctor', 'nakes', 'patient'],
    default: 'patient',
  },
  facilityId: {
    type: Schema.Types.ObjectId,
    ref: 'Facility',
  },
  licenseNumber: {
    type: String,
    sparse: true,
  },
  specialization: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
  },
});

export default mongoose.model<IUser>('User', UserSchema);
