const mongoose = require('mongoose');

const FacilitySchema = new mongoose.Schema({
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

module.exports = mongoose.model('Facility', FacilitySchema);
