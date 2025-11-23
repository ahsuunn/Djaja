import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { VitalSigns } from '@/app/device-simulator/types';

interface PatientInfo {
  name: string;
  id: string;
  age?: number;
  gender?: string;
  bloodType?: string;
}

interface VitalAnalysis {
  status: string;
  message: string;
}

interface DiseaseIndicator {
  condition: string;
  likelihood: string;
  indicators: string[];
}

interface Prescription {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface Recommendation {
  type: string;
  urgency: string;
  message: string;
}

interface PDFExportData {
  patient: PatientInfo;
  vitals: VitalSigns;
  vitalAnalysis?: {
    bloodPressure?: VitalAnalysis;
    heartRate?: VitalAnalysis;
    spO2?: VitalAnalysis;
    temperature?: VitalAnalysis;
    ekg?: VitalAnalysis;
  };
  overallAssessment?: {
    risk: string;
    summary: string;
  };
  diseaseIndicators?: DiseaseIndicator[];
  prescriptions?: Prescription[];
  recommendations?: Recommendation[];
  timestamp: Date;
  facilityName?: string;
}

export const generateMinimalistPDF = (data: PDFExportData): void => {
  const doc = new jsPDF();
  let yPosition = 20;

  // Header - Centered
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Diagnostic Report', 105, yPosition, { align: 'center' });
  yPosition += 8;

  // Facility info - Centered
  if (data.facilityName) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(data.facilityName, 105, yPosition, { align: 'center' });
    yPosition += 6;
  }

  // Date and time - Centered
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${data.timestamp.toLocaleString()}`, 105, yPosition, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  yPosition += 12;

  // Draw separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 10;

  // Patient Information Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Information', 20, yPosition);
  yPosition += 2;
  doc.line(20, yPosition, 80, yPosition);
  yPosition += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const patientInfo = [
    ['Name:', data.patient.name],
    ['Patient ID:', data.patient.id],
    ...(data.patient.gender ? [['Gender:', data.patient.gender]] : []),
    ...(data.patient.bloodType ? [['Blood Type:', data.patient.bloodType]] : []),
  ];

  patientInfo.forEach(([label, value]) => {
    doc.setTextColor(100, 100, 100);
    doc.text(label, 25, yPosition);
    doc.setTextColor(0, 0, 0);
    doc.text(value, 55, yPosition);
    yPosition += 5;
  });

  yPosition += 5;

  // Vital Signs Section
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Vital Signs', 20, yPosition);
  yPosition += 2;
  doc.line(20, yPosition, 60, yPosition);
  yPosition += 6;

  // Vital signs rows
  const vitalSigns = [
    {
      name: 'Blood Pressure',
      value: `${data.vitals.bloodPressure.systolic}/${data.vitals.bloodPressure.diastolic} mmHg`,
      status: getVitalStatus('bp', data.vitals),
      message: data.vitalAnalysis?.bloodPressure?.message || '',
    },
    {
      name: 'Heart Rate',
      value: `${data.vitals.heartRate} bpm`,
      status: getVitalStatus('hr', data.vitals),
      message: data.vitalAnalysis?.heartRate?.message || '',
    },
    {
      name: 'Oxygen Saturation (SpO2)',
      value: `${data.vitals.spO2}%`,
      status: getVitalStatus('spo2', data.vitals),
      message: data.vitalAnalysis?.spO2?.message || '',
    },
    {
      name: 'Temperature',
      value: `${data.vitals.temperature.toFixed(1)}°C`,
      status: getVitalStatus('temp', data.vitals),
      message: data.vitalAnalysis?.temperature?.message || '',
    },
  ];

  if (data.vitalAnalysis?.ekg) {
    vitalSigns.push({
      name: 'EKG Rhythm',
      value: data.vitals.ekg.rhythm.charAt(0).toUpperCase() + data.vitals.ekg.rhythm.slice(1),
      status: data.vitalAnalysis.ekg.status === 'critical' ? 'Abnormal' : 
              data.vitalAnalysis.ekg.status === 'warning' ? 'Warning' : 'Normal',
      message: data.vitalAnalysis.ekg.message,
    });
  }

  doc.setFontSize(9);
  vitalSigns.forEach((vital, idx) => {
    if (idx > 0) {
      doc.setDrawColor(240, 240, 240);
      doc.line(25, yPosition - 2, 190, yPosition - 2);
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(vital.name, 25, yPosition);
    
    doc.setFont('helvetica', 'normal');
    doc.text(vital.value, 140, yPosition, { align: 'right' });
    
    // Status color
    const statusColor = vital.status === 'Abnormal' ? [220, 38, 38] : 
                       vital.status === 'Warning' ? [234, 88, 12] : [22, 163, 74];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.setFontSize(8);
    doc.text(vital.status, 190, yPosition, { align: 'right' });
    
    yPosition += 4;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    const splitMessage = doc.splitTextToSize(vital.message, 160);
    doc.text(splitMessage, 25, yPosition);
    yPosition += splitMessage.length * 3.5 + 4;
    doc.setTextColor(0, 0, 0);
  });

  yPosition += 3;

  // Overall Assessment Section
  if (data.overallAssessment) {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Overall Assessment', 20, yPosition);
    yPosition += 2;
    doc.line(20, yPosition, 85, yPosition);
    yPosition += 6;

    // Risk badge
    const risk = data.overallAssessment.risk;
    const riskColor = risk === 'critical' ? [220, 38, 38] :
                     risk === 'high' ? [234, 88, 12] :
                     risk === 'moderate' ? [202, 138, 4] : [22, 163, 74];
    
    doc.setFillColor(riskColor[0], riskColor[1], riskColor[2], 0.1);
    doc.setDrawColor(riskColor[0], riskColor[1], riskColor[2]);
    doc.roundedRect(25, yPosition - 3, 35, 6, 1, 1, 'FD');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
    doc.text(`${risk.toUpperCase()} RISK`, 42.5, yPosition, { align: 'center' });
    yPosition += 8;

    // Summary text
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    const splitSummary = doc.splitTextToSize(data.overallAssessment.summary, 165);
    doc.text(splitSummary, 25, yPosition);
    yPosition += splitSummary.length * 4 + 8;
  }

  // Disease Indicators Section
  if (data.diseaseIndicators && data.diseaseIndicators.length > 0) {
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Disease Indicators', 20, yPosition);
    yPosition += 2;
    doc.line(20, yPosition, 75, yPosition);
    yPosition += 6;

    doc.setFontSize(9);
    data.diseaseIndicators.forEach((indicator) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(indicator.condition, 25, yPosition);

      const likelihoodColor = indicator.likelihood === 'critical' ? [220, 38, 38] :
                             indicator.likelihood === 'high' ? [234, 88, 12] :
                             indicator.likelihood === 'moderate' ? [202, 138, 4] : [37, 99, 235];
      doc.setFontSize(7);
      doc.setTextColor(likelihoodColor[0], likelihoodColor[1], likelihoodColor[2]);
      doc.text(indicator.likelihood.toUpperCase(), 190, yPosition, { align: 'right' });
      yPosition += 4;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      indicator.indicators.forEach((ind) => {
        const splitInd = doc.splitTextToSize(`• ${ind}`, 160);
        doc.text(splitInd, 30, yPosition);
        yPosition += splitInd.length * 3 + 1;
      });
      yPosition += 3;
    });

    yPosition += 2;
  }

  // Prescriptions Section
  if (data.prescriptions && data.prescriptions.length > 0) {
    if (yPosition > 230) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Recommended Medications', 20, yPosition);
    yPosition += 2;
    doc.line(20, yPosition, 95, yPosition);
    yPosition += 6;

    doc.setFontSize(9);
    data.prescriptions.forEach((med) => {
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(med.name, 25, yPosition);
      yPosition += 4;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Dosage: ${med.dosage}`, 30, yPosition);
      doc.text(`Frequency: ${med.frequency}`, 80, yPosition);
      doc.text(`Duration: ${med.duration}`, 130, yPosition);
      yPosition += 4;

      doc.setTextColor(50, 50, 50);
      const splitInstructions = doc.splitTextToSize(med.instructions, 160);
      doc.text(splitInstructions, 30, yPosition);
      yPosition += splitInstructions.length * 3 + 5;
    });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120, 120, 120);
    doc.text('⚠ Note: Consult with a licensed physician before taking any medication.', 25, yPosition);
    yPosition += 8;
  }

  // Recommendations Section
  if (data.recommendations && data.recommendations.length > 0) {
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Medical Recommendations', 20, yPosition);
    yPosition += 2;
    doc.line(20, yPosition, 95, yPosition);
    yPosition += 6;

    doc.setFontSize(9);
    data.recommendations.forEach((rec) => {
      if (yPosition > 265) {
        doc.addPage();
        yPosition = 20;
      }

      const urgencyColor = rec.urgency === 'immediate' ? [220, 38, 38] :
                          rec.urgency === 'urgent' ? [234, 88, 12] : [37, 99, 235];
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(urgencyColor[0], urgencyColor[1], urgencyColor[2]);
      doc.text(rec.urgency.toUpperCase(), 25, yPosition);

      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const recType = rec.type === 'teleconsultation' ? 'Teleconsultation' :
                     rec.type === 'hospital_referral' ? 'Hospital Referral' :
                     rec.type === 'follow_up' ? 'Follow-up' : 'Lifestyle';
      doc.text(recType, 50, yPosition);
      yPosition += 4;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      const splitMessage = doc.splitTextToSize(rec.message, 160);
      doc.text(splitMessage, 25, yPosition);
      yPosition += splitMessage.length * 4 + 4;
    });
  }

  // Download PDF
  const filename = `diagnostic-report-${data.patient.id}-${Date.now()}.pdf`;
  doc.save(filename);
};

// Helper function to determine vital status
const getVitalStatus = (vital: 'bp' | 'hr' | 'spo2' | 'temp', vitals: VitalSigns): string => {
  switch (vital) {
    case 'bp': {
      const { systolic, diastolic } = vitals.bloodPressure;
      if (systolic < 90 || systolic > 140 || diastolic < 60 || diastolic > 90) return 'Abnormal';
      if (systolic < 100 || systolic > 130 || diastolic < 65 || diastolic > 85) return 'Warning';
      return 'Normal';
    }
    case 'hr': {
      const hr = vitals.heartRate;
      if (hr < 60 || hr > 100) return 'Abnormal';
      if (hr < 65 || hr > 95) return 'Warning';
      return 'Normal';
    }
    case 'spo2': {
      const spo2 = vitals.spO2;
      if (spo2 < 90) return 'Abnormal';
      if (spo2 < 95) return 'Warning';
      return 'Normal';
    }
    case 'temp': {
      const temp = vitals.temperature;
      if (temp < 36.0 || temp > 38.0) return 'Abnormal';
      if (temp < 36.5 || temp > 37.5) return 'Warning';
      return 'Normal';
    }
    default:
      return 'Unknown';
  }
};
