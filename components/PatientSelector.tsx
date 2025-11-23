'use client';

import { useState, useEffect } from 'react';
import { User, Search, UserPlus, CheckCircle2, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface Patient {
  _id: string;
  patientId: string;
  name: string;
  dateOfBirth?: string;
  gender: string;
  phoneNumber?: string;
  bloodType?: string;
  contactNumber?: string;
}

interface PatientSelectorProps {
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient | null) => void;
  title?: string;
  description?: string;
  emptyStateMessage?: string;
}

export default function PatientSelector({
  selectedPatient,
  onSelectPatient,
  title = 'Patient Selection',
  description = 'Select a patient to associate with this session',
  emptyStateMessage = 'No patient selected',
}: PatientSelectorProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [showPatientList, setShowPatientList] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);

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

  const filteredPatients = patientSearchTerm
    ? patients.filter(
        (p) =>
          p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) ||
          p.patientId.toLowerCase().includes(patientSearchTerm.toLowerCase())
      )
    : patients.slice(0, 5); // Show top 5 when not searching

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
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
                onBlur={() => {
                  // Delay to allow click events on dropdown items
                  setTimeout(() => setShowPatientList(false), 200);
                }}
                className="pl-10"
              />
            </div>

            {/* Patient Dropdown */}
            {showPatientList && (
              <div className="absolute z-10 w-full mt-2 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {loadingPatients ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Loading patients...
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No patients found
                  </div>
                ) : (
                  <>
                    {!patientSearchTerm && (
                      <div className="px-3 py-2 bg-muted/50 text-xs text-muted-foreground border-b">
                        Showing {filteredPatients.length} recent patients
                      </div>
                    )}
                    {filteredPatients.map((patient) => (
                      <div
                        key={patient._id}
                        onClick={() => {
                          onSelectPatient(patient);
                          setPatientSearchTerm('');
                          setShowPatientList(false);
                        }}
                        className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0 transition-colors"
                      >
                        <div className="font-medium">{patient.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {patient.patientId} • {patient.gender} • {patient.bloodType || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        
            <a href='/patients?addNew=true'>
            <Button
                variant="outline"
                className="flex-shrink-0"
            >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Patient
            </Button>
            </a>
        </div>

        {/* Selected Patient Display */}
        {selectedPatient ? (
          <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-lg">{selectedPatient.name}</div>
                  <div className="text-sm text-muted-foreground">
                    ID: {selectedPatient.patientId} • {selectedPatient.gender} • Blood Type:{' '}
                    {selectedPatient.bloodType || 'N/A'}
                    {selectedPatient.contactNumber && ` • ${selectedPatient.contactNumber}`}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectPatient(null)}
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-4 bg-muted/50 border border-dashed rounded-lg text-center text-muted-foreground">
            {emptyStateMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
