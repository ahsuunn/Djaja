// IndexedDB wrapper for offline-first functionality
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface DjajaDB extends DBSchema {
  patients: {
    key: string;
    value: {
      _id: string;
      patientId: string;
      name: string;
      dateOfBirth: string;
      gender: string;
      phoneNumber: string;
      bloodType: string;
      allergies?: string[];
      medicalHistory?: string[];
      currentMedications?: string[];
      address?: any;
      emergencyContact?: any;
      syncStatus: 'synced' | 'pending' | 'failed';
      lastModified: number;
      localOnly?: boolean;
    };
    indexes: { 'by-sync-status': string; 'by-patient-id': string };
  };
  observations: {
    key: string;
    value: {
      _id: string;
      observationId: string;
      patientId: string;
      status: string;
      testType: string;
      effectiveDateTime: string;
      measurements?: any;
      component?: any[];
      analysis?: any;
      overallStatus: string;
      performedBy?: any;
      deviceInfo?: any;
      createdAt: string;
      syncStatus: 'synced' | 'pending' | 'failed';
      lastModified: number;
      localOnly?: boolean;
    };
    indexes: { 'by-patient': string; 'by-sync-status': string };
  };
  diagnostics: {
    key: string;
    value: {
      _id: string;
      deviceId: string;
      patientId: string;
      timestamp: string;
      vitals: any;
      analysis: any;
      diseaseIndicators: any[];
      prescriptions: any[];
      recommendations: any[];
      overallRisk: string;
      summary: string;
      syncStatus: 'synced' | 'pending' | 'failed';
      lastModified: number;
    };
    indexes: { 'by-patient': string; 'by-sync-status': string };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      type: 'patient' | 'observation' | 'diagnostic';
      action: 'create' | 'update' | 'delete';
      data: any;
      endpoint: string;
      method: string;
      retryCount: number;
      lastAttempt?: number;
      error?: string;
      timestamp: number;
    };
    indexes: { 'by-type': string; 'by-timestamp': number };
  };
  metadata: {
    key: string;
    value: {
      key: string;
      value: any;
      lastUpdated: number;
    };
  };
}

let dbInstance: IDBPDatabase<DjajaDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<DjajaDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<DjajaDB>('djaja-offline-db', 1, {
    upgrade(db) {
      // Patients store
      if (!db.objectStoreNames.contains('patients')) {
        const patientStore = db.createObjectStore('patients', { keyPath: '_id' });
        patientStore.createIndex('by-sync-status', 'syncStatus');
        patientStore.createIndex('by-patient-id', 'patientId');
      }

      // Observations store
      if (!db.objectStoreNames.contains('observations')) {
        const obsStore = db.createObjectStore('observations', { keyPath: '_id' });
        obsStore.createIndex('by-patient', 'patientId');
        obsStore.createIndex('by-sync-status', 'syncStatus');
      }

      // Diagnostics store
      if (!db.objectStoreNames.contains('diagnostics')) {
        const diagStore = db.createObjectStore('diagnostics', { keyPath: '_id' });
        diagStore.createIndex('by-patient', 'patientId');
        diagStore.createIndex('by-sync-status', 'syncStatus');
      }

      // Sync queue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        syncStore.createIndex('by-type', 'type');
        syncStore.createIndex('by-timestamp', 'timestamp');
      }

      // Metadata store
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

// Patient operations
export async function savePatientLocally(patient: any, syncStatus: 'synced' | 'pending' | 'failed' = 'pending') {
  const db = await getDB();
  const patientData = {
    ...patient,
    syncStatus,
    lastModified: Date.now(),
  };
  await db.put('patients', patientData);
  return patientData;
}

export async function getPatientLocally(patientId: string) {
  const db = await getDB();
  const patients = await db.getAllFromIndex('patients', 'by-patient-id', patientId);
  return patients[0] || null;
}

export async function getAllPatientsLocally() {
  const db = await getDB();
  return await db.getAll('patients');
}

export async function deletePatientLocally(id: string) {
  const db = await getDB();
  await db.delete('patients', id);
}

// Observation operations
export async function saveObservationLocally(observation: any, syncStatus: 'synced' | 'pending' | 'failed' = 'pending') {
  const db = await getDB();
  const obsData = {
    ...observation,
    _id: observation._id || `local-obs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    syncStatus,
    lastModified: Date.now(),
    localOnly: !observation._id?.startsWith('local-') ? false : true,
  };
  await db.put('observations', obsData);
  return obsData;
}

export async function getObservationsByPatientLocally(patientId: string) {
  const db = await getDB();
  return await db.getAllFromIndex('observations', 'by-patient', patientId);
}

export async function getAllObservationsLocally() {
  const db = await getDB();
  return await db.getAll('observations');
}

export async function deleteObservationLocally(id: string) {
  const db = await getDB();
  await db.delete('observations', id);
}

// Diagnostic operations
export async function saveDiagnosticLocally(diagnostic: any, syncStatus: 'synced' | 'pending' | 'failed' = 'pending') {
  const db = await getDB();
  const diagData = {
    ...diagnostic,
    _id: diagnostic._id || `local-diag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    syncStatus,
    lastModified: Date.now(),
  };
  await db.put('diagnostics', diagData);
  return diagData;
}

export async function getDiagnosticsByPatientLocally(patientId: string) {
  const db = await getDB();
  return await db.getAllFromIndex('diagnostics', 'by-patient', patientId);
}

// Sync queue operations
export async function addToSyncQueue(item: {
  type: 'patient' | 'observation' | 'diagnostic';
  action: 'create' | 'update' | 'delete';
  data: any;
  endpoint: string;
  method: string;
}) {
  const db = await getDB();
  const queueItem = {
    id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...item,
    retryCount: 0,
    timestamp: Date.now(),
  };
  await db.add('syncQueue', queueItem);
  return queueItem;
}

export async function getSyncQueue() {
  const db = await getDB();
  return await db.getAll('syncQueue');
}

export async function removeSyncQueueItem(id: string) {
  const db = await getDB();
  await db.delete('syncQueue', id);
}

export async function updateSyncQueueItem(id: string, updates: Partial<any>) {
  const db = await getDB();
  const item = await db.get('syncQueue', id);
  if (item) {
    await db.put('syncQueue', { ...item, ...updates });
  }
}

export async function getPendingItems(storeName: 'patients' | 'observations' | 'diagnostics') {
  const db = await getDB();
  return await db.getAllFromIndex(storeName, 'by-sync-status', 'pending');
}

// Metadata operations
export async function setMetadata(key: string, value: any) {
  const db = await getDB();
  await db.put('metadata', { key, value, lastUpdated: Date.now() });
}

export async function getMetadata(key: string) {
  const db = await getDB();
  const meta = await db.get('metadata', key);
  return meta?.value;
}

// Clear all data (for logout/reset)
export async function clearAllData() {
  const db = await getDB();
  await db.clear('patients');
  await db.clear('observations');
  await db.clear('diagnostics');
  await db.clear('syncQueue');
  await db.clear('metadata');
}

// Check online status
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

// Sync status helper
export async function getSyncStatus() {
  const db = await getDB();
  const pendingPatients = await db.getAllFromIndex('patients', 'by-sync-status', 'pending');
  const pendingObservations = await db.getAllFromIndex('observations', 'by-sync-status', 'pending');
  const pendingDiagnostics = await db.getAllFromIndex('diagnostics', 'by-sync-status', 'pending');
  const queueItems = await db.getAll('syncQueue');

  return {
    pendingPatients: pendingPatients.length,
    pendingObservations: pendingObservations.length,
    pendingDiagnostics: pendingDiagnostics.length,
    queueItems: queueItems.length,
    totalPending: pendingPatients.length + pendingObservations.length + pendingDiagnostics.length + queueItems.length,
    isOnline: isOnline(),
  };
}
