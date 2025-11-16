'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, FileText, Download, Search, AlertCircle, Loader2, RefreshCcw, RefreshCcwIcon } from 'lucide-react';

interface Patient {
  _id: string;
  patientId: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  bloodType: string;
  allergies: string[];
  medicalHistory: string[];
  currentMedications: string[];
  address?: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view patients');
        setLoading(false);
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
      setError(error instanceof Error ? error.message : 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportFHIR = (patient: Patient) => {
    const fhirPatient = {
      resourceType: 'Patient',
      id: patient._id,
      identifier: [
        {
          system: 'http://djaja-diagnostics.com/patient-id',
          value: patient.patientId,
        },
      ],
      name: [
        {
          use: 'official',
          text: patient.name,
        },
      ],
      gender: patient.gender,
      birthDate: patient.dateOfBirth,
      telecom: [
        {
          system: 'phone',
          value: patient.phoneNumber,
        },
      ],
    };

    const dataStr = JSON.stringify(fhirPatient, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `patient-${patient.patientId}-fhir.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Electronic Medical Records</h1>
            <p className="text-muted-foreground">Patient demographics and medical history management</p>
          </div>
          <Button onClick={fetchPatients} variant="outline" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Refresh
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">{error}</p>
              <Button 
                onClick={fetchPatients} 
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading patients...</span>
          </div>
        )}

        {!loading && !error && (
          <div className="grid lg:grid-cols-3 gap-8">
          {/* Patient List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Patients ({patients.length})
                </CardTitle>
                <CardDescription>Search and select patient</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredPatients.map((patient) => (
                    <div
                      key={patient._id}
                      onClick={() => setSelectedPatient(patient)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPatient?._id === patient._id
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="font-medium">{patient.name}</div>
                      <div className="text-sm text-muted-foreground">{patient.patientId}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {patient.gender} • {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} years
                      </div>
                    </div>
                  ))}
                </div>

                {filteredPatients.length === 0 && !loading && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No patients found matching your search' : 'No patients registered yet'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Patient Details */}
          <div className="lg:col-span-2">
            {selectedPatient ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Patient Demographics
                        </CardTitle>
                        <CardDescription>{selectedPatient.patientId}</CardDescription>
                      </div>
                      <Button onClick={() => exportFHIR(selectedPatient)} size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export FHIR
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                        <div className="text-lg font-medium">{selectedPatient.name}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Patient ID</label>
                        <div className="text-lg font-medium">{selectedPatient.patientId}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                        <div className="text-lg font-medium">
                          {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Gender</label>
                        <div className="text-lg font-medium capitalize">{selectedPatient.gender}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                        <div className="text-lg font-medium">{selectedPatient.phoneNumber}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Blood Type</label>
                        <div className="text-lg font-medium">{selectedPatient.bloodType}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Medical History</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Allergies</label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedPatient.allergies.length > 0 ? (
                          selectedPatient.allergies.map((allergy, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                            >
                              {allergy}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground">No known allergies</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Medical History</label>
                      <div className="mt-2 space-y-2">
                        {selectedPatient.medicalHistory.length > 0 ? (
                          selectedPatient.medicalHistory.map((condition, index) => (
                            <div key={index} className="p-3 bg-muted rounded-lg">
                              • {condition}
                            </div>
                          ))
                        ) : (
                          <span className="text-muted-foreground">No recorded medical history</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Current Medications</label>
                      <div className="mt-2 space-y-2">
                        {selectedPatient.currentMedications.length > 0 ? (
                          selectedPatient.currentMedications.map((medication, index) => (
                            <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              {medication}
                            </div>
                          ))
                        ) : (
                          <span className="text-muted-foreground">No current medications</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Test Results</CardTitle>
                    <CardDescription>Last 5 diagnostic observations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { date: '2025-11-15', type: 'Blood Pressure', result: '125/82 mmHg', status: 'normal' },
                        { date: '2025-11-10', type: 'Glucose', result: '105 mg/dL', status: 'caution' },
                        { date: '2025-11-05', type: 'Heart Rate', result: '78 bpm', status: 'normal' },
                      ].map((test, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{test.type}</div>
                            <div className="text-sm text-muted-foreground">{test.date}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{test.result}</div>
                            <div
                              className={`text-xs ${
                                test.status === 'normal' ? 'text-green-600' : 'text-orange-600'
                              }`}
                            >
                              {test.status === 'normal' ? '✓ Normal' : '⚠ Caution'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Doctor Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      className="w-full h-32 p-3 border rounded-lg resize-none"
                      placeholder="Add doctor notes here..."
                    />
                    <div className="mt-4 flex gap-2">
                      <Button>Save Notes</Button>
                      <Button variant="outline">Clear</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground">Select a patient to view their medical record</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
