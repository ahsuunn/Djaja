'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getPatients, createPatient, getPatientObservations } from '@/lib/api-client';
import { isOnline } from '@/lib/db';
import { initAutoSync, performFullSync } from '@/lib/sync';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, FileText, Download, Search, AlertCircle, Loader2, RefreshCcw, RefreshCcwIcon, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';

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

interface Observation {
  _id: string;
  observationId: string;
  status: string;
  testType: string;
  effectiveDateTime: string;
  measurements?: {
    bloodPressure?: { systolic: number; diastolic: number };
    heartRate?: { value: number };
    spO2?: { value: number };
    temperature?: { value: number };
  };
  component?: Array<{
    code: {
      coding: Array<{
        code: string;
        display: string;
      }>;
    };
    valueQuantity: {
      value: number;
      unit: string;
    };
    interpretation?: Array<{
      coding: Array<{
        code: string;
        display: string;
      }>;
    }>;
  }>;
  overallStatus: string;
  performedBy?: {
    name: string;
    role: string;
  };
  createdAt: string;
}

export default function PatientsPage() {
  const searchParams = useSearchParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loadingObservations, setLoadingObservations] = useState(false);
  const [isOnlineStatus, setIsOnlineStatus] = useState(true);
  const [dataFromCache, setDataFromCache] = useState(false);
  const [formData, setFormData] = useState({
    // FHIR Identifiers
    nik: '',
    ihsNumber: '',
    passportNumber: '',
    kk: '',
    // Basic Info
    name: '',
    familyName: '',
    givenNames: '',
    prefix: '',
    suffix: '',
    dateOfBirth: '',
    gender: '',
    phoneNumber: '',
    email: '',
    bloodType: '',
    // FHIR Extensions
    birthPlace: '',
    citizenshipStatus: 'WNI',
    religion: '',
    maritalStatus: '',
    education: '',
    occupation: '',
    // Address
    street: '',
    city: '',
    district: '',
    province: '',
    postalCode: '',
    rt: '',
    rw: '',
    provinceCode: '',
    cityCode: '',
    districtCode: '',
    // Medical Info
    allergies: '',
    medicalHistory: '',
    currentMedications: '',
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
  });

  useEffect(() => {
    fetchPatients();
    setIsOnlineStatus(isOnline());

    const handleOnline = () => {
      setIsOnlineStatus(true);
      fetchPatients(); // Refresh data when back online
    };
    const handleOffline = () => setIsOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check if we should auto-open the add patient modal
  useEffect(() => {
    const addNew = searchParams.get('addNew');
    if (addNew === 'true') {
      setShowAddModal(true);
    }
  }, [searchParams]);

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

      // Use offline-first API
      const result = await getPatients(token);
      setPatients(result.patients || []);
      setDataFromCache(result.fromCache || false);
      
      if (result.fromCache) {
        console.log('Loaded patients from cache');
      }
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

  const fetchPatientObservations = async (patientId: string) => {
    try {
      setLoadingObservations(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      // Use offline-first API
      const result = await getPatientObservations(token, patientId);
      setObservations(result.observations || []);
    } catch (error) {
      console.error('Fetch observations error:', error);
      setObservations([]);
    } finally {
      setLoadingObservations(false);
    }
  };

  // Fetch observations when patient is selected
  useEffect(() => {
    if (selectedPatient) {
      fetchPatientObservations(selectedPatient._id);
    } else {
      setObservations([]);
    }
  }, [selectedPatient]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to add patients');
        setSubmitting(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      // Prepare patient data with FHIR structure
      const patientData = {
        // FHIR Identifiers
        nik: formData.nik,
        ihsNumber: formData.ihsNumber,
        passportNumber: formData.passportNumber,
        kk: formData.kk,
        // Basic Info (backward compatibility)
        name: formData.name,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        phoneNumber: formData.phoneNumber,
        bloodType: formData.bloodType,
        // FHIR names array
        names: [{
          use: 'official',
          text: formData.name,
          family: formData.familyName || formData.name.split(' ').pop(),
          given: formData.givenNames ? formData.givenNames.split(' ') : formData.name.split(' ').slice(0, -1),
          prefix: formData.prefix ? [formData.prefix] : [],
          suffix: formData.suffix ? [formData.suffix] : [],
        }],
        // FHIR telecoms array
        telecoms: [
          {
            system: 'phone',
            value: formData.phoneNumber,
            use: 'mobile',
            rank: 1,
          },
          ...(formData.email ? [{
            system: 'email',
            value: formData.email,
            use: 'home',
            rank: 2,
          }] : []),
        ],
        // FHIR addresses array with administrative codes
        addresses: [{
          use: 'home',
          type: 'physical',
          text: `${formData.street}, RT ${formData.rt}/RW ${formData.rw}, ${formData.district}, ${formData.city}, ${formData.province}`,
          line: formData.street ? [formData.street] : [],
          city: formData.city,
          district: formData.district,
          state: formData.province,
          postalCode: formData.postalCode,
          country: 'Indonesia',
          extension: [{
            url: 'https://fhir.kemkes.go.id/r4/StructureDefinition/administrativeCode',
            extension: [
              ...(formData.provinceCode ? [{ url: 'province', valueCode: formData.provinceCode }] : []),
              ...(formData.cityCode ? [{ url: 'city', valueCode: formData.cityCode }] : []),
              ...(formData.districtCode ? [{ url: 'district', valueCode: formData.districtCode }] : []),
              ...(formData.rt ? [{ url: 'rt', valueCode: formData.rt }] : []),
              ...(formData.rw ? [{ url: 'rw', valueCode: formData.rw }] : []),
            ],
          }],
        }],
        // Legacy address (backward compatibility)
        address: {
          street: formData.street,
          city: formData.city,
          province: formData.province,
          postalCode: formData.postalCode,
        },
        // FHIR contacts array
        contacts: formData.emergencyContactName ? [{
          relationship: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v2-0131',
              code: 'C',
              display: formData.emergencyContactRelationship || 'Emergency Contact',
            }],
            text: formData.emergencyContactRelationship,
          }],
          name: {
            text: formData.emergencyContactName,
          },
          telecom: [{
            system: 'phone',
            value: formData.emergencyContactPhone,
            use: 'mobile',
          }],
        }] : [],
        // Legacy emergency contact (backward compatibility)
        emergencyContact: {
          name: formData.emergencyContactName,
          relationship: formData.emergencyContactRelationship,
          phoneNumber: formData.emergencyContactPhone,
        },
        // FHIR Extensions
        extension: [
          ...(formData.birthPlace ? [{ url: 'https://fhir.kemkes.go.id/r4/StructureDefinition/birthPlace', valueString: formData.birthPlace }] : []),
          { url: 'https://fhir.kemkes.go.id/r4/StructureDefinition/citizenshipStatus', valueCode: formData.citizenshipStatus },
          ...(formData.religion ? [{ url: 'https://fhir.kemkes.go.id/r4/StructureDefinition/religion', valueCode: formData.religion }] : []),
          ...(formData.education ? [{ url: 'https://fhir.kemkes.go.id/r4/StructureDefinition/education', valueString: formData.education }] : []),
          ...(formData.occupation ? [{ url: 'https://fhir.kemkes.go.id/r4/StructureDefinition/occupation', valueString: formData.occupation }] : []),
        ],
        // Marital status
        maritalStatus: formData.maritalStatus ? {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus',
            code: formData.maritalStatus,
            display: formData.maritalStatus,
          }],
        } : undefined,
        // Medical data
        allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()) : [],
        medicalHistory: formData.medicalHistory ? formData.medicalHistory.split(',').map(h => h.trim()) : [],
        currentMedications: formData.currentMedications ? formData.currentMedications.split(',').map(m => m.trim()) : [],
      };

      // Use offline-first API
      const result = await createPatient(token, patientData);
      
      if (result.offline) {
        // Patient saved locally
        console.log('Patient saved locally, will sync when online');
      }

      // Reset form and close modal
      setFormData({
        nik: '',
        ihsNumber: '',
        passportNumber: '',
        kk: '',
        name: '',
        familyName: '',
        givenNames: '',
        prefix: '',
        suffix: '',
        dateOfBirth: '',
        gender: '',
        phoneNumber: '',
        email: '',
        bloodType: '',
        birthPlace: '',
        citizenshipStatus: 'WNI',
        religion: '',
        maritalStatus: '',
        education: '',
        occupation: '',
        street: '',
        city: '',
        district: '',
        province: '',
        postalCode: '',
        rt: '',
        rw: '',
        provinceCode: '',
        cityCode: '',
        districtCode: '',
        allergies: '',
        medicalHistory: '',
        currentMedications: '',
        emergencyContactName: '',
        emergencyContactRelationship: '',
        emergencyContactPhone: '',
      });
      setShowAddModal(false);
      
      // Refresh patient list
      await fetchPatients();
    } catch (error) {
      console.error('Add patient error:', error);
      setError(error instanceof Error ? error.message : 'Failed to add patient');
    } finally {
      setSubmitting(false);
    }
  };

  const exportFHIR = (patient: Patient) => {
    try {
      toast.loading('Exporting FHIR data...', { id: 'fhir-export' });

      // FHIR Patient resource following SATUSEHAT Kemenkes framework
      const fhirPatient = {
        resourceType: 'Patient',
        id: patient._id,
        meta: {
          profile: ['https://fhir.kemkes.go.id/r4/StructureDefinition/Patient']
        },
        // Identifiers - NIK, Patient ID, etc.
        identifier: [
          {
            use: 'official',
            system: 'https://fhir.kemkes.go.id/id/nik',
            value: patient.patientId, // In real implementation, this would be NIK
          },
          {
            use: 'official',
            system: 'http://sys-ids.kemkes.go.id/patient-ihs-number',
            value: patient._id, // IHS Number from MPI
          },
        ],
        // Active status
        active: true,
        // Name with full HumanName structure
        name: [
          {
            use: 'official',
            text: patient.name,
          },
        ],
        // Telecom - phone and email
        telecom: [
          {
            system: 'phone',
            value: patient.phoneNumber,
            use: 'mobile',
          },
        ],
        // Gender following AdministrativeGender
        gender: patient.gender as 'male' | 'female' | 'other' | 'unknown',
        // Birth date in YYYY-MM-DD format
        birthDate: patient.dateOfBirth,
        // Address with administrative codes
        address: patient.address ? [
          {
            use: 'home',
            line: [patient.address.street],
            city: patient.address.city,
            postalCode: patient.address.postalCode,
            country: 'ID',
            extension: [
              {
                url: 'https://fhir.kemkes.go.id/r4/StructureDefinition/administrativeCode',
                extension: [
                  {
                    url: 'province',
                    valueCode: patient.address.province,
                  },
                  {
                    url: 'city',
                    valueCode: patient.address.city,
                  },
                ],
              },
            ],
          },
        ] : [],
        // Marital status
        maritalStatus: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v3-MaritalStatus',
              code: 'U', // Unknown - can be updated based on actual data
              display: 'Unmarried',
            },
          ],
        },
        // Emergency contact
        contact: patient.emergencyContact ? [
          {
            relationship: [
              {
                coding: [
                  {
                    system: 'http://terminology.hl7.org/CodeSystem/v2-0131',
                    code: 'C',
                    display: 'Emergency Contact',
                  },
                ],
              },
            ],
            name: {
              use: 'official',
              text: patient.emergencyContact.name,
            },
            telecom: [
              {
                system: 'phone',
                value: patient.emergencyContact.phoneNumber,
                use: 'mobile',
              },
            ],
          },
        ] : [],
        // Communication language
        communication: [
          {
            language: {
              coding: [
                {
                  system: 'urn:ietf:bcp:47',
                  code: 'id-ID',
                  display: 'Indonesian',
                },
              ],
            },
            preferred: true,
          },
        ],
        // Extensions for additional data
        extension: [
          {
            url: 'https://fhir.kemkes.go.id/r4/StructureDefinition/citizenshipStatus',
            valueCode: 'WNI', // Indonesian citizen
          },
        ],
      };

      // Create a Bundle resource for complete export
      const fhirBundle = {
        resourceType: 'Bundle',
        type: 'collection',
        timestamp: new Date().toISOString(),
        entry: [
          {
            fullUrl: `Patient/${patient._id}`,
            resource: fhirPatient,
          },
          // Include Observation resources for allergies
          ...patient.allergies.map((allergy, index) => ({
            fullUrl: `AllergyIntolerance/${patient._id}-allergy-${index}`,
            resource: {
              resourceType: 'AllergyIntolerance',
              id: `${patient._id}-allergy-${index}`,
              clinicalStatus: {
                coding: [
                  {
                    system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
                    code: 'active',
                    display: 'Active',
                  },
                ],
              },
              verificationStatus: {
                coding: [
                  {
                    system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
                    code: 'confirmed',
                    display: 'Confirmed',
                  },
                ],
              },
              type: 'allergy',
              category: ['medication'],
              patient: {
                reference: `Patient/${patient._id}`,
                display: patient.name,
              },
              code: {
                text: allergy,
              },
            },
          })),
          // Include Condition resources for medical history
          ...patient.medicalHistory.map((condition, index) => ({
            fullUrl: `Condition/${patient._id}-condition-${index}`,
            resource: {
              resourceType: 'Condition',
              id: `${patient._id}-condition-${index}`,
              clinicalStatus: {
                coding: [
                  {
                    system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                    code: 'active',
                    display: 'Active',
                  },
                ],
              },
              verificationStatus: {
                coding: [
                  {
                    system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
                    code: 'confirmed',
                    display: 'Confirmed',
                  },
                ],
              },
              category: [
                {
                  coding: [
                    {
                      system: 'http://terminology.hl7.org/CodeSystem/condition-category',
                      code: 'problem-list-item',
                      display: 'Problem List Item',
                    },
                  ],
                },
              ],
              code: {
                text: condition,
              },
              subject: {
                reference: `Patient/${patient._id}`,
                display: patient.name,
              },
            },
          })),
          // Include MedicationStatement for current medications
          ...patient.currentMedications.map((medication, index) => ({
            fullUrl: `MedicationStatement/${patient._id}-medication-${index}`,
            resource: {
              resourceType: 'MedicationStatement',
              id: `${patient._id}-medication-${index}`,
              status: 'active',
              medicationCodeableConcept: {
                text: medication,
              },
              subject: {
                reference: `Patient/${patient._id}`,
                display: patient.name,
              },
              effectivePeriod: {
                start: new Date().toISOString().split('T')[0],
              },
            },
          })),
        ],
      };

      const dataStr = JSON.stringify(fhirBundle, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `patient-${patient.patientId}-fhir-bundle.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      toast.success('FHIR data exported successfully!', { 
        id: 'fhir-export',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error exporting FHIR data:', error);
      toast.error('Failed to export FHIR data', { 
        id: 'fhir-export',
        duration: 4000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-2">Electronic Medical Records</h1>
              <p className="text-muted-foreground">Patient demographics and medical history management</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Patient
              </Button>
              <Button onClick={fetchPatients} variant="outline" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Refresh
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <SyncStatusIndicator />
            {dataFromCache && (
              <div className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1.5 rounded-full">
                📦 Showing cached data
              </div>
            )}
          </div>
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
                    <CardTitle className="flex items-center gap-2">
                      Observation History
                      {loadingObservations && <Loader2 className="w-4 h-4 animate-spin" />}
                    </CardTitle>
                    <CardDescription>Diagnostic observations from IoT devices</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingObservations ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="ml-2 text-muted-foreground">Loading observations...</span>
                      </div>
                    ) : observations.length > 0 ? (
                      <div className="space-y-3">
                        {observations.map((obs) => {
                          // Extract vital signs from component array
                          const getBPValue = () => {
                            const systolic = obs.component?.find(c => c.code.coding[0].code === '8480-6');
                            const diastolic = obs.component?.find(c => c.code.coding[0].code === '8462-4');
                            if (systolic && diastolic) {
                              return `${systolic.valueQuantity.value}/${diastolic.valueQuantity.value} mmHg`;
                            }
                            return obs.measurements?.bloodPressure 
                              ? `${obs.measurements.bloodPressure.systolic}/${obs.measurements.bloodPressure.diastolic} mmHg`
                              : 'N/A';
                          };

                          const getHRValue = () => {
                            const hr = obs.component?.find(c => c.code.coding[0].code === '8867-4');
                            if (hr) return `${hr.valueQuantity.value} ${hr.valueQuantity.unit}`;
                            return obs.measurements?.heartRate ? `${obs.measurements.heartRate.value} bpm` : 'N/A';
                          };

                          const getSpO2Value = () => {
                            const spo2 = obs.component?.find(c => c.code.coding[0].code === '59408-5');
                            if (spo2) return `${spo2.valueQuantity.value}%`;
                            return obs.measurements?.spO2 ? `${obs.measurements.spO2.value}%` : 'N/A';
                          };

                          const getTempValue = () => {
                            const temp = obs.component?.find(c => c.code.coding[0].code === '8310-5');
                            if (temp) return `${temp.valueQuantity.value}°C`;
                            return obs.measurements?.temperature ? `${obs.measurements.temperature.value}°C` : 'N/A';
                          };

                          const getStatusColor = (status: string) => {
                            switch (status) {
                              case 'critical': return 'text-red-600 bg-red-50 border-red-200';
                              case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
                              case 'caution': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
                              case 'normal': return 'text-green-600 bg-green-50 border-green-200';
                              default: return 'text-gray-600 bg-gray-50 border-gray-200';
                            }
                          };

                          return (
                            <div key={obs._id} className={`p-4 border rounded-lg ${getStatusColor(obs.overallStatus)}`}>
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <div className="font-medium text-sm capitalize">{obs.testType?.replace('-', ' ') || 'Comprehensive'} Diagnostic</div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {new Date(obs.effectiveDateTime || obs.createdAt).toLocaleString()}
                                  </div>
                                  {obs.performedBy && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      By: {obs.performedBy.name} ({obs.performedBy.role})
                                    </div>
                                  )}
                                </div>
                                <div className={`px-2 py-1 rounded text-xs font-medium uppercase ${getStatusColor(obs.overallStatus)}`}>
                                  {obs.overallStatus}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">BP:</span> <span className="font-medium">{getBPValue()}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">HR:</span> <span className="font-medium">{getHRValue()}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">SpO₂:</span> <span className="font-medium">{getSpO2Value()}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Temp:</span> <span className="font-medium">{getTempValue()}</span>
                                </div>
                              </div>
                              <div className="mt-2 text-xs text-muted-foreground">
                                ID: {obs.observationId}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No diagnostic observations recorded yet
                      </div>
                    )}
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

      {/* Add Patient Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-2xl font-bold text-primary">Add New Patient</DialogTitle>
            <DialogDescription>Fill in patient demographic and medical information</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-8 px-6 pb-6 overflow-y-auto dialog-scroll" style={{ maxHeight: 'calc(90vh - 120px)' }}>
              {/* FHIR Identifiers */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Identifiers (FHIR)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">NIK (Nomor Induk Kependudukan) *</label>
                    <Input
                      name="nik"
                      value={formData.nik}
                      onChange={handleInputChange}
                      placeholder="3201234567890123"
                      maxLength={16}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">Indonesian National ID (16 digits)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">IHS Number</label>
                    <Input
                      name="ihsNumber"
                      value={formData.ihsNumber}
                      onChange={handleInputChange}
                      placeholder="P123456789"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Indonesia Health Service Number from MPI</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Passport Number</label>
                    <Input
                      name="passportNumber"
                      value={formData.passportNumber}
                      onChange={handleInputChange}
                      placeholder="X1234567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">KK (Kartu Keluarga)</label>
                    <Input
                      name="kk"
                      value={formData.kk}
                      onChange={handleInputChange}
                      placeholder="3201234567890123"
                      maxLength={16}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Family Card Number</p>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Prefix/Title</label>
                    <Input
                      name="prefix"
                      value={formData.prefix}
                      onChange={handleInputChange}
                      placeholder="Tn. / Ny. / Dr."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Given Name(s) *</label>
                    <Input
                      name="givenNames"
                      value={formData.givenNames}
                      onChange={handleInputChange}
                      placeholder="John William"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Family Name *</label>
                    <Input
                      name="familyName"
                      value={formData.familyName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Full Name (Display) *</label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John William Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Suffix</label>
                    <Input
                      name="suffix"
                      value={formData.suffix}
                      onChange={handleInputChange}
                      placeholder="Jr. / Sr. / S.Kom"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Date of Birth *</label>
                    <Input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Birth Place</label>
                    <Input
                      name="birthPlace"
                      value={formData.birthPlace}
                      onChange={handleInputChange}
                      placeholder="Jakarta"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Gender *</label>
                    <Select name="gender" value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Blood Type *</label>
                    <Select name="bloodType" value={formData.bloodType} onValueChange={(value) => setFormData(prev => ({ ...prev, bloodType: value }))} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number *</label>
                    <Input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="+62 812 3456 7890"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email Address</label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="patient@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* FHIR Extensions - Indonesian Specific */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Additional Information (SATUSEHAT)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Citizenship Status *</label>
                    <Select name="citizenshipStatus" value={formData.citizenshipStatus} onValueChange={(value) => setFormData(prev => ({ ...prev, citizenshipStatus: value }))} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select citizenship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WNI">WNI (Indonesian Citizen)</SelectItem>
                        <SelectItem value="WNA">WNA (Foreign Citizen)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Religion</label>
                    <Select name="religion" value={formData.religion} onValueChange={(value) => setFormData(prev => ({ ...prev, religion: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select religion" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="islam">Islam</SelectItem>
                        <SelectItem value="christian-protestant">Christian (Protestant)</SelectItem>
                        <SelectItem value="christian-catholic">Christian (Catholic)</SelectItem>
                        <SelectItem value="hindu">Hindu</SelectItem>
                        <SelectItem value="buddhist">Buddhist</SelectItem>
                        <SelectItem value="confucianist">Confucianist</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Marital Status</label>
                    <Select name="maritalStatus" value={formData.maritalStatus} onValueChange={(value) => setFormData(prev => ({ ...prev, maritalStatus: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Married</SelectItem>
                        <SelectItem value="S">Single</SelectItem>
                        <SelectItem value="D">Divorced</SelectItem>
                        <SelectItem value="W">Widowed</SelectItem>
                        <SelectItem value="U">Unmarried</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Education Level</label>
                    <Input
                      name="education"
                      value={formData.education}
                      onChange={handleInputChange}
                      placeholder="High School / Bachelor / Master"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Occupation</label>
                    <Input
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleInputChange}
                      placeholder="Teacher / Engineer / Student"
                    />
                  </div>
                </div>
              </div>

              {/* Address with Administrative Codes */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Address (FHIR with Administrative Codes)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Street Address</label>
                    <Input
                      name="street"
                      value={formData.street}
                      onChange={handleInputChange}
                      placeholder="Jl. Sudirman No. 123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">RT</label>
                    <Input
                      name="rt"
                      value={formData.rt}
                      onChange={handleInputChange}
                      placeholder="001"
                      maxLength={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">RW</label>
                    <Input
                      name="rw"
                      value={formData.rw}
                      onChange={handleInputChange}
                      placeholder="002"
                      maxLength={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">District (Kecamatan)</label>
                    <Input
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      placeholder="Menteng"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">District Code</label>
                    <Input
                      name="districtCode"
                      value={formData.districtCode}
                      onChange={handleInputChange}
                      placeholder="317101"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">City (Kabupaten/Kota)</label>
                    <Input
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Jakarta Pusat"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">City Code</label>
                    <Input
                      name="cityCode"
                      value={formData.cityCode}
                      onChange={handleInputChange}
                      placeholder="3171"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Province</label>
                    <Input
                      name="province"
                      value={formData.province}
                      onChange={handleInputChange}
                      placeholder="DKI Jakarta"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Province Code</label>
                    <Input
                      name="provinceCode"
                      value={formData.provinceCode}
                      onChange={handleInputChange}
                      placeholder="31"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Postal Code</label>
                    <Input
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      placeholder="10310"
                      maxLength={5}
                    />
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Medical Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Allergies</label>
                    <Input
                      name="allergies"
                      value={formData.allergies}
                      onChange={handleInputChange}
                      placeholder="Penicillin, Peanuts (comma-separated)"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Separate multiple allergies with commas</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Medical History</label>
                    <textarea
                      name="medicalHistory"
                      value={formData.medicalHistory}
                      onChange={handleInputChange}
                      placeholder="Hypertension, Diabetes (comma-separated)"
                      className="w-full px-3 py-2 border rounded-lg resize-none"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Separate multiple conditions with commas</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Current Medications</label>
                    <textarea
                      name="currentMedications"
                      value={formData.currentMedications}
                      onChange={handleInputChange}
                      placeholder="Lisinopril 10mg daily, Metformin 500mg twice daily (comma-separated)"
                      className="w-full px-3 py-2 border rounded-lg resize-none"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Separate multiple medications with commas</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Contact Name</label>
                    <Input
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleInputChange}
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Relationship</label>
                    <Input
                      name="emergencyContactRelationship"
                      value={formData.emergencyContactRelationship}
                      onChange={handleInputChange}
                      placeholder="Spouse, Parent, Sibling"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <Input
                      type="tel"
                      name="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={handleInputChange}
                      placeholder="+62 812 9876 5432"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding Patient...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Patient
                    </>
                  )}
                </Button>
              </div>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
