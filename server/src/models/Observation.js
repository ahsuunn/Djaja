const mongoose = require('mongoose');

const ObservationSchema = new mongoose.Schema({
  observationId: {
    type: String,
    required: true,
    unique: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  facilityId: {
    type: mongoose.Schema.Types.ObjectId,
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
    type: mongoose.Schema.Types.ObjectId,
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

module.exports = mongoose.model('Observation', ObservationSchema);
