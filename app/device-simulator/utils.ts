import { StreamingState, VitalHistory, VitalSigns } from './types';

// Helper randomization functions with bounds
export const vary = (value: number, range: number, min: number, max: number) => {
  const varied = Math.round(value + (Math.random() - 0.5) * range);
  return Math.max(min, Math.min(max, varied));
};

export const varyDecimal = (value: number, range: number, min: number, max: number) => {
  const varied = Math.round((value + (Math.random() - 0.5) * range) * 10) / 10;
  return Math.max(min, Math.min(max, varied));
};

// Generate realistic vital variations for all vitals
export const generateRealisticVitals = (baseVitals: VitalSigns): VitalSigns => ({
  bloodPressure: {
    systolic: vary(baseVitals.bloodPressure.systolic, 5, 70, 220),
    diastolic: vary(baseVitals.bloodPressure.diastolic, 3, 40, 130),
  },
  heartRate: vary(baseVitals.heartRate, 3, 40, 200),
  spO2: vary(baseVitals.spO2, 1, 70, 100),
  temperature: varyDecimal(baseVitals.temperature, 0.2, 35.0, 42.0),
  ekg: baseVitals.ekg,
});

// Generate realistic changes only for a single vital while leaving others unchanged
export const generatePartialVitals = (vitalType: keyof StreamingState, baseVitals: VitalSigns): VitalSigns => {
  const bp = { ...baseVitals.bloodPressure };
  let hr = baseVitals.heartRate;
  let spo2 = baseVitals.spO2;
  let temp = baseVitals.temperature;
  const ekg = baseVitals.ekg;

  switch (vitalType) {
    case 'bloodPressure':
      bp.systolic = vary(bp.systolic, 5, 70, 220);
      bp.diastolic = vary(bp.diastolic, 3, 40, 130);
      break;
    case 'heartRate':
      hr = vary(hr, 3, 40, 200);
      break;
    case 'spO2':
      spo2 = vary(spo2, 1, 70, 100);
      break;
    case 'temperature':
      temp = varyDecimal(temp, 0.2, 35.0, 42.0);
      break;
    default:
      break;
  }

  return {
    bloodPressure: bp,
    heartRate: hr,
    spO2: spo2,
    temperature: temp,
    ekg,
  };
};

// Generate random vital signs from predefined scenarios
export const generateRandomVitals = (): VitalSigns => {
  const scenarios = [
    // Normal
    { bp: { systolic: 120, diastolic: 80 }, hr: 75, spo2: 98, temp: 36.8, ekg: 'regular' },
    // Hypertension
    { bp: { systolic: 145, diastolic: 95 }, hr: 88, spo2: 96, temp: 37.2, ekg: 'regular' },
    // Critical
    { bp: { systolic: 185, diastolic: 115 }, hr: 110, spo2: 89, temp: 38.5, ekg: 'irregular' },
    // Hypotension
    { bp: { systolic: 95, diastolic: 60 }, hr: 58, spo2: 94, temp: 35.8, ekg: 'regular' },
  ];

  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  return {
    bloodPressure: scenario.bp,
    heartRate: scenario.hr,
    spO2: scenario.spo2,
    temperature: scenario.temp,
    ekg: { rhythm: scenario.ekg as 'regular' | 'irregular' },
  };
};

// Add data point to vital history
export const addToHistory = (
  vitalType: keyof VitalHistory,
  value: number,
  setVitalHistory: React.Dispatch<React.SetStateAction<VitalHistory>>
) => {
  const timestamp = Date.now();
  const maxPoints = 30;

  setVitalHistory((prev) => ({
    ...prev,
    [vitalType]: [
      ...prev[vitalType].slice(-maxPoints + 1),
      { timestamp, value },
    ],
  }));
};

// Generate ECG waveform data point
export const generateECGPoint = (setVitalHistory: React.Dispatch<React.SetStateAction<VitalHistory>>) => {
  const timestamp = Date.now();
  const phase = (timestamp % 1000) / 1000;
  let value = 0;

  if (phase < 0.1) {
    value = Math.sin(phase * Math.PI * 10) * 0.2;
  } else if (phase < 0.2) {
    value = 0;
  } else if (phase < 0.35) {
    if (phase < 0.25) value = -0.3;
    else if (phase < 0.3) value = 1.0;
    else value = -0.2;
  } else if (phase < 0.5) {
    value = 0;
  } else if (phase < 0.7) {
    value = Math.sin((phase - 0.5) * Math.PI * 5) * 0.3;
  }

  value += (Math.random() - 0.5) * 0.05;

  setVitalHistory((prev) => ({
    ...prev,
    ecg: [...prev.ecg.slice(-100), { timestamp, value }],
  }));
};

// Get status color for diagnostic results
export const getStatusColor = (status?: string) => {
  switch (status) {
    case 'normal':
      return 'text-green-600 bg-green-50';
    case 'caution':
      return 'text-yellow-600 bg-yellow-50';
    case 'warning':
      return 'text-orange-600 bg-orange-50';
    case 'critical':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};
