'use client';

import { useState, useEffect, useRef } from 'react';
import { Activity, Heart, Droplet, Stethoscope, Zap, Play, Pause, Wifi, WifiOff, Thermometer, Search, UserPlus, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import io, { Socket } from 'socket.io-client';
import { DiagnosticResult, Patient, StreamingState, VitalHistory, VitalSigns } from './types';
import { generateRandomVitals, generatePartialVitals, addToHistory, generateECGPoint, getStatusColor } from './utils';

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
  });
  const [streamInterval, setStreamInterval] = useState(2000); // ms
  const [vitalHistory, setVitalHistory] = useState<VitalHistory>({
    bloodPressure: [],
    heartRate: [],
    spO2: [],
    temperature: [],
    ecg: [],
  });
  const streamIntervalsRef = useRef<Record<string, NodeJS.Timeout | null>>({
    bloodPressure: null,
    heartRate: null,
    spO2: null,
    temperature: null,
    ekg: null,
  });
  const ecgIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isComprehensiveAnalysisRef = useRef(false);
  
  // Patient state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientList, setShowPatientList] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  
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

  // Fetch patients on mount
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/patients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }

      const data = await response.json();
      setPatients(data.patients || []);
    } catch (error) {
      console.error('Fetch patients error:', error);
    } finally {
      setLoadingPatients(false);
    }
  };

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
          body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #333; padding-bottom: 20px; }
          .risk-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
          .critical { background: #dc2626; color: white; }
          .high { background: #ea580c; color: white; }
          .moderate { background: #ca8a04; color: white; }
          .low { background: #16a34a; color: white; }
          .section { margin: 30px 0; page-break-inside: avoid; }
          .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 8px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
          .info-item { padding: 10px; background: #f9f9f9; border-left: 3px solid #3b82f6; }
          .indicator { margin: 10px 0; padding: 15px; border-left: 4px solid #3b82f6; background: #f0f9ff; }
          .vital { padding: 10px; margin: 8px 0; border-radius: 8px; }
          .normal { background: #f0fdf4; border-left: 4px solid #16a34a; }
          .caution { background: #fefce8; border-left: 4px solid #ca8a04; }
          .warning { background: #fff7ed; border-left: 4px solid #ea580c; }
          .critical-vital { background: #fef2f2; border-left: 4px solid #dc2626; }
          .prescription { margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
          .recommendation { margin: 10px 0; padding: 12px; border-left: 4px solid #8b5cf6; background: #faf5ff; }
          ul { margin: 10px 0; padding-left: 20px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Medical Diagnostic Summary</h1>
          <p><strong>Date:</strong> ${new Date(result.processedAt).toLocaleString()}</p>
        </div>
        
        <div class="section">
          <div class="section-title">Patient Information</div>
          <div class="info-grid">
            <div class="info-item"><strong>Name:</strong> ${selectedPatient?.name || 'Demo Patient'}</div>
            <div class="info-item"><strong>Patient ID:</strong> ${selectedPatient?.patientId || 'demo-patient'}</div>
            <div class="info-item"><strong>Gender:</strong> ${selectedPatient?.gender || 'N/A'}</div>
            <div class="info-item"><strong>Blood Type:</strong> ${selectedPatient?.bloodType || 'N/A'}</div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Overall Assessment</div>
          <p><span class="risk-badge ${result.overallRisk}">${result.overallRisk.toUpperCase()} RISK</span></p>
          <p style="margin-top: 15px;">${result.summary}</p>
        </div>
        
        <div class="section">
          <div class="section-title">Vital Signs Readings</div>
          ${result.analysis.bloodPressure ? `
            <div class="vital ${result.analysis.bloodPressure.status === 'critical' ? 'critical-vital' : result.analysis.bloodPressure.status}">
              <strong>Blood Pressure:</strong> ${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic} mmHg - ${result.analysis.bloodPressure.message}
            </div>
          ` : ''}
          ${result.analysis.heartRate ? `
            <div class="vital ${result.analysis.heartRate.status === 'critical' ? 'critical-vital' : result.analysis.heartRate.status}">
              <strong>Heart Rate:</strong> ${vitals.heartRate} bpm - ${result.analysis.heartRate.message}
            </div>
          ` : ''}
          ${result.analysis.spO2 ? `
            <div class="vital ${result.analysis.spO2.status === 'critical' ? 'critical-vital' : result.analysis.spO2.status}">
              <strong>Oxygen Saturation:</strong> ${vitals.spO2}% - ${result.analysis.spO2.message}
            </div>
          ` : ''}
          ${result.analysis.temperature ? `
            <div class="vital ${result.analysis.temperature.status === 'critical' ? 'critical-vital' : result.analysis.temperature.status}">
              <strong>Temperature:</strong> ${vitals.temperature}°C - ${result.analysis.temperature.message}
            </div>
          ` : ''}
          ${result.analysis.ekg ? `
            <div class="vital ${result.analysis.ekg.status === 'critical' ? 'critical-vital' : result.analysis.ekg.status}">
              <strong>EKG Rhythm:</strong> ${vitals.ekg.rhythm} - ${result.analysis.ekg.message}
            </div>
          ` : ''}
        </div>
        
        ${result.diseaseIndicators && result.diseaseIndicators.length > 0 ? `
          <div class="section">
            <div class="section-title">Disease Indicators</div>
            ${result.diseaseIndicators.map(indicator => `
              <div class="indicator">
                <strong>${indicator.condition}</strong> <span style="background: #3b82f6; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${indicator.likelihood}</span>
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
                <h3 style="margin: 0 0 10px 0; color: #1e40af;">${med.name}</h3>
                <p><strong>Dosage:</strong> ${med.dosage} | <strong>Frequency:</strong> ${med.frequency} | <strong>Duration:</strong> ${med.duration}</p>
                <p><strong>Instructions:</strong> ${med.instructions}</p>
              </div>
            `).join('')}
            <p style="font-style: italic; color: #666; margin-top: 15px;">⚠️ Note: These are automated recommendations. Consult with a licensed physician before taking any medication.</p>
          </div>
        ` : ''}
        
        ${result.recommendations && result.recommendations.length > 0 ? `
          <div class="section">
            <div class="section-title">Medical Recommendations</div>
            ${result.recommendations.map(rec => `
              <div class="recommendation">
                <p><strong style="background: #8b5cf6; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">${rec.urgency.toUpperCase()}</strong> 
                <strong>${rec.type === 'teleconsultation' ? '📞 Teleconsultation' : rec.type === 'hospital_referral' ? '🏥 Hospital Referral' : rec.type === 'follow_up' ? '📅 Follow-up' : '💡 Lifestyle'}</strong></p>
                <p>${rec.message}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #eee; text-align: center; color: #666;">
          <p>This report was generated automatically by Djaja Diagnostics IoT System</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">IoT Device Simulator</h1>
          <p className="text-muted-foreground">
            Simulate medical device readings and see real-time AI analysis
          </p>
          <div className="flex items-center gap-2 mt-4">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm">
              {isConnected ? 'Connected to Cloud' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Patient Selection */}
        <Card className="mb-8 border-2 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Patient Selection
            </CardTitle>
            <CardDescription>
              Select a patient to associate with device readings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-start">
              <div className="flex-1 relative">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients by name or ID..."
                    value={patientSearchTerm}
                    onChange={(e) => {
                      setPatientSearchTerm(e.target.value);
                      setShowPatientList(true);
                    }}
                    onFocus={() => setShowPatientList(true)}
                    className="pl-10"
                  />
                </div>
                
                {/* Patient Dropdown */}
                {showPatientList && patientSearchTerm && (
                  <div className="absolute z-10 w-full mt-2 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {patients
                      .filter((p) =>
                        p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
                        p.patientId.toLowerCase().includes(patientSearchTerm.toLowerCase())
                      )
                      .map((patient) => (
                        <div
                          key={patient._id}
                          onClick={() => {
                            setSelectedPatient(patient);
                            setPatientSearchTerm('');
                            setShowPatientList(false);
                          }}
                          className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        >
                          <div className="font-medium">{patient.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {patient.patientId} • {patient.gender} • {patient.bloodType}
                          </div>
                        </div>
                      ))}
                    {patients.filter((p) =>
                      p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
                      p.patientId.toLowerCase().includes(patientSearchTerm.toLowerCase())
                    ).length === 0 && (
                      <div className="p-4 text-center text-muted-foreground">
                        No patients found
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <Button
                onClick={() => window.open('/patients', '_blank')}
                variant="outline"
                className="flex-shrink-0"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Patient
              </Button>
            </div>

            {/* Selected Patient Display */}
            {selectedPatient ? (
              <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-lg">{selectedPatient.name}</div>
                    <div className="text-sm text-muted-foreground">
                      ID: {selectedPatient.patientId} • {selectedPatient.gender} • Blood Type: {selectedPatient.bloodType}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPatient(null)}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-muted/50 border border-dashed rounded-lg text-center text-muted-foreground">
                No patient selected. Device readings will use demo patient ID.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
            {/* Global Controls */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="w-5 h-5" />
                  Global Settings
                </CardTitle>
                <CardDescription>Configure streaming interval and generate test data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Stream Interval (ms)</label>
                  <Input
                    type="number"
                    value={streamInterval}
                    onChange={(e) => setStreamInterval(Number(e.target.value))}
                    min="500"
                    max="10000"
                    step="500"
                    disabled={anyStreaming}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Data sent every {streamInterval / 1000} seconds
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button onClick={handleGenerateRandomVitals} variant="outline" className="flex-1" disabled={!selectedPatient || anyStreaming || isCollectingVitals}>
                      Generate Random
                    </Button>
                    <Button
                      onClick={() => sendToCloud()}
                      disabled={!selectedPatient || !isConnected || isSending || anyStreaming || isCollectingVitals}
                      className="flex-1"
                    >
                      {isSending ? 'Processing...' : 'Send Single'}
                    </Button>
                  </div>
                  <Button
                    onClick={startComprehensiveAnalysis}
                    disabled={!selectedPatient || !isConnected || isSending || anyStreaming || isCollectingVitals}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isCollectingVitals ? `Collecting Data... ${collectedReadings}/${totalReadingsNeeded}` : '🔍 Start Comprehensive Analysis'}
                  </Button>
                  {!selectedPatient && (
                    <p className="text-xs text-red-600 text-center mt-1">⚠️ Please select a patient first</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Individual Vital Streaming Controls */}
            <div className="space-y-4">
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
        </div>

      {/* Comprehensive Summary Modal - Shows only after comprehensive analysis completes */}
      {showSummaryModal && result && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSummaryModal(false)}>
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Comprehensive Medical Summary</h2>
                  <p className="text-sm text-gray-600">Generated: {new Date(result.processedAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={downloadPDF} variant="outline" size="sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </Button>
                  <Button onClick={() => setShowSummaryModal(false)} variant="ghost" size="sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
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

              <div className="sticky bottom-0 bg-gray-50 border-t p-4 flex justify-end gap-3">
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
            </div>
          </div>
        )}
    </div>
  );
}
