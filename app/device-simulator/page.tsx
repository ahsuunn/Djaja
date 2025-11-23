'use client';

import { useState, useEffect, useRef } from 'react';
import { Activity, Heart, Droplet, Stethoscope, Zap, Play, Pause, Wifi, WifiOff, Thermometer, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import io, { Socket } from 'socket.io-client';
import { DiagnosticResult, StreamingState, VitalHistory, VitalSigns } from './types';
import { generateRandomVitals, generatePartialVitals, addToHistory, generateECGPoint, getStatusColor } from './utils';
import PatientSelector, { Patient } from '@/components/PatientSelector';

export default function DeviceSimulator() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [vitals, setVitals] = useState<VitalSigns>({
    bloodPressure: { systolic: 0, diastolic: 0 },
    heartRate: 0,
    spO2: 0,
    temperature: 0,
    ekg: { rhythm: 'regular' },
  });
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState<StreamingState>({
    bloodPressure: false,
    heartRate: false,
    spO2: false,
    temperature: false,
    ekg: false,
    stethoscope: false,
  });
  const [streamInterval, setStreamInterval] = useState(2000); // ms
  const [vitalHistory, setVitalHistory] = useState<VitalHistory>({
    bloodPressure: [],
    heartRate: [],
    spO2: [],
    temperature: [],
    ecg: [],
    stethoscope: [],
  });
  const streamIntervalsRef = useRef<Record<string, NodeJS.Timeout | null>>({
    bloodPressure: null,
    heartRate: null,
    spO2: null,
    temperature: null,
    ekg: null,
    stethoscope: null,
  });
  const ecgIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isComprehensiveAnalysisRef = useRef(false);
  
  // Patient state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  // Comprehensive analysis state
  const [isCollectingVitals, setIsCollectingVitals] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [collectedReadings, setCollectedReadings] = useState(0);
  const totalReadingsNeeded = 5; // Number of vital readings to collect

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000';
    const newSocket = io(wsUrl);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    newSocket.on('diagnostic-result', (data: DiagnosticResult) => {
      setResult(data);
      setIsSending(false);
      if (isComprehensiveAnalysisRef.current) {
        setShowSummaryModal(true);
        isComprehensiveAnalysisRef.current = false;
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const handleGenerateRandomVitals = () => {
    setVitals(generateRandomVitals());
  };

  const startComprehensiveAnalysis = () => {
    if (!isConnected) {
      alert('Not connected to server. Please ensure the backend is running.');
      return;
    }
    
    isComprehensiveAnalysisRef.current = true;
    setIsCollectingVitals(true);
    setCollectedReadings(0);
    setResult(null);
    
    // Generate initial vitals if not set
    const initialVitals = vitals.heartRate === 0 ? generateRandomVitals() : vitals;
    setVitals(initialVitals);
    
    // Collect readings over time
    let readingCount = 0;
    const collectionInterval = setInterval(() => {
      readingCount++;
      setCollectedReadings(readingCount);
      
      if (readingCount >= totalReadingsNeeded) {
        clearInterval(collectionInterval);
        setIsCollectingVitals(false);
        // Send final comprehensive data
        sendToCloud(initialVitals);
      }
    }, 1000);
  };

  const downloadPDF = () => {
    if (!result) return;
    
    // Create a printable HTML content
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Medical Summary - ${selectedPatient?.name || 'Patient'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            padding: 48px; 
            line-height: 1.6; 
            color: #1a1a1a;
            background: white;
            font-size: 14px;
          }
          .header { 
            margin-bottom: 48px; 
            padding-bottom: 24px; 
            border-bottom: 1px solid #e5e5e5; 
          }
          .header h1 { 
            font-size: 28px; 
            font-weight: 600; 
            color: #000; 
            margin-bottom: 8px;
            letter-spacing: -0.5px;
          }
          .header p { 
            color: #666; 
            font-size: 13px; 
          }
          .risk-badge { 
            display: inline-block; 
            padding: 6px 14px; 
            border-radius: 6px; 
            font-weight: 500; 
            font-size: 12px;
            letter-spacing: 0.5px;
          }
          .critical { background: #fee; color: #dc2626; border: 1px solid #fcc; }
          .high { background: #fff4ed; color: #ea580c; border: 1px solid #fed7aa; }
          .moderate { background: #fefce8; color: #ca8a04; border: 1px solid #fef08a; }
          .low { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
          .section { 
            margin: 36px 0; 
            page-break-inside: avoid; 
          }
          .section-title { 
            font-size: 16px; 
            font-weight: 600; 
            color: #000; 
            margin-bottom: 16px; 
            letter-spacing: -0.3px;
          }
          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 12px; 
            margin: 16px 0; 
          }
          .info-item { 
            padding: 12px 16px; 
            background: #fafafa; 
            border-radius: 6px;
            border: 1px solid #f0f0f0;
          }
          .info-item strong { 
            color: #666; 
            font-weight: 500; 
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 4px;
          }
          .info-item span { 
            color: #000; 
            font-size: 14px; 
          }
          .vital { 
            padding: 14px 16px; 
            margin: 8px 0; 
            border-radius: 6px; 
            border: 1px solid;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .vital-label { font-weight: 500; color: #000; }
          .vital-value { 
            font-family: 'SF Mono', Monaco, monospace; 
            font-size: 13px;
            color: #666;
          }
          .vital-message { 
            font-size: 12px; 
            color: #666; 
            margin-top: 6px;
            display: block;
          }
          .normal { background: #f9fef9; border-color: #d1fad1; }
          .caution { background: #fefef9; border-color: #fef4c7; }
          .warning { background: #fffaf5; border-color: #fed7aa; }
          .critical-vital { background: #fef9f9; border-color: #fecaca; }
          .indicator { 
            margin: 12px 0; 
            padding: 16px; 
            border-radius: 6px; 
            background: #fafafa;
            border: 1px solid #f0f0f0;
          }
          .indicator-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }
          .indicator-title { font-weight: 500; color: #000; font-size: 14px; }
          .likelihood-badge {
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .likelihood-critical { background: #fee; color: #dc2626; }
          .likelihood-high { background: #fff4ed; color: #ea580c; }
          .likelihood-moderate { background: #fefce8; color: #ca8a04; }
          .likelihood-low { background: #f0f9ff; color: #0369a1; }
          .indicator ul { 
            list-style: none; 
            margin-top: 8px;
          }
          .indicator li { 
            padding: 4px 0;
            padding-left: 16px;
            position: relative;
            font-size: 13px;
            color: #666;
          }
          .indicator li:before {
            content: "•";
            position: absolute;
            left: 0;
            color: #999;
          }
          .prescription { 
            margin: 16px 0; 
            padding: 16px; 
            border: 1px solid #e5e5e5; 
            border-radius: 6px; 
            background: #fafafa;
          }
          .prescription h3 { 
            font-size: 15px; 
            font-weight: 600; 
            color: #000; 
            margin-bottom: 10px; 
          }
          .prescription-meta {
            display: flex;
            gap: 20px;
            margin-bottom: 10px;
            font-size: 12px;
          }
          .prescription-meta-item { color: #666; }
          .prescription-meta-item strong { color: #999; font-weight: 500; }
          .prescription p { 
            font-size: 13px; 
            color: #666; 
            line-height: 1.5;
          }
          .recommendation { 
            margin: 12px 0; 
            padding: 14px 16px; 
            border-radius: 6px; 
            background: #fafafa;
            border: 1px solid #e5e5e5;
          }
          .rec-header {
            display: flex;
            gap: 8px;
            align-items: center;
            margin-bottom: 8px;
          }
          .urgency-badge {
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .urgency-immediate { background: #fee; color: #dc2626; }
          .urgency-urgent { background: #fff4ed; color: #ea580c; }
          .urgency-routine { background: #f0f9ff; color: #0369a1; }
          .rec-type { 
            font-weight: 500; 
            font-size: 13px; 
            color: #000; 
          }
          .rec-message { 
            font-size: 13px; 
            color: #666; 
            line-height: 1.6;
          }
          .note { 
            font-size: 12px; 
            color: #999; 
            font-style: italic; 
            margin-top: 16px;
            padding: 12px;
            background: #fafafa;
            border-radius: 6px;
            border: 1px solid #f0f0f0;
          }
          .footer { 
            margin-top: 64px; 
            padding-top: 24px; 
            border-top: 1px solid #e5e5e5; 
            text-align: center; 
            color: #999;
            font-size: 12px;
          }
          .footer p { margin: 4px 0; }
          @media print { 
            body { padding: 32px; } 
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Medical Diagnostic Summary</h1>
          <p>${new Date(result.processedAt).toLocaleString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
          })}</p>
        </div>
        
        <div class="section">
          <div class="section-title">Patient Information</div>
          <div class="info-grid">
            <div class="info-item">
              <strong>Name</strong>
              <span>${selectedPatient?.name || 'Demo Patient'}</span>
            </div>
            <div class="info-item">
              <strong>Patient ID</strong>
              <span>${selectedPatient?.patientId || 'demo-patient'}</span>
            </div>
            <div class="info-item">
              <strong>Gender</strong>
              <span>${selectedPatient?.gender || 'N/A'}</span>
            </div>
            <div class="info-item">
              <strong>Blood Type</strong>
              <span>${selectedPatient?.bloodType || 'N/A'}</span>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Overall Assessment</div>
          <p style="margin-bottom: 12px;">
            <span class="risk-badge ${result.overallRisk}">${result.overallRisk.toUpperCase()} RISK</span>
          </p>
          <p style="color: #666; line-height: 1.7;">${result.summary}</p>
        </div>
        
        <div class="section">
          <div class="section-title">Vital Signs</div>
          ${result.analysis.bloodPressure ? `
            <div class="vital ${result.analysis.bloodPressure.status === 'critical' ? 'critical-vital' : result.analysis.bloodPressure.status}">
              <div>
                <span class="vital-label">Blood Pressure</span>
                <span class="vital-message">${result.analysis.bloodPressure.message}</span>
              </div>
              <span class="vital-value">${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic} mmHg</span>
            </div>
          ` : ''}
          ${result.analysis.heartRate ? `
            <div class="vital ${result.analysis.heartRate.status === 'critical' ? 'critical-vital' : result.analysis.heartRate.status}">
              <div>
                <span class="vital-label">Heart Rate</span>
                <span class="vital-message">${result.analysis.heartRate.message}</span>
              </div>
              <span class="vital-value">${vitals.heartRate} bpm</span>
            </div>
          ` : ''}
          ${result.analysis.spO2 ? `
            <div class="vital ${result.analysis.spO2.status === 'critical' ? 'critical-vital' : result.analysis.spO2.status}">
              <div>
                <span class="vital-label">Oxygen Saturation</span>
                <span class="vital-message">${result.analysis.spO2.message}</span>
              </div>
              <span class="vital-value">${vitals.spO2}%</span>
            </div>
          ` : ''}
          ${result.analysis.temperature ? `
            <div class="vital ${result.analysis.temperature.status === 'critical' ? 'critical-vital' : result.analysis.temperature.status}">
              <div>
                <span class="vital-label">Temperature</span>
                <span class="vital-message">${result.analysis.temperature.message}</span>
              </div>
              <span class="vital-value">${vitals.temperature}°C</span>
            </div>
          ` : ''}
          ${result.analysis.ekg ? `
            <div class="vital ${result.analysis.ekg.status === 'critical' ? 'critical-vital' : result.analysis.ekg.status}">
              <div>
                <span class="vital-label">EKG Rhythm</span>
                <span class="vital-message">${result.analysis.ekg.message}</span>
              </div>
              <span class="vital-value" style="text-transform: capitalize;">${vitals.ekg.rhythm}</span>
            </div>
          ` : ''}
        </div>
        
        ${result.diseaseIndicators && result.diseaseIndicators.length > 0 ? `
          <div class="section">
            <div class="section-title">Disease Indicators</div>
            ${result.diseaseIndicators.map(indicator => `
              <div class="indicator">
                <div class="indicator-header">
                  <span class="indicator-title">${indicator.condition}</span>
                  <span class="likelihood-badge likelihood-${indicator.likelihood}">${indicator.likelihood}</span>
                </div>
                <ul>
                  ${indicator.indicators.map(ind => `<li>${ind}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${result.prescriptions && result.prescriptions.length > 0 ? `
          <div class="section">
            <div class="section-title">Recommended Medications</div>
            ${result.prescriptions.map(med => `
              <div class="prescription">
                <h3>${med.name}</h3>
                <div class="prescription-meta">
                  <div class="prescription-meta-item"><strong>Dosage</strong> ${med.dosage}</div>
                  <div class="prescription-meta-item"><strong>Frequency</strong> ${med.frequency}</div>
                  <div class="prescription-meta-item"><strong>Duration</strong> ${med.duration}</div>
                </div>
                <p>${med.instructions}</p>
              </div>
            `).join('')}
            <div class="note">
              Note: These are automated recommendations. Consult with a licensed physician before taking any medication.
            </div>
          </div>
        ` : ''}
        
        ${result.recommendations && result.recommendations.length > 0 ? `
          <div class="section">
            <div class="section-title">Medical Recommendations</div>
            ${result.recommendations.map(rec => `
              <div class="recommendation">
                <div class="rec-header">
                  <span class="urgency-badge urgency-${rec.urgency}">${rec.urgency}</span>
                  <span class="rec-type">${
                    rec.type === 'teleconsultation' ? 'Teleconsultation' :
                    rec.type === 'hospital_referral' ? 'Hospital Referral' :
                    rec.type === 'follow_up' ? 'Follow-up' : 'Lifestyle'
                  }</span>
                </div>
                <p class="rec-message">${rec.message}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        <div class="footer">
          <p>Djaja Diagnostics IoT System</p>
          <p>Report ID: SIM-${Date.now()}</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const sendToCloud = (vitalData?: VitalSigns) => {
    if (!socket || !isConnected) {
      alert('Not connected to server. Please ensure the backend is running.');
      return;
    }

    const dataToSend = vitalData || vitals;
    setIsSending(true);
    setResult(null);

    const deviceData = {
      deviceId: `SIM-${Date.now()}`,
      patientId: selectedPatient?.patientId || 'demo-patient',
      bloodPressure: dataToSend.bloodPressure,
      heartRate: dataToSend.heartRate,
      spO2: dataToSend.spO2,
      temperature: dataToSend.temperature,
      ekg: dataToSend.ekg,
      timestamp: new Date().toISOString(),
    };

    socket.emit('device-data', deviceData);
    console.log('📡 Sending data:', deviceData);
  };

  // Start streaming individual vital
  const startVitalStreaming = (vitalType: keyof StreamingState) => {
    if (!isConnected) {
      alert('Not connected to server. Please ensure the backend is running.');
      return;
    }

    // Stop all currently streaming vitals before starting the new one
    Object.keys(isStreaming).forEach((key) => {
      if (isStreaming[key as keyof StreamingState]) {
        stopVitalStreaming(key as keyof StreamingState);
      }
    });

    setIsStreaming((prev) => ({ ...prev, [vitalType]: true }));
    console.log(`▶️ Starting ${vitalType} stream...`);

    if (vitalType === 'ekg') {
      // Stream ECG waveform at higher frequency
      ecgIntervalRef.current = setInterval(() => {
        generateECGPoint(setVitalHistory);
      }, 16); // ~60 FPS
    } else if (vitalType === 'stethoscope') {
      // Stream stethoscope sound waveform
      streamIntervalsRef.current[vitalType] = setInterval(() => {
        const soundValue = Math.sin(Date.now() / 100) * 50 + Math.random() * 20;
        setVitalHistory(prev => ({
          ...prev,
          stethoscope: [...prev.stethoscope.slice(-50), { timestamp: Date.now(), value: soundValue }]
        }));
      }, 50);
    } else {
      // Stream only the selected vital at specified interval (leave others unchanged)
      streamIntervalsRef.current[vitalType] = setInterval(() => {
        setVitals((prev) => {
          const updated = generatePartialVitals(vitalType, prev);

          // Update specific vital history based on updated values
          switch (vitalType) {
            case 'bloodPressure':
              addToHistory('bloodPressure', updated.bloodPressure.systolic, setVitalHistory);
              break;
            case 'heartRate':
              addToHistory('heartRate', updated.heartRate, setVitalHistory);
              break;
            case 'spO2':
              addToHistory('spO2', updated.spO2, setVitalHistory);
              break;
            case 'temperature':
              addToHistory('temperature', updated.temperature, setVitalHistory);
              break;
          }

          // Send only the updated vitals snapshot to cloud
          sendToCloud(updated);
          return updated;
        });
      }, streamInterval);
    }
  };

  // Stop streaming individual vital
  const stopVitalStreaming = (vitalType: keyof StreamingState) => {
    setIsStreaming((prev) => ({ ...prev, [vitalType]: false }));
    console.log(`⏸️ Stopping ${vitalType} stream...`);

    if (vitalType === 'ekg') {
      if (ecgIntervalRef.current) {
        clearInterval(ecgIntervalRef.current);
        ecgIntervalRef.current = null;
      }
    } else if (vitalType === 'stethoscope') {
      if (streamIntervalsRef.current[vitalType]) {
        clearInterval(streamIntervalsRef.current[vitalType]!);
        streamIntervalsRef.current[vitalType] = null;
      }
    } else {
      if (streamIntervalsRef.current[vitalType]) {
        clearInterval(streamIntervalsRef.current[vitalType]!);
        streamIntervalsRef.current[vitalType] = null;
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.keys(streamIntervalsRef.current).forEach((key) => {
        if (streamIntervalsRef.current[key]) {
          clearInterval(streamIntervalsRef.current[key]!);
        }
      });
      if (ecgIntervalRef.current) {
        clearInterval(ecgIntervalRef.current);
      }
    };
  }, []);

  const anyStreaming = Object.values(isStreaming).some((s) => s);

  const getVitalStatus = (vital: 'bp' | 'hr' | 'spo2' | 'temp') => {
    if (vital === 'bp') {
      const sys = vitals.bloodPressure.systolic;
      if (sys === 0) return 'inactive';
      if (sys < 90 || sys > 140) return 'danger';
      if (sys < 100 || sys > 130) return 'warning';
      return 'safe';
    }
    if (vital === 'hr') {
      const hr = vitals.heartRate;
      if (hr === 0) return 'inactive';
      if (hr < 60 || hr > 100) return 'danger';
      if (hr < 65 || hr > 95) return 'warning';
      return 'safe';
    }
    if (vital === 'spo2') {
      const spo2 = vitals.spO2;
      if (spo2 === 0) return 'inactive';
      if (spo2 < 90) return 'danger';
      if (spo2 < 95) return 'warning';
      return 'safe';
    }
    if (vital === 'temp') {
      const temp = vitals.temperature;
      if (temp === 0) return 'inactive';
      if (temp < 36 || temp > 38) return 'danger';
      if (temp < 36.5 || temp > 37.5) return 'warning';
      return 'safe';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-1">IoT Device Simulator</h1>
              <p className="text-slate-600 text-sm">Real-time medical device monitoring and AI diagnostics</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-sm font-medium text-slate-700">
                  {isConnected ? 'Cloud Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Selection */}
        <div className="mb-6">
          <PatientSelector
            selectedPatient={selectedPatient}
            onSelectPatient={setSelectedPatient}
            title="Patient Selection"
            description="Select a patient to associate with device readings"
            emptyStateMessage="No patient selected. Device readings will use demo patient ID."
          />
        </div>

        {/* Main Grid Layout: Bento Grid + Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* Left Side: Bento Grid with Indicators */}
          <div className="space-y-6">
            {/* Top Row: Large EKG */}
            <Card className="bg-white border-2 border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="w-5 h-5 text-purple-600" />
                    Electrocardiogram (EKG)
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 capitalize">{vitals.ekg.rhythm} rhythm</span>
                    {isStreaming.ekg && <span className="flex h-2 w-2"><span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-purple-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span></span>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="h-48 bg-slate-900 rounded-lg">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={vitalHistory.ecg}>
                      <defs>
                        <linearGradient id="ecgGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#ecgGradient)"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Second Row: Stethoscope Sound */}
            <Card className="bg-white border-2 border-slate-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Stethoscope className="w-5 h-5 text-cyan-600" />
                    Stethoscope Sound
                  </CardTitle>
                  {isStreaming.stethoscope && <span className="flex h-2 w-2"><span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-cyan-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span></span>}
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="h-32 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={vitalHistory.stethoscope}>
                      <defs>
                        <linearGradient id="stethGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        fill="url(#stethGradient)"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Third Row: Vital Signs Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Blood Pressure */}
              <Card className="border-2 border-slate-200 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Activity className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Blood Pressure</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {vitals.bloodPressure.systolic === 0 ? '--' : vitals.bloodPressure.systolic}
                          <span className="text-xl">/</span>
                          {vitals.bloodPressure.diastolic === 0 ? '--' : vitals.bloodPressure.diastolic}
                        </p>
                        <p className="text-xs text-slate-500">mmHg</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getVitalStatus('bp') === 'safe' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-medium text-green-700">Safe</span>
                        </div>
                      )}
                      {getVitalStatus('bp') === 'warning' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 rounded-full">
                          <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-medium text-yellow-700">Warning</span>
                        </div>
                      )}
                      {getVitalStatus('bp') === 'danger' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-red-100 rounded-full">
                          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-medium text-red-700">Danger</span>
                        </div>
                      )}
                      {isStreaming.bloodPressure && <span className="flex h-2 w-2"><span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></span>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Safe Range</span>
                      <span className="font-medium">90-140 / 60-90</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full transition-all ${
                        getVitalStatus('bp') === 'danger' ? 'bg-red-500' :
                        getVitalStatus('bp') === 'warning' ? 'bg-yellow-500' :
                        getVitalStatus('bp') === 'safe' ? 'bg-green-500' : 'bg-slate-300'
                      }`} style={{ width: vitals.bloodPressure.systolic === 0 ? '0%' : `${Math.min((vitals.bloodPressure.systolic / 140) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                  <div className="h-20 mt-4 bg-gradient-to-b from-blue-50 to-blue-200 rounded-lg">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vitalHistory.bloodPressure}>
                        <YAxis domain={[60, 180]} ticks={[60, 120, 180]} width={30} tick={{ fontSize: 10, fill: '#64748b' }} />
                        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Heart Rate */}
              <Card className="border-2 border-slate-200 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Heart className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Heart Rate</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {vitals.heartRate === 0 ? '--' : vitals.heartRate}
                        </p>
                        <p className="text-xs text-slate-500">bpm</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getVitalStatus('hr') === 'safe' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-medium text-green-700">Safe</span>
                        </div>
                      )}
                      {getVitalStatus('hr') === 'warning' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 rounded-full">
                          <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-medium text-yellow-700">Warning</span>
                        </div>
                      )}
                      {getVitalStatus('hr') === 'danger' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-red-100 rounded-full">
                          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-medium text-red-700">Danger</span>
                        </div>
                      )}
                      {isStreaming.heartRate && <span className="flex h-2 w-2"><span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Safe Range</span>
                      <span className="font-medium">60-100 bpm</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full transition-all ${
                        getVitalStatus('hr') === 'danger' ? 'bg-red-500' :
                        getVitalStatus('hr') === 'warning' ? 'bg-yellow-500' :
                        getVitalStatus('hr') === 'safe' ? 'bg-green-500' : 'bg-slate-300'
                      }`} style={{ width: vitals.heartRate === 0 ? '0%' : `${Math.min((vitals.heartRate / 100) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                  <div className="h-20 mt-4 bg-gradient-to-b from-red-50 to-red-200 rounded-lg">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vitalHistory.heartRate}>
                        <YAxis domain={[40, 120]} ticks={[40, 80, 120]} width={30} tick={{ fontSize: 10, fill: '#64748b' }} />
                        <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* SpO2 */}
              <Card className="border-2 border-slate-200 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Droplet className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Oxygen Saturation</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {vitals.spO2 === 0 ? '--' : vitals.spO2}
                        </p>
                        <p className="text-xs text-slate-500">% SpO₂</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getVitalStatus('spo2') === 'safe' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-medium text-green-700">Safe</span>
                        </div>
                      )}
                      {getVitalStatus('spo2') === 'warning' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 rounded-full">
                          <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-medium text-yellow-700">Warning</span>
                        </div>
                      )}
                      {getVitalStatus('spo2') === 'danger' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-red-100 rounded-full">
                          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-medium text-red-700">Danger</span>
                        </div>
                      )}
                      {isStreaming.spO2 && <span className="flex h-2 w-2"><span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Safe Range</span>
                      <span className="font-medium">95-100%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full transition-all ${
                        getVitalStatus('spo2') === 'danger' ? 'bg-red-500' :
                        getVitalStatus('spo2') === 'warning' ? 'bg-yellow-500' :
                        getVitalStatus('spo2') === 'safe' ? 'bg-green-500' : 'bg-slate-300'
                      }`} style={{ width: vitals.spO2 === 0 ? '0%' : `${vitals.spO2}%` }}></div>
                    </div>
                  </div>
                  <div className="h-20 mt-4 bg-gradient-to-b from-green-50 to-green-200 rounded-lg">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vitalHistory.spO2}>
                        <YAxis domain={[85, 100]} ticks={[85, 92, 100]} width={30} tick={{ fontSize: 10, fill: '#64748b' }} />
                        <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Temperature */}
              <Card className="border-2 border-slate-200 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Thermometer className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">Temperature</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {vitals.temperature === 0 ? '--.-' : vitals.temperature.toFixed(1)}
                        </p>
                        <p className="text-xs text-slate-500">°C</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getVitalStatus('temp') === 'safe' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-medium text-green-700">Safe</span>
                        </div>
                      )}
                      {getVitalStatus('temp') === 'warning' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 rounded-full">
                          <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-medium text-yellow-700">Warning</span>
                        </div>
                      )}
                      {getVitalStatus('temp') === 'danger' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-red-100 rounded-full">
                          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-medium text-red-700">Danger</span>
                        </div>
                      )}
                      {isStreaming.temperature && <span className="flex h-2 w-2"><span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-orange-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span></span>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Safe Range</span>
                      <span className="font-medium">36.5-37.5°C</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full transition-all ${
                        getVitalStatus('temp') === 'danger' ? 'bg-red-500' :
                        getVitalStatus('temp') === 'warning' ? 'bg-yellow-500' :
                        getVitalStatus('temp') === 'safe' ? 'bg-green-500' : 'bg-slate-300'
                      }`} style={{ width: vitals.temperature === 0 ? '0%' : `${Math.min(((vitals.temperature - 35) / 3) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                  <div className="h-20 mt-4 bg-gradient-to-b from-orange-50 to-orange-200 rounded-lg">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vitalHistory.temperature}>
                        <YAxis domain={[35, 40]} ticks={[35, 37.5, 40]} width={30} tick={{ fontSize: 10, fill: '#64748b' }} />
                        <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Side: Control Panel */}
          <div className="space-y-6">
            <Card className="bg-white border-2 border-primary">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wifi className="w-5 h-5" />
                  Control Panel
                </CardTitle>
                <CardDescription>Manage device streaming and analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stream Interval */}
                <div>
                  <label className="text-sm font-medium text-slate-700">Stream Interval (ms)</label>
                  <Input
                    type="number"
                    value={streamInterval}
                    onChange={(e) => setStreamInterval(Number(e.target.value))}
                    min="500"
                    max="10000"
                    step="500"
                    disabled={anyStreaming}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Data sent every {streamInterval / 1000} seconds
                  </p>
                </div>

                {/* Generate Random */}
                <Button 
                  onClick={handleGenerateRandomVitals} 
                  variant="outline" 
                  className="w-full" 
                  disabled={!selectedPatient || anyStreaming || isCollectingVitals}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Generate Random
                </Button>

                {/* Individual Indicator Controls */}
                <div className="space-y-3 border-t pt-4">
                  <p className="text-sm font-medium text-slate-700">Individual Indicators</p>
                  
                  {/* ECG Control */}
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-slate-900">ECG</span>
                    </div>
                    {!isStreaming.ekg ? (
                      <Button
                        size="sm"
                        onClick={() => startVitalStreaming('ekg')}
                        disabled={!selectedPatient || !isConnected}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => stopVitalStreaming('ekg')}
                      >
                        <Pause className="w-3 h-3 mr-1" />
                        Stop
                      </Button>
                    )}
                  </div>

                  {/* Stethoscope Control */}
                  <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-cyan-600" />
                      <span className="text-sm font-medium text-slate-900">Stethoscope</span>
                    </div>
                    {!isStreaming.stethoscope ? (
                      <Button
                        size="sm"
                        onClick={() => startVitalStreaming('stethoscope')}
                        disabled={!selectedPatient || !isConnected}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => stopVitalStreaming('stethoscope')}
                      >
                        <Pause className="w-3 h-3 mr-1" />
                        Stop
                      </Button>
                    )}
                  </div>

                  {/* Blood Pressure Control */}
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-slate-900">Blood Pressure</span>
                    </div>
                    {!isStreaming.bloodPressure ? (
                      <Button
                        size="sm"
                        onClick={() => startVitalStreaming('bloodPressure')}
                        disabled={!selectedPatient || !isConnected}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => stopVitalStreaming('bloodPressure')}
                      >
                        <Pause className="w-3 h-3 mr-1" />
                        Stop
                      </Button>
                    )}
                  </div>

                  {/* Heart Rate Control */}
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-slate-900">Heart Rate</span>
                    </div>
                    {!isStreaming.heartRate ? (
                      <Button
                        size="sm"
                        onClick={() => startVitalStreaming('heartRate')}
                        disabled={!selectedPatient || !isConnected}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => stopVitalStreaming('heartRate')}
                      >
                        <Pause className="w-3 h-3 mr-1" />
                        Stop
                      </Button>
                    )}
                  </div>

                  {/* SpO2 Control */}
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-slate-900">SpO₂</span>
                    </div>
                    {!isStreaming.spO2 ? (
                      <Button
                        size="sm"
                        onClick={() => startVitalStreaming('spO2')}
                        disabled={!selectedPatient || !isConnected}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => stopVitalStreaming('spO2')}
                      >
                        <Pause className="w-3 h-3 mr-1" />
                        Stop
                      </Button>
                    )}
                  </div>

                  {/* Temperature Control */}
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-slate-900">Temperature</span>
                    </div>
                    {!isStreaming.temperature ? (
                      <Button
                        size="sm"
                        onClick={() => startVitalStreaming('temperature')}
                        disabled={!selectedPatient || !isConnected}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => stopVitalStreaming('temperature')}
                      >
                        <Pause className="w-3 h-3 mr-1" />
                        Stop
                      </Button>
                    )}
                  </div>
                </div>

                {/* Comprehensive Analysis */}
                <div className="border-t pt-4 space-y-3">
                  <Button
                    onClick={startComprehensiveAnalysis}
                    disabled={!selectedPatient || !isConnected || isSending || anyStreaming || isCollectingVitals}
                    className="w-full"
                  >
                    {isCollectingVitals ? `Collecting... ${collectedReadings}/${totalReadingsNeeded}` : 'Start Comprehensive Analysis'}
                  </Button>
                  {result && (
                    <Button
                      onClick={() => setShowSummaryModal(true)}
                      variant="outline"
                      className="w-full"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Open Summary Report
                    </Button>
                  )}
                  {!selectedPatient && (
                    <p className="text-xs text-red-600 text-center"> Please select a patient first</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

            {/* Old cards section removed - functionality moved to control panel */}
            <div className="hidden">
              {/* Blood Pressure */}
              <Card className="border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <Activity className="w-6 h-6 text-blue-600" />
                      <div>
                        <div className="font-medium text-blue-900">Blood Pressure</div>
                        <div className="text-2xl font-bold text-blue-900">
                          {vitals.bloodPressure.systolic === 0 ? '--/--' : `${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}`} <span className="text-xs font-normal text-blue-600">mmHg</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={vitalHistory.bloodPressure}>
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {!isStreaming.bloodPressure ? (
                      <Button
                        size="sm"
                        onClick={() => startVitalStreaming('bloodPressure')}
                        disabled={!selectedPatient || !isConnected}
                        className="ml-4"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => stopVitalStreaming('bloodPressure')}
                        className="ml-4"
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Stop
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Heart Rate */}
              <Card className="border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <Heart className="w-6 h-6 text-red-600" />
                      <div>
                        <div className="font-medium text-red-900">Heart Rate</div>
                        <div className="text-2xl font-bold text-red-900">
                          {vitals.heartRate === 0 ? '--' : vitals.heartRate} <span className="text-xs font-normal text-red-600">bpm</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={vitalHistory.heartRate}>
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#ef4444"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {!isStreaming.heartRate ? (
                      <Button
                        size="sm"
                        onClick={() => startVitalStreaming('heartRate')}
                        disabled={!selectedPatient || !isConnected}
                        className="ml-4"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => stopVitalStreaming('heartRate')}
                        className="ml-4"
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Stop
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* SpO2 */}
              <Card className="border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <Droplet className="w-6 h-6 text-green-600" />
                      <div>
                        <div className="font-medium text-green-900">SpO2</div>
                        <div className="text-2xl font-bold text-green-900">
                          {vitals.spO2 === 0 ? '--' : vitals.spO2}% <span className="text-xs font-normal text-green-600">O₂</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={vitalHistory.spO2}>
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {!isStreaming.spO2 ? (
                      <Button
                        size="sm"
                        onClick={() => startVitalStreaming('spO2')}
                        disabled={!selectedPatient || !isConnected}
                        className="ml-4"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => stopVitalStreaming('spO2')}
                        className="ml-4"
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Stop
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Temperature */}
              <Card className="border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <Thermometer className="w-6 h-6 text-orange-600" />
                      <div>
                        <div className="font-medium text-orange-900">Temperature</div>
                        <div className="text-2xl font-bold text-orange-900">
                          {vitals.temperature === 0 ? '--.-' : vitals.temperature}°C
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={vitalHistory.temperature}>
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#f97316"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {!isStreaming.temperature ? (
                      <Button
                        size="sm"
                        onClick={() => startVitalStreaming('temperature')}
                        disabled={!selectedPatient || !isConnected}
                        className="ml-4"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => stopVitalStreaming('temperature')}
                        className="ml-4"
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Stop
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* EKG */}
              <Card className="border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <Zap className="w-6 h-6 text-purple-600" />
                      <div>
                        <div className="font-medium text-purple-900">EKG Rhythm</div>
                        <div className="text-2xl font-bold text-purple-900">
                          {vitals.ekg.rhythm}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 h-24 bg-gray-900 rounded">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={vitalHistory.ecg}>
                          <defs>
                            <linearGradient id="ecgGradientSmall" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#10b981"
                            strokeWidth={2}
                            fill="url(#ecgGradientSmall)"
                            isAnimationActive={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {!isStreaming.ekg ? (
                      <Button
                        size="sm"
                        onClick={() => startVitalStreaming('ekg')}
                        disabled={!selectedPatient || !isConnected}
                        className="ml-4"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => stopVitalStreaming('ekg')}
                        className="ml-4"
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Stop
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
      </div>

      {/* Comprehensive Summary Modal - Shows only after comprehensive analysis completes */}
      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-primary">Comprehensive Medical Summary</DialogTitle>
                <DialogDescription>
                  {result && `Generated: ${new Date(result.processedAt).toLocaleString()}`}
                </DialogDescription>
              </div>
              <Button onClick={downloadPDF} variant="outline" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </Button>
            </div>
          </DialogHeader>

          {result && (
            <div className="p-6 space-y-6 overflow-y-auto dialog-scroll" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                {/* Patient Information */}
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h3 className="font-semibold text-lg mb-3 text-gray-900">Patient Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                      <p className="text-xs text-gray-600">Name</p>
                      <p className="font-medium">{selectedPatient?.name || 'Demo Patient'}</p>
                    </div>
                    <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                      <p className="text-xs text-gray-600">Patient ID</p>
                      <p className="font-medium">{selectedPatient?.patientId || 'demo-patient'}</p>
                    </div>
                    <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                      <p className="text-xs text-gray-600">Gender</p>
                      <p className="font-medium">{selectedPatient?.gender || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                      <p className="text-xs text-gray-600">Blood Type</p>
                      <p className="font-medium">{selectedPatient?.bloodType || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Overall Assessment */}
                <div className={`rounded-lg p-5 border-2 ${
                  result.overallRisk === 'critical' ? 'bg-red-50 border-red-500' :
                  result.overallRisk === 'high' ? 'bg-orange-50 border-orange-500' :
                  result.overallRisk === 'moderate' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-green-50 border-green-500'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg text-gray-900">Overall Assessment</h3>
                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                      result.overallRisk === 'critical' ? 'bg-red-600 text-white' :
                      result.overallRisk === 'high' ? 'bg-orange-600 text-white' :
                      result.overallRisk === 'moderate' ? 'bg-yellow-600 text-white' :
                      'bg-green-600 text-white'
                    }`}>
                      {result.overallRisk.toUpperCase()} RISK
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{result.summary}</p>
                </div>

                {/* Vital Signs */}
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="font-semibold text-lg mb-3 text-gray-900">📊 Vital Signs Readings</h3>
                  <div className="space-y-2">
                    {result.analysis.bloodPressure && (
                      <div className={`p-3 rounded-lg text-sm ${getStatusColor(result.analysis.bloodPressure.status)}`}>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Blood Pressure</span>
                          <span className="font-mono">{vitals.bloodPressure.systolic}/{vitals.bloodPressure.diastolic} mmHg</span>
                        </div>
                        <p className="text-xs mt-1 opacity-90">{result.analysis.bloodPressure.message}</p>
                      </div>
                    )}
                    {result.analysis.heartRate && (
                      <div className={`p-3 rounded-lg text-sm ${getStatusColor(result.analysis.heartRate.status)}`}>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Heart Rate</span>
                          <span className="font-mono">{vitals.heartRate} bpm</span>
                        </div>
                        <p className="text-xs mt-1 opacity-90">{result.analysis.heartRate.message}</p>
                      </div>
                    )}
                    {result.analysis.spO2 && (
                      <div className={`p-3 rounded-lg text-sm ${getStatusColor(result.analysis.spO2.status)}`}>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Oxygen Saturation</span>
                          <span className="font-mono">{vitals.spO2}%</span>
                        </div>
                        <p className="text-xs mt-1 opacity-90">{result.analysis.spO2.message}</p>
                      </div>
                    )}
                    {result.analysis.temperature && (
                      <div className={`p-3 rounded-lg text-sm ${getStatusColor(result.analysis.temperature.status)}`}>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Temperature</span>
                          <span className="font-mono">{vitals.temperature}°C</span>
                        </div>
                        <p className="text-xs mt-1 opacity-90">{result.analysis.temperature.message}</p>
                      </div>
                    )}
                    {result.analysis.ekg && (
                      <div className={`p-3 rounded-lg text-sm ${getStatusColor(result.analysis.ekg.status)}`}>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">EKG Rhythm</span>
                          <span className="font-mono capitalize">{vitals.ekg.rhythm}</span>
                        </div>
                        <p className="text-xs mt-1 opacity-90">{result.analysis.ekg.message}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Disease Indicators */}
                {result.diseaseIndicators && result.diseaseIndicators.length > 0 && (
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="font-semibold text-lg mb-3 text-gray-900">🔍 Disease Indicators</h3>
                    <div className="space-y-3">
                      {result.diseaseIndicators.map((indicator, idx) => (
                        <div key={idx} className={`p-4 border-l-4 rounded ${
                          indicator.likelihood === 'critical' ? 'border-red-600 bg-red-50' :
                          indicator.likelihood === 'high' ? 'border-orange-600 bg-orange-50' :
                          indicator.likelihood === 'moderate' ? 'border-yellow-600 bg-yellow-50' :
                          'border-blue-600 bg-blue-50'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm">{indicator.condition}</span>
                            <span className={`text-xs px-2 py-1 rounded font-medium ${
                              indicator.likelihood === 'critical' ? 'bg-red-600 text-white' :
                              indicator.likelihood === 'high' ? 'bg-orange-600 text-white' :
                              indicator.likelihood === 'moderate' ? 'bg-yellow-600 text-white' :
                              'bg-blue-600 text-white'
                            }`}>
                              {indicator.likelihood}
                            </span>
                          </div>
                          <ul className="text-xs space-y-1">
                            {indicator.indicators.map((ind, i) => (
                              <li key={i}>• {ind}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prescriptions */}
                {result.prescriptions && result.prescriptions.length > 0 && (
                  <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                    <h3 className="font-semibold text-lg mb-3 text-gray-900">💊 Recommended Medications</h3>
                    <div className="space-y-3">
                      {result.prescriptions.map((med, idx) => (
                        <div key={idx} className="p-4 bg-white border rounded-lg">
                          <h4 className="font-semibold text-blue-900 mb-2">{med.name}</h4>
                          <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                            <div><span className="text-gray-600">Dosage:</span> <span className="font-medium">{med.dosage}</span></div>
                            <div><span className="text-gray-600">Frequency:</span> <span className="font-medium">{med.frequency}</span></div>
                            <div><span className="text-gray-600">Duration:</span> <span className="font-medium">{med.duration}</span></div>
                          </div>
                          <p className="text-xs text-gray-700"><span className="font-medium">Instructions:</span> {med.instructions}</p>
                        </div>
                      ))}
                      <p className="text-xs text-gray-600 italic">⚠️ Note: These are automated recommendations. Consult with a licensed physician before taking any medication.</p>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {result.recommendations && result.recommendations.length > 0 && (
                  <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
                    <h3 className="font-semibold text-lg mb-3 text-gray-900">📋 Medical Recommendations</h3>
                    <div className="space-y-3">
                      {result.recommendations.map((rec, idx) => (
                        <div key={idx} className={`p-4 border-l-4 rounded bg-white ${
                          rec.urgency === 'immediate' ? 'border-red-600' :
                          rec.urgency === 'urgent' ? 'border-orange-600' :
                          'border-blue-600'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-1 rounded font-medium ${
                              rec.urgency === 'immediate' ? 'bg-red-600 text-white' :
                              rec.urgency === 'urgent' ? 'bg-orange-600 text-white' :
                              'bg-blue-600 text-white'
                            }`}>
                              {rec.urgency.toUpperCase()}
                            </span>
                            <span className="text-xs font-medium text-gray-600">
                              {rec.type === 'teleconsultation' ? '📞 Teleconsultation' :
                               rec.type === 'hospital_referral' ? '🏥 Hospital Referral' :
                               rec.type === 'follow_up' ? '📅 Follow-up' :
                               '💡 Lifestyle'}
                            </span>
                          </div>
                          <p className="text-sm">{rec.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          <div className="bg-gray-50 border-t p-4 flex justify-end gap-3">
            <Button onClick={() => setShowSummaryModal(false)} variant="outline">
              Close
            </Button>
            <Button onClick={downloadPDF} className="bg-blue-600 hover:bg-blue-700">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
