// Offline-first API client with automatic caching and sync
import {
  savePatientLocally,
  saveObservationLocally,
  saveDiagnosticLocally,
  getAllPatientsLocally,
  getObservationsByPatientLocally,
  addToSyncQueue,
  isOnline,
} from './db';
import { toast } from 'sonner';

const API_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')
  : 'http://localhost:5000';

// Fetch with offline fallback
async function fetchWithFallback(
  url: string,
  options: RequestInit,
  cacheKey?: string
): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    return response;
  } catch (error) {
    if (!isOnline()) {
      throw new Error('OFFLINE');
    }
    throw error;
  }
}

// Get all patients (offline-first)
export async function getPatients(token: string) {
  // Always return cached data first
  const cachedPatients = await getAllPatientsLocally();

  if (!isOnline()) {
    return { patients: cachedPatients, fromCache: true };
  }

  // Try to fetch fresh data from server
  try {
    const response = await fetchWithFallback(
      `${API_URL}/api/patients`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const patients = data.patients || [];

      // Update cache with fresh data
      for (const patient of patients) {
        await savePatientLocally(patient, 'synced');
      }

      return { patients, fromCache: false };
    }
  } catch (error) {
    console.warn('Failed to fetch patients from server, using cache:', error);
  }

  // Return cached data if server fetch failed
  return { patients: cachedPatients, fromCache: true };
}

// Create patient (offline-first)
export async function createPatient(token: string, patientData: any) {
  // Save locally first
  const localPatient = {
    ...patientData,
    _id: `local-patient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    patientId: patientData.patientId || `PT-${Date.now()}`,
    localOnly: true,
  };

  await savePatientLocally(localPatient, 'pending');

  if (!isOnline()) {
    toast.success('Patient saved locally. Will sync when online.', {
      duration: 4000,
    });
    return { patient: localPatient, offline: true };
  }

  // Try to create on server
  try {
    const response = await fetchWithFallback(
      `${API_URL}/api/patients`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      }
    );

    if (response.ok) {
      const result = await response.json();
      // Update local cache with server response
      await savePatientLocally(result.patient, 'synced');
      return { patient: result.patient, offline: false };
    } else {
      // Add to sync queue for retry
      await addToSyncQueue({
        type: 'patient',
        action: 'create',
        data: patientData,
        endpoint: '/api/patients',
        method: 'POST',
      });
    }
  } catch (error) {
    console.error('Failed to create patient on server:', error);
    // Add to sync queue
    await addToSyncQueue({
      type: 'patient',
      action: 'create',
      data: patientData,
      endpoint: '/api/patients',
      method: 'POST',
    });
  }

  return { patient: localPatient, offline: true };
}

// Get observations for a patient (offline-first)
export async function getPatientObservations(token: string, patientId: string) {
  // Get cached observations first
  const cachedObservations = await getObservationsByPatientLocally(patientId);

  if (!isOnline()) {
    return { observations: cachedObservations, fromCache: true };
  }

  // Try to fetch from server
  try {
    const response = await fetchWithFallback(
      `${API_URL}/api/patients/${patientId}/observations`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const observations = data.observations || [];

      // Update cache
      for (const obs of observations) {
        await saveObservationLocally(obs, 'synced');
      }

      return { observations, fromCache: false };
    }
  } catch (error) {
    console.warn('Failed to fetch observations from server, using cache:', error);
  }

  return { observations: cachedObservations, fromCache: true };
}

// Create observation (offline-first)
export async function createObservation(token: string, observationData: any) {
  // Save locally first
  const localObservation = {
    ...observationData,
    _id: `local-obs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    observationId: observationData.observationId || `OBS-${Date.now()}`,
    createdAt: new Date().toISOString(),
    localOnly: true,
  };

  await saveObservationLocally(localObservation, 'pending');

  if (!isOnline()) {
    toast.success('Observation saved locally. Will sync when online.', {
      duration: 4000,
    });
    return { observation: localObservation, offline: true };
  }

  // Try to create on server
  try {
    const response = await fetchWithFallback(
      `${API_URL}/api/observations`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(observationData),
      }
    );

    if (response.ok) {
      const result = await response.json();
      // Update local cache with server response
      await saveObservationLocally(result.observation, 'synced');
      return { observation: result.observation, offline: false };
    } else {
      // Add to sync queue
      await addToSyncQueue({
        type: 'observation',
        action: 'create',
        data: observationData,
        endpoint: '/api/observations',
        method: 'POST',
      });
    }
  } catch (error) {
    console.error('Failed to create observation on server:', error);
    // Add to sync queue
    await addToSyncQueue({
      type: 'observation',
      action: 'create',
      data: observationData,
      endpoint: '/api/observations',
      method: 'POST',
    });
  }

  return { observation: localObservation, offline: true };
}

// Analyze diagnostics (with offline fallback)
export async function analyzeDiagnostics(deviceData: any) {
  if (!isOnline()) {
    // Return flag to use offline analysis
    return { offline: true };
  }

  try {
    const response = await fetchWithFallback(
      `${API_URL}/api/diagnostics/analyze`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deviceData),
      }
    );

    if (response.ok) {
      const result = await response.json();
      // Save diagnostic result locally
      await saveDiagnosticLocally({
        ...deviceData,
        ...result,
        _id: `diag-${Date.now()}`,
      }, 'synced');
      return { ...result, offline: false };
    }
  } catch (error) {
    console.warn('Failed to analyze on server, using offline analysis:', error);
  }

  return { offline: true };
}

// Check connection status
export function getConnectionStatus() {
  return {
    online: isOnline(),
    message: isOnline() ? 'Connected' : 'Offline - Changes will sync when reconnected',
  };
}
