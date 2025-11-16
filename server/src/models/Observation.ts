import mongoose, { Document, Schema } from 'mongoose';

export interface IObservation extends Document {
  observationId: string;
  patientId: mongoose.Types.ObjectId;
  performedBy: mongoose.Types.ObjectId;
  facilityId?: mongoose.Types.ObjectId;
  testType: 'blood-pressure' | 'heart-rate' | 'spo2' | 'glucose' | 'ekg' | 'comprehensive';
  measurements: {
    bloodPressure?: {
      systolic?: number;
      diastolic?: number;
      unit: string;
    };
    heartRate?: {
      value?: number;
      unit: string;
    };
    spO2?: {
      value?: number;
      unit: string;
    };
    glucose?: {
      value?: number;
      unit: string;
    };
    ekg?: {
      rhythm?: string;
      waveformData?: number[];
    };
  };
  analysis: {
    bloodPressure?: {
      status?: string;
      message?: string;
    };
    heartRate?: {
      status?: string;
      message?: string;
    };
    spO2?: {
      status?: string;
      message?: string;
    };
    glucose?: {
      status?: string;
      message?: string;
    };
    ekg?: {
      status?: string;
      message?: string;
    };
  };
  overallStatus: 'normal' | 'caution' | 'warning' | 'critical';
  doctorNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  deviceInfo?: {
    deviceId?: string;
    deviceType?: string;
    manufacturer?: string;
  };
  syncStatus: 'pending' | 'synced' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const ObservationSchema = new Schema<IObservation>({
  observationId: {
    type: String,
    required: true,
    unique: true,
  },
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  facilityId: {
    type: Schema.Types.ObjectId,
    ref: 'Facility',
  },
  testType: {
    type: String,
    enum: ['blood-pressure', 'heart-rate', 'spo2', 'glucose', 'ekg', 'comprehensive'],
    required: true,
  },
  measurements: {
    bloodPressure: {
      systolic: Number,
      diastolic: Number,
      unit: { type: String, default: 'mmHg' },
    },
    heartRate: {
      value: Number,
      unit: { type: String, default: 'bpm' },
    },
    spO2: {
      value: Number,
      unit: { type: String, default: '%' },
    },
    glucose: {
      value: Number,
      unit: { type: String, default: 'mg/dL' },
    },
    ekg: {
      rhythm: String,
      waveformData: [Number],
    },
  },
  analysis: {
    bloodPressure: {
      status: String,
      message: String,
    },
    heartRate: {
      status: String,
      message: String,
    },
    spO2: {
      status: String,
      message: String,
    },
    glucose: {
      status: String,
      message: String,
    },
    ekg: {
      status: String,
      message: String,
    },
  },
  overallStatus: {
    type: String,
    enum: ['normal', 'caution', 'warning', 'critical'],
    default: 'normal',
  },
  doctorNotes: {
    type: String,
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: {
    type: Date,
  },
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
