const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
require('dotenv').config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/observations', require('./routes/observations'));
app.use('/api/users', require('./routes/users'));
app.use('/api/facilities', require('./routes/facilities'));
app.use('/api/fhir', require('./routes/fhir'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Djaja Diagnostics API is running' });
});

// WebSocket for IoT device simulation
io.on('connection', (socket) => {
  console.log('Device connected:', socket.id);

  socket.on('device-data', (data) => {
    console.log('Received device data:', data);
    // Broadcast to all connected clients (simulating cloud processing)
    io.emit('diagnostic-result', {
      ...data,
      processedAt: new Date().toISOString(),
      analysis: analyzeVitals(data),
    });
  });

  socket.on('disconnect', () => {
    console.log('Device disconnected:', socket.id);
  });
});

// Simple diagnostic analysis function (rule-based)
function analyzeVitals(data) {
  const results = {};

  // Blood Pressure Analysis
  if (data.bloodPressure) {
    const { systolic, diastolic } = data.bloodPressure;
    if (systolic >= 180 || diastolic >= 120) {
      results.bloodPressure = { status: 'critical', message: 'Hypertensive Crisis' };
    } else if (systolic >= 140 || diastolic >= 90) {
      results.bloodPressure = { status: 'warning', message: 'Stage 2 Hypertension' };
    } else if (systolic >= 130 || diastolic >= 80) {
      results.bloodPressure = { status: 'warning', message: 'Stage 1 Hypertension' };
    } else if (systolic >= 120 && diastolic < 80) {
      results.bloodPressure = { status: 'caution', message: 'Elevated Blood Pressure' };
    } else {
      results.bloodPressure = { status: 'normal', message: 'Normal Blood Pressure' };
    }
  }

  // Heart Rate Analysis
  if (data.heartRate) {
    const hr = data.heartRate;
    if (hr > 100) {
      results.heartRate = { status: 'warning', message: 'Tachycardia' };
    } else if (hr < 60) {
      results.heartRate = { status: 'warning', message: 'Bradycardia' };
    } else {
      results.heartRate = { status: 'normal', message: 'Normal Heart Rate' };
    }
  }

  // SpO2 Analysis
  if (data.spO2) {
    const spo2 = data.spO2;
    if (spo2 < 90) {
      results.spO2 = { status: 'critical', message: 'Severe Hypoxia' };
    } else if (spo2 < 95) {
      results.spO2 = { status: 'warning', message: 'Mild Hypoxia' };
    } else {
      results.spO2 = { status: 'normal', message: 'Normal Oxygen Saturation' };
    }
  }

  // Glucose Analysis
  if (data.glucose) {
    const glucose = data.glucose;
    if (glucose > 200) {
      results.glucose = { status: 'critical', message: 'Severe Hyperglycemia' };
    } else if (glucose > 126) {
      results.glucose = { status: 'warning', message: 'Diabetes Range' };
    } else if (glucose > 100) {
      results.glucose = { status: 'caution', message: 'Pre-diabetes Range' };
    } else if (glucose < 70) {
      results.glucose = { status: 'warning', message: 'Hypoglycemia' };
    } else {
      results.glucose = { status: 'normal', message: 'Normal Glucose Level' };
    }
  }

  // EKG Analysis (simplified)
  if (data.ekg) {
    const { rhythm } = data.ekg;
    if (rhythm === 'irregular') {
      results.ekg = { status: 'warning', message: 'Possible Arrhythmia - Requires Further Evaluation' };
    } else {
      results.ekg = { status: 'normal', message: 'Normal Sinus Rhythm' };
    }
  }

  return results;
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for IoT connections`);
});
