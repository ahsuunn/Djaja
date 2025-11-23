import { Router, Request, Response } from 'express';

const router = Router();

// Types for diagnostic analysis
interface DeviceData {
  deviceId: string;
  patientId?: string;
  timestamp: string;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  heartRate?: number;
  spO2?: number;
  temperature?: number;
  glucose?: number;
  ekg?: {
    rhythm: string;
    rate: number;
  };
}

interface VitalAnalysis {
  status: 'normal' | 'caution' | 'warning' | 'critical';
  message: string;
}

interface VitalsAnalysis {
  bloodPressure?: VitalAnalysis;
  heartRate?: VitalAnalysis;
  spO2?: VitalAnalysis;
  temperature?: VitalAnalysis;
  glucose?: VitalAnalysis;
  ekg?: VitalAnalysis;
}

interface DiseaseIndicator {
  condition: string;
  likelihood: 'normal' | 'caution' | 'warning' | 'critical';
  indicators: string[];
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface Recommendation {
  type: 'lifestyle' | 'follow_up' | 'teleconsultation' | 'hospital_referral';
  urgency: 'routine' | 'urgent' | 'immediate';
  message: string;
}

interface ComprehensiveAnalysis {
  analysis: VitalsAnalysis;
  summary: string;
  diseaseIndicators: DiseaseIndicator[];
  prescriptions: Medication[];
  recommendations: Recommendation[];
  overallRisk: 'normal' | 'caution' | 'warning' | 'critical';
}

// Simple diagnostic analysis function (rule-based)
function analyzeVitals(data: DeviceData): VitalsAnalysis {
  const results: VitalsAnalysis = {};

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

  // Temperature Analysis
  if (data.temperature) {
    const temp = data.temperature;
    if (temp >= 39.5) {
      results.temperature = { status: 'critical', message: 'High Fever - Hyperpyrexia' };
    } else if (temp >= 38.0) {
      results.temperature = { status: 'warning', message: 'Fever' };
    } else if (temp >= 37.5) {
      results.temperature = { status: 'caution', message: 'Low-grade Fever' };
    } else if (temp < 35.0) {
      results.temperature = { status: 'warning', message: 'Hypothermia' };
    } else {
      results.temperature = { status: 'normal', message: 'Normal Temperature' };
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

// Comprehensive analysis with disease indicators and recommendations
function generateComprehensiveAnalysis(data: DeviceData): ComprehensiveAnalysis {
  const analysis = analyzeVitals(data);
  const diseaseIndicators: DiseaseIndicator[] = [];
  const prescriptions: Medication[] = [];
  const recommendations: Recommendation[] = [];
  let overallRisk: 'normal' | 'caution' | 'warning' | 'critical' = 'normal';
  
  const abnormalFindings: string[] = [];
  const criticalCount = Object.values(analysis).filter(a => a.status === 'critical').length;
  const warningCount = Object.values(analysis).filter(a => a.status === 'warning').length;

  // Determine overall risk
  if (criticalCount > 0) {
    overallRisk = 'critical';
  } else if (warningCount >= 2) {
    overallRisk = 'warning';
  } else if (warningCount === 1) {
    overallRisk = 'caution';
  }

  // Disease Indicators and Prescriptions based on vital signs
  
  // Hypertension Assessment
  if (data.bloodPressure && analysis.bloodPressure) {
    const { systolic, diastolic } = data.bloodPressure;
    if (systolic >= 180 || diastolic >= 120) {
      abnormalFindings.push('Hypertensive crisis');
      diseaseIndicators.push({
        condition: 'Hypertensive Emergency',
        likelihood: 'critical',
        indicators: [`Blood Pressure: ${systolic}/${diastolic} mmHg`, 'Risk of stroke or heart attack', 'Requires immediate medical attention']
      });
      recommendations.push({
        type: 'hospital_referral',
        urgency: 'immediate',
        message: 'IMMEDIATE HOSPITAL REFERRAL - Hypertensive crisis detected. Risk of organ damage.'
      });
    } else if (systolic >= 140 || diastolic >= 90) {
      abnormalFindings.push('Stage 2 Hypertension');
      diseaseIndicators.push({
        condition: 'Hypertension (Stage 2)',
        likelihood: 'warning',
        indicators: [`Blood Pressure: ${systolic}/${diastolic} mmHg`, 'Persistent high blood pressure', 'Risk of cardiovascular disease']
      });
      prescriptions.push({
        name: 'Amlodipine',
        dosage: '5mg',
        frequency: 'Once daily',
        duration: '30 days',
        instructions: 'Take in the morning with or without food. Monitor blood pressure regularly.'
      });
      recommendations.push({
        type: 'teleconsultation',
        urgency: 'urgent',
        message: 'Schedule teleconsultation with cardiologist within 24-48 hours for medication adjustment.'
      });
      recommendations.push({
        type: 'lifestyle',
        urgency: 'routine',
        message: 'Reduce sodium intake, maintain healthy weight, exercise regularly, avoid alcohol and smoking.'
      });
    } else if (systolic >= 130 || diastolic >= 80) {
      abnormalFindings.push('Stage 1 Hypertension');
      diseaseIndicators.push({
        condition: 'Hypertension (Stage 1)',
        likelihood: 'caution',
        indicators: [`Blood Pressure: ${systolic}/${diastolic} mmHg`, 'Mildly elevated blood pressure']
      });
      recommendations.push({
        type: 'lifestyle',
        urgency: 'routine',
        message: 'Lifestyle modifications recommended: reduce salt, increase physical activity, maintain healthy weight.'
      });
      recommendations.push({
        type: 'follow_up',
        urgency: 'routine',
        message: 'Monitor blood pressure weekly and follow up in 2-3 weeks.'
      });
    }
  }

  // Cardiac Arrhythmia Assessment
  if (data.ekg?.rhythm === 'irregular' || (data.heartRate && (data.heartRate > 100 || data.heartRate < 60))) {
    const hr = data.heartRate || 0;
    if (data.ekg?.rhythm === 'irregular') {
      abnormalFindings.push('Irregular heart rhythm');
      diseaseIndicators.push({
        condition: 'Cardiac Arrhythmia',
        likelihood: 'warning',
        indicators: ['Irregular EKG rhythm detected', `Heart Rate: ${hr} bpm`, 'May indicate atrial fibrillation or other arrhythmias']
      });
      recommendations.push({
        type: 'teleconsultation',
        urgency: 'urgent',
        message: 'Consult with cardiologist for ECG interpretation and potential need for anticoagulation.'
      });
    } else if (hr > 100) {
      abnormalFindings.push(`Tachycardia (${hr} bpm)`);
      diseaseIndicators.push({
        condition: 'Tachycardia',
        likelihood: 'caution',
        indicators: [`Heart Rate: ${hr} bpm (normal: 60-100)`, 'Rapid heart rate']
      });
    } else if (hr < 60) {
      abnormalFindings.push(`Bradycardia (${hr} bpm)`);
      diseaseIndicators.push({
        condition: 'Bradycardia',
        likelihood: 'caution',
        indicators: [`Heart Rate: ${hr} bpm (normal: 60-100)`, 'Slow heart rate']
      });
    }
  }

  // Respiratory/Hypoxia Assessment
  if (data.spO2 && data.spO2 < 95) {
    abnormalFindings.push(`Low oxygen saturation (${data.spO2}%)`);
    if (data.spO2 < 90) {
      diseaseIndicators.push({
        condition: 'Severe Hypoxemia',
        likelihood: 'critical',
        indicators: [`SpO2: ${data.spO2}% (critical: <90%)`, 'Inadequate oxygen in blood', 'Possible respiratory failure or cardiac issue']
      });
      recommendations.push({
        type: 'hospital_referral',
        urgency: 'immediate',
        message: 'IMMEDIATE HOSPITAL REFERRAL - Severe hypoxemia requires oxygen therapy and urgent evaluation.'
      });
    } else {
      diseaseIndicators.push({
        condition: 'Hypoxemia',
        likelihood: 'warning',
        indicators: [`SpO2: ${data.spO2}% (normal: >95%)`, 'Mild to moderate oxygen deficiency']
      });
      recommendations.push({
        type: 'teleconsultation',
        urgency: 'urgent',
        message: 'Urgent teleconsultation needed. May require oxygen supplementation or respiratory evaluation.'
      });
    }
  }

  // Fever/Infection Assessment
  if (data.temperature && data.temperature >= 38.0) {
    abnormalFindings.push(`Fever (${data.temperature}°C)`);
    if (data.temperature >= 39.5) {
      diseaseIndicators.push({
        condition: 'High Fever (Hyperpyrexia)',
        likelihood: 'critical',
        indicators: [`Temperature: ${data.temperature}°C`, 'High fever may indicate severe infection', 'Risk of febrile seizures or organ damage']
      });
      prescriptions.push({
        name: 'Paracetamol',
        dosage: '1000mg',
        frequency: 'Every 6 hours as needed',
        duration: '3-5 days',
        instructions: 'Take with water. Do not exceed 4000mg per day. Seek immediate care if fever persists >3 days.'
      });
      recommendations.push({
        type: 'hospital_referral',
        urgency: 'urgent',
        message: 'Urgent evaluation needed for high fever. Rule out severe infection or sepsis.'
      });
    } else {
      diseaseIndicators.push({
        condition: 'Fever (Possible Infection)',
        likelihood: 'caution',
        indicators: [`Temperature: ${data.temperature}°C`, 'May indicate viral or bacterial infection']
      });
      prescriptions.push({
        name: 'Paracetamol',
        dosage: '500-1000mg',
        frequency: 'Every 6-8 hours as needed',
        duration: '3-5 days',
        instructions: 'Take with water after meals. Monitor temperature. Seek care if fever persists >3 days.'
      });
      recommendations.push({
        type: 'teleconsultation',
        urgency: 'routine',
        message: 'Consider teleconsultation if fever persists beyond 48 hours or worsens.'
      });
      recommendations.push({
        type: 'lifestyle',
        urgency: 'routine',
        message: 'Rest, stay hydrated, monitor temperature regularly.'
      });
    }
  }

  // Generate Summary
  let summary = '';
  if (overallRisk === 'critical') {
    summary = `CRITICAL: Immediate medical attention required. ${abnormalFindings.length} critical finding(s) detected: ${abnormalFindings.join(', ')}. Patient requires emergency care.`;
  } else if (overallRisk === 'warning') {
    summary = `WARNING: Multiple abnormal vital signs detected: ${abnormalFindings.join(', ')}. Urgent medical consultation recommended within 24 hours.`;
  } else if (overallRisk === 'caution') {
    summary = `CAUTION: ${abnormalFindings.length} abnormal finding(s): ${abnormalFindings.join(', ')}. Follow-up and monitoring recommended.`;
  } else {
    summary = 'All vital signs within normal ranges. Continue regular health monitoring and maintain healthy lifestyle.';
  }

  // Add general lifestyle recommendations for all patients
  if (overallRisk === 'normal') {
    recommendations.push({
      type: 'lifestyle',
      urgency: 'routine',
      message: 'Maintain healthy diet, regular exercise, adequate sleep, and stress management.',
    });
  }

  return {
    analysis,
    summary,
    diseaseIndicators,
    prescriptions,
    recommendations,
    overallRisk
  };
}

// POST /api/diagnostics/analyze - Analyze device data and return comprehensive diagnostic results
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const deviceData: DeviceData = req.body;
    
    if (!deviceData.deviceId || !deviceData.timestamp) {
      return res.status(400).json({ error: 'Missing required fields: deviceId and timestamp' });
    }

    // Generate comprehensive analysis
    const comprehensiveAnalysis = generateComprehensiveAnalysis(deviceData);
    
    // Return results with device data and processing timestamp
    res.json({
      ...deviceData,
      processedAt: new Date().toISOString(),
      ...comprehensiveAnalysis,
    });
  } catch (error) {
    console.error('Error analyzing device data:', error);
    res.status(500).json({ error: 'Failed to analyze device data' });
  }
});

export default router;
