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
import { VitalCard } from '@/components/device-simulator/VitalCard';
import { IndicatorControlPanel } from '@/components/device-simulator/IndicatorControlPanel';
import { StreamingIndicator } from '@/components/device-simulator/StreamingIndicator';
import { generateMinimalistPDF } from '@/lib/pdf-utils';
import { toast } from 'sonner';

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
    if (!result) {
      toast.error('No diagnostic results available', {
        duration: 3000,
      });
      return;
    }

    try {
      toast.loading('Generating PDF...', { id: 'pdf-generation' });

      // Generate and download PDF with complete data matching the modal
      generateMinimalistPDF({
        patient: {
          name: selectedPatient?.name || 'Demo Patient',
          id: selectedPatient?.patientId || 'demo-patient',
          gender: selectedPatient?.gender,
          bloodType: selectedPatient?.bloodType,
        },
        vitals,
        vitalAnalysis: {
          bloodPressure: result.analysis.bloodPressure,
          heartRate: result.analysis.heartRate,
          spO2: result.analysis.spO2,
          temperature: result.analysis.temperature,
          ekg: result.analysis.ekg,
        },
        overallAssessment: {
          risk: result.overallRisk,
          summary: result.summary,
        },
        diseaseIndicators: result.diseaseIndicators,
        prescriptions: result.prescriptions,
        recommendations: result.recommendations,
        timestamp: new Date(result.processedAt),
        facilityName: 'Djaja Diagnostics IoT System',
      });

      toast.success('PDF downloaded successfully!', { 
        id: 'pdf-generation',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF', { 
        id: 'pdf-generation',
        duration: 4000,
      });
    }
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

  const getVitalStatus = (vital: 'bp' | 'hr' | 'spo2' | 'temp'): 'inactive' | 'safe' | 'warning' | 'danger' => {
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
    return 'inactive';
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
              <VitalCard
                icon={Activity}
                iconColor="text-blue-600"
                iconBgColor="bg-blue-100"
                name="Blood Pressure"
                value={`${vitals.bloodPressure.systolic === 0 ? '--' : vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic === 0 ? '--' : vitals.bloodPressure.diastolic}`}
                unit="mmHg"
                status={getVitalStatus('bp')}
                isStreaming={isStreaming.bloodPressure}
                safeRangeText="90-140 / 60-90"
                widthPercentage={vitals.bloodPressure.systolic === 0 ? '0%' : `${Math.min((vitals.bloodPressure.systolic / 140) * 100, 100)}%`}
                historyData={vitalHistory.bloodPressure}
                yDomain={[60, 180]}
                yTicks={[60, 120, 180]}
                gradientFrom="from-blue-50"
                gradientTo="to-blue-200"
                chartColor="#3b82f6"
                streamingColor="bg-blue-400"
              />

              {/* Heart Rate */}
              <VitalCard
                icon={Heart}
                iconColor="text-red-600"
                iconBgColor="bg-red-100"
                name="Heart Rate"
                value={vitals.heartRate === 0 ? '--' : String(vitals.heartRate)}
                unit="bpm"
                status={getVitalStatus('hr')}
                isStreaming={isStreaming.heartRate}
                safeRangeText="60-100 bpm"
                widthPercentage={vitals.heartRate === 0 ? '0%' : `${Math.min((vitals.heartRate / 100) * 100, 100)}%`}
                historyData={vitalHistory.heartRate}
                yDomain={[40, 120]}
                yTicks={[40, 80, 120]}
                gradientFrom="from-red-50"
                gradientTo="to-red-200"
                chartColor="#ef4444"
                streamingColor="bg-red-400"
              />

              {/* SpO2 */}
              <VitalCard
                icon={Droplet}
                iconColor="text-green-600"
                iconBgColor="bg-green-100"
                name="Oxygen Saturation"
                value={vitals.spO2 === 0 ? '--' : String(vitals.spO2)}
                unit="% SpO₂"
                status={getVitalStatus('spo2')}
                isStreaming={isStreaming.spO2}
                safeRangeText="95-100%"
                widthPercentage={vitals.spO2 === 0 ? '0%' : `${vitals.spO2}%`}
                historyData={vitalHistory.spO2}
                yDomain={[85, 100]}
                yTicks={[85, 92, 100]}
                gradientFrom="from-green-50"
                gradientTo="to-green-200"
                chartColor="#10b981"
                streamingColor="bg-green-400"
              />

              {/* Temperature */}
              <VitalCard
                icon={Thermometer}
                iconColor="text-orange-600"
                iconBgColor="bg-orange-100"
                name="Temperature"
                value={vitals.temperature === 0 ? '--.-' : vitals.temperature.toFixed(1)}
                unit="°C"
                status={getVitalStatus('temp')}
                isStreaming={isStreaming.temperature}
                safeRangeText="36.5-37.5°C"
                widthPercentage={vitals.temperature === 0 ? '0%' : `${Math.min(((vitals.temperature - 35) / 3) * 100, 100)}%`}
                historyData={vitalHistory.temperature}
                yDomain={[35, 40]}
                yTicks={[35, 37.5, 40]}
                gradientFrom="from-orange-50"
                gradientTo="to-orange-200"
                chartColor="#f97316"
                streamingColor="bg-orange-400"
              />
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
                  
                  <IndicatorControlPanel
                    icon={Zap}
                    iconColor="text-purple-600"
                    name="ECG"
                    bgColor="bg-purple-50"
                    borderColor="border-purple-200"
                    isStreaming={isStreaming.ekg}
                    isDisabled={!selectedPatient || !isConnected}
                    onStart={() => startVitalStreaming('ekg')}
                    onStop={() => stopVitalStreaming('ekg')}
                  />

                  <IndicatorControlPanel
                    icon={Stethoscope}
                    iconColor="text-cyan-600"
                    name="Stethoscope"
                    bgColor="bg-cyan-50"
                    borderColor="border-cyan-200"
                    isStreaming={isStreaming.stethoscope}
                    isDisabled={!selectedPatient || !isConnected}
                    onStart={() => startVitalStreaming('stethoscope')}
                    onStop={() => stopVitalStreaming('stethoscope')}
                  />

                  <IndicatorControlPanel
                    icon={Activity}
                    iconColor="text-blue-600"
                    name="Blood Pressure"
                    bgColor="bg-blue-50"
                    borderColor="border-blue-200"
                    isStreaming={isStreaming.bloodPressure}
                    isDisabled={!selectedPatient || !isConnected}
                    onStart={() => startVitalStreaming('bloodPressure')}
                    onStop={() => stopVitalStreaming('bloodPressure')}
                  />

                  <IndicatorControlPanel
                    icon={Heart}
                    iconColor="text-red-600"
                    name="Heart Rate"
                    bgColor="bg-red-50"
                    borderColor="border-red-200"
                    isStreaming={isStreaming.heartRate}
                    isDisabled={!selectedPatient || !isConnected}
                    onStart={() => startVitalStreaming('heartRate')}
                    onStop={() => stopVitalStreaming('heartRate')}
                  />

                  <IndicatorControlPanel
                    icon={Droplet}
                    iconColor="text-green-600"
                    name="SpO₂"
                    bgColor="bg-green-50"
                    borderColor="border-green-200"
                    isStreaming={isStreaming.spO2}
                    isDisabled={!selectedPatient || !isConnected}
                    onStart={() => startVitalStreaming('spO2')}
                    onStop={() => stopVitalStreaming('spO2')}
                  />

                  <IndicatorControlPanel
                    icon={Thermometer}
                    iconColor="text-orange-600"
                    name="Temperature"
                    bgColor="bg-orange-50"
                    borderColor="border-orange-200"
                    isStreaming={isStreaming.temperature}
                    isDisabled={!selectedPatient || !isConnected}
                    onStart={() => startVitalStreaming('temperature')}
                    onStop={() => stopVitalStreaming('temperature')}
                  />
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
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-white">
            <div className="text-center">
              <DialogTitle className="text-2xl font-bold text-gray-900">Patient Diagnostic Report</DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-1">
                Djaja Diagnostics IoT System
              </DialogDescription>
              {result && (
                <p className="text-xs text-gray-400 mt-1">
                  Generated: {new Date(result.processedAt).toLocaleString()}
                </p>
              )}
            </div>
          </DialogHeader>

          {result && (
            <div className="p-8 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                {/* Patient Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Patient Information</h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div className="flex">
                      <span className="text-gray-500 w-24">Name:</span>
                      <span className="font-medium text-gray-900">{selectedPatient?.name || 'Demo Patient'}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-24">Patient ID:</span>
                      <span className="font-medium text-gray-900">{selectedPatient?.patientId || 'demo-patient'}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-24">Gender:</span>
                      <span className="font-medium text-gray-900">{selectedPatient?.gender || 'N/A'}</span>
                    </div>
                    <div className="flex">
                      <span className="text-gray-500 w-24">Blood Type:</span>
                      <span className="font-medium text-gray-900">{selectedPatient?.bloodType || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Vital Signs */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Vital Signs</h3>
                  <div className="space-y-2">
                    {result.analysis.bloodPressure && (
                      <div className="flex justify-between items-start text-sm py-2 border-b border-gray-100">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">Blood Pressure</div>
                          <div className="text-xs text-gray-500 mt-0.5">{result.analysis.bloodPressure.message}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-medium text-gray-900">{vitals.bloodPressure.systolic}/{vitals.bloodPressure.diastolic} mmHg</div>
                          <div className={`text-xs mt-0.5 ${
                            result.analysis.bloodPressure.status === 'critical' ? 'text-red-600' :
                            result.analysis.bloodPressure.status === 'warning' ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            {result.analysis.bloodPressure.status === 'critical' ? 'Abnormal' :
                             result.analysis.bloodPressure.status === 'warning' ? 'Warning' : 'Normal'}
                          </div>
                        </div>
                      </div>
                    )}
                    {result.analysis.heartRate && (
                      <div className="flex justify-between items-start text-sm py-2 border-b border-gray-100">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">Heart Rate</div>
                          <div className="text-xs text-gray-500 mt-0.5">{result.analysis.heartRate.message}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-medium text-gray-900">{vitals.heartRate} bpm</div>
                          <div className={`text-xs mt-0.5 ${
                            result.analysis.heartRate.status === 'critical' ? 'text-red-600' :
                            result.analysis.heartRate.status === 'warning' ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            {result.analysis.heartRate.status === 'critical' ? 'Abnormal' :
                             result.analysis.heartRate.status === 'warning' ? 'Warning' : 'Normal'}
                          </div>
                        </div>
                      </div>
                    )}
                    {result.analysis.spO2 && (
                      <div className="flex justify-between items-start text-sm py-2 border-b border-gray-100">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">Oxygen Saturation (SpO2)</div>
                          <div className="text-xs text-gray-500 mt-0.5">{result.analysis.spO2.message}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-medium text-gray-900">{vitals.spO2}%</div>
                          <div className={`text-xs mt-0.5 ${
                            result.analysis.spO2.status === 'critical' ? 'text-red-600' :
                            result.analysis.spO2.status === 'warning' ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            {result.analysis.spO2.status === 'critical' ? 'Abnormal' :
                             result.analysis.spO2.status === 'warning' ? 'Warning' : 'Normal'}
                          </div>
                        </div>
                      </div>
                    )}
                    {result.analysis.temperature && (
                      <div className="flex justify-between items-start text-sm py-2 border-b border-gray-100">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">Temperature</div>
                          <div className="text-xs text-gray-500 mt-0.5">{result.analysis.temperature.message}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-medium text-gray-900">{vitals.temperature}°C</div>
                          <div className={`text-xs mt-0.5 ${
                            result.analysis.temperature.status === 'critical' ? 'text-red-600' :
                            result.analysis.temperature.status === 'warning' ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            {result.analysis.temperature.status === 'critical' ? 'Abnormal' :
                             result.analysis.temperature.status === 'warning' ? 'Warning' : 'Normal'}
                          </div>
                        </div>
                      </div>
                    )}
                    {result.analysis.ekg && (
                      <div className="flex justify-between items-start text-sm py-2">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">EKG Rhythm</div>
                          <div className="text-xs text-gray-500 mt-0.5">{result.analysis.ekg.message}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-medium text-gray-900 capitalize">{vitals.ekg.rhythm}</div>
                          <div className={`text-xs mt-0.5 ${
                            result.analysis.ekg.status === 'critical' ? 'text-red-600' :
                            result.analysis.ekg.status === 'warning' ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            {result.analysis.ekg.status === 'critical' ? 'Abnormal' :
                             result.analysis.ekg.status === 'warning' ? 'Warning' : 'Normal'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Overall Assessment */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Overall Assessment</h3>
                  <div className="text-sm">
                    <div className="mb-2">
                      <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                        result.overallRisk === 'critical' ? 'bg-red-100 text-red-800' :
                        result.overallRisk === 'high' ? 'bg-orange-100 text-orange-800' :
                        result.overallRisk === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {result.overallRisk.toUpperCase()} RISK
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{result.summary}</p>
                  </div>
                </div>

                {/* Disease Indicators */}
                {result.diseaseIndicators && result.diseaseIndicators.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Disease Indicators</h3>
                    <div className="space-y-3">
                      {result.diseaseIndicators.map((indicator, idx) => (
                        <div key={idx} className="text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900">{indicator.condition}</span>
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                              indicator.likelihood === 'critical' ? 'bg-red-100 text-red-800' :
                              indicator.likelihood === 'high' ? 'bg-orange-100 text-orange-800' :
                              indicator.likelihood === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {indicator.likelihood.toUpperCase()}
                            </span>
                          </div>
                          <ul className="text-xs text-gray-600 space-y-0.5 ml-4">
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
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Recommended Medications</h3>
                    <div className="space-y-3">
                      {result.prescriptions.map((med, idx) => (
                        <div key={idx} className="text-sm border-l-2 border-blue-400 pl-3">
                          <h4 className="font-semibold text-gray-900 mb-1">{med.name}</h4>
                          <div className="grid grid-cols-3 gap-4 mb-1 text-xs text-gray-600">
                            <div><span className="font-medium">Dosage:</span> {med.dosage}</div>
                            <div><span className="font-medium">Frequency:</span> {med.frequency}</div>
                            <div><span className="font-medium">Duration:</span> {med.duration}</div>
                          </div>
                          <p className="text-xs text-gray-600">{med.instructions}</p>
                        </div>
                      ))}
                      <p className="text-xs text-gray-500 italic mt-2">⚠️ Note: Consult with a licensed physician before taking any medication.</p>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {result.recommendations && result.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Medical Recommendations</h3>
                    <div className="space-y-2">
                      {result.recommendations.map((rec, idx) => (
                        <div key={idx} className="text-sm border-l-2 border-gray-300 pl-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                              rec.urgency === 'immediate' ? 'bg-red-100 text-red-800' :
                              rec.urgency === 'urgent' ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {rec.urgency.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-600">
                              {rec.type === 'teleconsultation' ? 'Teleconsultation' :
                               rec.type === 'hospital_referral' ? 'Hospital Referral' :
                               rec.type === 'follow_up' ? 'Follow-up' : 'Lifestyle'}
                            </span>
                          </div>
                          <p className="text-gray-700">{rec.message}</p>
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
