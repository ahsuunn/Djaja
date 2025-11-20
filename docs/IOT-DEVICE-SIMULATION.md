# IoT Device Simulation Guide

## Overview

This guide explains how to simulate real-time IoT medical devices that continuously stream vital signs data to the Djaja platform, exactly like how hospital medical devices work.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Device Simulator (Frontend)                │
│  • Continuous data generation with realistic variations     │
│  • Real-time ECG waveform (60 Hz)                          │
│  • Vital signs streaming (configurable interval)            │
└──────────────────────────┬──────────────────────────────────┘
                           │ WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend Server (IoT Gateway)                │
│  • Receives continuous streams                              │
│  • AI-powered vital analysis                                │
│  • Stores observations in MongoDB                           │
│  • Broadcasts to all connected clients                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┴──────────────┐
              │                           │
         MongoDB                   Real-time Dashboard
    (Observation Storage)          (Live Monitoring)
```

## Features

### 1. **Continuous Streaming Mode**
- **Interval Configuration**: Stream data every 0.5-10 seconds
- **Realistic Variations**: Simulates natural body fluctuations (±3-5 units)
- **Auto-generation**: Continuously generates new readings based on baseline

### 2. **Real-Time Visualizations**

#### Live Vitals Display
- Blood Pressure (mmHg)
- Heart Rate (bpm)  
- SpO2 (%)
- Glucose (mg/dL)

#### ECG Waveform (60 Hz)
- P wave (atrial depolarization)
- QRS complex (ventricular depolarization)
- T wave (ventricular repolarization)
- Real-time 60 FPS rendering

#### Vital Trends Charts
- Last 30 data points for each vital
- Automatic scrolling
- Interactive tooltips with timestamps

### 3. **Simulation Scenarios**

#### Normal Patient
```json
{
  "bloodPressure": { "systolic": 120, "diastolic": 80 },
  "heartRate": 75,
  "spO2": 98,
  "glucose": 95,
  "ekg": { "rhythm": "regular" }
}
```

#### Hypertension
```json
{
  "bloodPressure": { "systolic": 145, "diastolic": 95 },
  "heartRate": 88,
  "spO2": 96,
  "glucose": 110,
  "ekg": { "rhythm": "regular" }
}
```

#### Critical Condition
```json
{
  "bloodPressure": { "systolic": 185, "diastolic": 115 },
  "heartRate": 110,
  "spO2": 89,
  "glucose": 220,
  "ekg": { "rhythm": "irregular" }
}
```

#### Hypotension
```json
{
  "bloodPressure": { "systolic": 95, "diastolic": 60 },
  "heartRate": 58,
  "spO2": 94,
  "glucose": 68,
  "ekg": { "rhythm": "regular" }
}
```

## How It Works

### Data Generation Algorithm

```typescript
// 1. Generate realistic variations (simulates natural fluctuations)
const vary = (value: number, range: number) => {
  return Math.round(value + (Math.random() - 0.5) * range);
};

// 2. Apply to all vitals
const newVitals = {
  bloodPressure: {
    systolic: vary(baseVitals.bloodPressure.systolic, 5),
    diastolic: vary(baseVitals.bloodPressure.diastolic, 3),
  },
  heartRate: vary(baseVitals.heartRate, 3),
  spO2: Math.min(100, vary(baseVitals.spO2, 1)),
  glucose: vary(baseVitals.glucose, 5),
};

// 3. Send to backend via WebSocket
socket.emit('device-data', {
  deviceId: `SIM-${Date.now()}`,
  patientId: 'demo-patient',
  ...newVitals,
  timestamp: new Date().toISOString(),
});
```

### ECG Waveform Generation

```typescript
// Simulates one cardiac cycle
const generateECGPoint = () => {
  const phase = (timestamp % 1000) / 1000; // 0 to 1 per second
  let value = 0;

  if (phase < 0.1) {
    // P wave (atrial contraction)
    value = Math.sin(phase * Math.PI * 10) * 0.2;
  } else if (phase < 0.35) {
    // QRS complex (ventricular contraction)
    if (phase < 0.25) value = -0.3; // Q
    else if (phase < 0.3) value = 1.0; // R (peak)
    else value = -0.2; // S
  } else if (phase < 0.7) {
    // T wave (ventricular recovery)
    value = Math.sin((phase - 0.5) * Math.PI * 5) * 0.3;
  }

  // Add realistic noise
  value += (Math.random() - 0.5) * 0.05;
  
  return { timestamp, value };
};
```

## Usage Instructions

### Starting a Streaming Session

1. **Set Baseline Values**
   - Manually enter values, OR
   - Click "Generate Random" for a preset scenario

2. **Configure Stream Interval**
   - Default: 2000ms (2 seconds)
   - Range: 500ms - 10,000ms
   - Lower intervals = more data points

3. **Start Streaming**
   - Click "Start Streaming" button
   - Watch vitals update in real-time
   - Charts automatically populate
   - ECG waveform animates continuously

4. **Monitor Results**
   - Live vitals display updates every interval
   - Trend charts show last 30 data points
   - AI analysis results appear in analysis panel
   - ECG waveform runs at 60 Hz

5. **Stop Streaming**
   - Click "Stop Streaming" to pause
   - Historical data remains visible
   - Can restart anytime

### Single Data Point Mode

For testing individual readings:
1. Set vitals manually
2. Click "Send Single" button
3. Wait for AI analysis result

## Data Flow

### Client → Server (Every Interval)
```json
{
  "deviceId": "SIM-1731234567890",
  "patientId": "demo-patient",
  "bloodPressure": { "systolic": 122, "diastolic": 81 },
  "heartRate": 76,
  "spO2": 98,
  "glucose": 97,
  "ekg": { "rhythm": "regular" },
  "timestamp": "2025-11-16T12:00:00.000Z"
}
```

### Server → Client (Analysis Result)
```json
{
  "analysis": {
    "bloodPressure": {
      "status": "normal",
      "message": "Blood pressure is within normal range"
    },
    "heartRate": {
      "status": "normal", 
      "message": "Heart rate is healthy"
    },
    "spO2": {
      "status": "normal",
      "message": "Oxygen saturation is excellent"
    },
    "glucose": {
      "status": "normal",
      "message": "Blood glucose is normal"
    },
    "ekg": {
      "status": "normal",
      "message": "Heart rhythm is regular and normal"
    }
  },
  "processedAt": "2025-11-16T12:00:00.123Z"
}
```

## External MQTT Simulation (Advanced)

For more realistic IoT device simulation, you can use external MQTT tools:

### Option A: MQTTX Desktop Client

1. **Download**: [MQTTX](https://mqttx.app/)
2. **Connect to Broker**: `mqtt://broker.emqx.io:1883`
3. **Create Script**:

```javascript
// Topic: medical/vitals/patient001/all
// Interval: 2000ms

{
  "systolic": {{ random.int(110, 160) }},
  "diastolic": {{ random.int(70, 100) }},
  "heartRate": {{ random.int(60, 100) }},
  "spO2": {{ random.int(94, 100) }},
  "glucose": {{ random.int(80, 140) }},
  "timestamp": {{ timestamp }}
}
```

### Option B: EMQX Cloud Simulator

1. Sign up at [EMQX Cloud](https://www.emqx.com/en/cloud)
2. Create device simulator
3. Configure:
   - **Topic**: `medical/vitals/#`
   - **QPS**: 0.5 (one message every 2 seconds)
   - **Payload**: JSON with vital signs

### Backend MQTT Integration

Add MQTT subscription to backend:

```typescript
import mqtt from 'mqtt';

const mqttClient = mqtt.connect('mqtt://broker.emqx.io');

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  mqttClient.subscribe('medical/vitals/#');
});

mqttClient.on('message', (topic, message) => {
  const data = JSON.parse(message.toString());
  
  // Forward to WebSocket clients
  io.emit('mqtt-vitals', { topic, data });
  
  // Save to database
  saveObservation(data);
});
```

## Performance Considerations

- **ECG Frequency**: 60 Hz (16ms intervals) for smooth waveform
- **Vitals Frequency**: Configurable (default 2s) to balance realism & load
- **Data Points Stored**: Last 30-100 points per chart (auto-purge old data)
- **WebSocket Connection**: Single persistent connection, multiplexed streams

## Testing Scenarios

### Normal Monitoring Session
1. Start with normal baseline values
2. Set interval to 2000ms
3. Run for 60 seconds
4. Observe stable trends

### Emergency Simulation
1. Generate "Critical" scenario
2. Set interval to 500ms (rapid updates)
3. Watch AI warnings trigger
4. Observe ECG irregularities

### Long-term Monitoring
1. Set interval to 5000ms
2. Run for 10+ minutes
3. Verify data persistence
4. Check chart performance

## Troubleshooting

### Connection Issues
- **Symptom**: Red "Disconnected" indicator
- **Solution**: Ensure backend server is running on port 5000

### Chart Not Updating
- **Symptom**: Flat lines on trend charts
- **Solution**: Start streaming mode, not just single sends

### ECG Waveform Frozen
- **Symptom**: No waveform animation
- **Solution**: Start streaming to activate ECG generator

### Performance Degradation
- **Symptom**: Lag after long sessions
- **Solution**: Stop and restart streaming to clear history

## API Integration

### WebSocket Events

#### Client → Server
```typescript
// Send device data
socket.emit('device-data', deviceData);
```

#### Server → Client
```typescript
// Receive analysis
socket.on('diagnostic-result', (result) => {
  console.log('Analysis:', result);
});

// Receive MQTT data (if MQTT enabled)
socket.on('mqtt-vitals', ({ topic, data }) => {
  console.log('MQTT:', topic, data);
});
```

## Future Enhancements

- [ ] Multi-patient streaming
- [ ] Historical playback mode
- [ ] Export session data
- [ ] Alert threshold configuration
- [ ] MQTT broker integration
- [ ] Bluetooth device pairing
- [ ] HL7 FHIR export
- [ ] Multi-lead ECG (12-lead)
- [ ] Arrhythmia simulation
- [ ] Drug effect simulation

## References

- [MQTTX Documentation](https://mqttx.app/docs)
- [EMQX Cloud](https://www.emqx.com/en/cloud)
- [Recharts Documentation](https://recharts.org/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [ECG Waveform Standards](https://en.wikipedia.org/wiki/Electrocardiography)
