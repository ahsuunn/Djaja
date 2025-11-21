
export interface VitalSigns {
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  heartRate: number;
  spO2: number;
  temperature: number;
  ekg: {
    rhythm: 'regular' | 'irregular';
  };
}

export interface DiagnosticResult {
  analysis: {
    bloodPressure?: { status: string; message: string };
    heartRate?: { status: string; message: string };
    spO2?: { status: string; message: string };
    temperature?: { status: string; message: string };
    ekg?: { status: string; message: string };
  };
  processedAt: string;
}

export interface DataPoint {
  timestamp: number;
  value: number;
}

export interface VitalHistory {
  bloodPressure: DataPoint[];
  heartRate: DataPoint[];
  spO2: DataPoint[];
  temperature: DataPoint[];
  ecg: DataPoint[];
}

export interface StreamingState {
  bloodPressure: boolean;
  heartRate: boolean;
  spO2: boolean;
  temperature: boolean;
  ekg: boolean;
}

export interface Patient {
  _id: string;
  patientId: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  bloodType: string;
}

