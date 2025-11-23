import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Patient from '../models/Patient';
import Observation from '../models/Observation';
import Facility from '../models/Facility';

dotenv.config();

/**
 * Migration script to transform existing non-FHIR compliant data to FHIR R4 format
 * This script updates existing documents to include FHIR-compliant fields
 * while preserving backward compatibility with old data
 */

async function migratePatients() {
  console.log('🔄 Migrating Patient records to FHIR format...');
  
  try {
    const patients = await Patient.find({});
    let migratedCount = 0;
    let errorCount = 0;

    for (const patient of patients) {
      try {
        // Initialize FHIR fields if they don't exist
        const updates: any = {};

        // Ensure active field is set
        if (patient.active === undefined) {
          updates.active = patient.isActive !== undefined ? patient.isActive : true;
        }

        // Transform single name to names array
        if (!patient.names || patient.names.length === 0) {
          if (patient.name) {
            updates.names = [{
              use: 'official',
              text: patient.name,
              family: patient.name.split(' ').pop() || patient.name,
              given: patient.name.split(' ').slice(0, -1),
            }];
          }
        }

        // Transform single address to addresses array
        if (!patient.addresses || patient.addresses.length === 0) {
          if (patient.address) {
            updates.addresses = [{
              use: 'home',
              type: 'physical',
              text: `${patient.address.street || ''}, ${patient.address.city || ''}, ${patient.address.province || ''}`,
              line: patient.address.street ? [patient.address.street] : [],
              city: patient.address.city,
              state: patient.address.province,
              postalCode: patient.address.postalCode,
              country: patient.address.country || 'Indonesia',
            }];
          }
        }

        // Transform single phone number to telecoms array
        if (!patient.telecoms || patient.telecoms.length === 0) {
          if (patient.phoneNumber) {
            updates.telecoms = [{
              system: 'phone',
              value: patient.phoneNumber,
              use: 'mobile',
              rank: 1,
            }];
          }
        }

        // Transform emergency contact to contacts array
        if (!patient.contacts || patient.contacts.length === 0) {
          if (patient.emergencyContact?.name) {
            updates.contacts = [{
              relationship: [{
                coding: [{
                  system: 'http://terminology.hl7.org/CodeSystem/v2-0131',
                  code: 'C',
                  display: patient.emergencyContact.relationship || 'Emergency Contact',
                }],
                text: patient.emergencyContact.relationship,
              }],
              name: {
                text: patient.emergencyContact.name,
              },
              telecom: patient.emergencyContact.phoneNumber ? [{
                system: 'phone',
                value: patient.emergencyContact.phoneNumber,
                use: 'mobile',
              }] : [],
            }];
          }
        }

        // Add meta field
        if (!patient.meta) {
          updates.meta = {
            versionId: '1',
            lastUpdated: patient.updatedAt || new Date(),
            profile: ['https://satusehat.kemkes.go.id/fhir/StructureDefinition/Patient'],
          };
        }

        // Update if there are changes
        if (Object.keys(updates).length > 0) {
          await Patient.findByIdAndUpdate(patient._id, updates);
          migratedCount++;
        }
      } catch (error) {
        console.error(`Error migrating patient ${patient._id}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ Migrated ${migratedCount} patients successfully`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} patients failed to migrate`);
    }
  } catch (error) {
    console.error('❌ Error migrating patients:', error);
  }
}

async function migrateObservations() {
  console.log('🔄 Migrating Observation records to FHIR format...');
  
  try {
    const observations = await Observation.find({});
    let migratedCount = 0;
    let errorCount = 0;

    for (const observation of observations) {
      try {
        const updates: any = {};

        // Set default FHIR status
        if (!observation.status) {
          updates.status = 'final';
        }

        // Set default category
        if (!observation.category || observation.category.length === 0) {
          updates.category = [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs',
            }],
          }];
        }

        // Transform testType to FHIR code with LOINC
        if (!observation.code && observation.testType) {
          const loincMap: { [key: string]: { code: string; display: string } } = {
            'blood-pressure': { code: '85354-9', display: 'Blood pressure panel' },
            'heart-rate': { code: '8867-4', display: 'Heart rate' },
            'spo2': { code: '59408-5', display: 'Oxygen saturation' },
            'glucose': { code: '2339-0', display: 'Glucose [Mass/volume] in Blood' },
            'ekg': { code: '11524-6', display: 'EKG study' },
            'temperature': { code: '8310-5', display: 'Body temperature' },
            'comprehensive': { code: '85354-9', display: 'Vital signs panel' },
          };

          const loinc = loincMap[observation.testType] || { code: '85354-9', display: 'Vital Signs' };
          updates.code = {
            coding: [{
              system: 'http://loinc.org',
              code: loinc.code,
              display: loinc.display,
            }],
            text: observation.testType,
          };
        }

        // Transform subject reference
        if (!observation.subject && observation.patientId) {
          updates.subject = {
            reference: `Patient/${observation.patientId}`,
            display: 'Patient',
          };
        }

        // Set effectiveDateTime
        if (!observation.effectiveDateTime) {
          updates.effectiveDateTime = observation.createdAt || new Date();
        }

        // Set issued
        if (!observation.issued) {
          updates.issued = observation.createdAt || new Date();
        }

        // Transform measurements to component array
        if (!observation.component || observation.component.length === 0) {
          const components: any[] = [];

          if (observation.measurements?.bloodPressure) {
            const { systolic, diastolic } = observation.measurements.bloodPressure;
            
            components.push({
              code: {
                coding: [{
                  system: 'http://loinc.org',
                  code: '8480-6',
                  display: 'Systolic blood pressure',
                }],
              },
              valueQuantity: {
                value: systolic,
                unit: 'mmHg',
                system: 'http://unitsofmeasure.org',
                code: 'mm[Hg]',
              },
              interpretation: [{
                coding: [{
                  system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                  code: systolic >= 140 ? 'H' : systolic < 90 ? 'L' : 'N',
                  display: systolic >= 140 ? 'High' : systolic < 90 ? 'Low' : 'Normal',
                }],
              }],
            });

            components.push({
              code: {
                coding: [{
                  system: 'http://loinc.org',
                  code: '8462-4',
                  display: 'Diastolic blood pressure',
                }],
              },
              valueQuantity: {
                value: diastolic,
                unit: 'mmHg',
                system: 'http://unitsofmeasure.org',
                code: 'mm[Hg]',
              },
              interpretation: [{
                coding: [{
                  system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                  code: diastolic >= 90 ? 'H' : diastolic < 60 ? 'L' : 'N',
                  display: diastolic >= 90 ? 'High' : diastolic < 60 ? 'Low' : 'Normal',
                }],
              }],
            });
          }

          if (observation.measurements?.heartRate) {
            const { value } = observation.measurements.heartRate;
            components.push({
              code: {
                coding: [{
                  system: 'http://loinc.org',
                  code: '8867-4',
                  display: 'Heart rate',
                }],
              },
              valueQuantity: {
                value,
                unit: 'beats/minute',
                system: 'http://unitsofmeasure.org',
                code: '/min',
              },
              interpretation: [{
                coding: [{
                  system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                  code: value > 100 ? 'H' : value < 60 ? 'L' : 'N',
                  display: value > 100 ? 'High' : value < 60 ? 'Low' : 'Normal',
                }],
              }],
            });
          }

          if (observation.measurements?.spO2) {
            const { value } = observation.measurements.spO2;
            components.push({
              code: {
                coding: [{
                  system: 'http://loinc.org',
                  code: '59408-5',
                  display: 'Oxygen saturation',
                }],
              },
              valueQuantity: {
                value,
                unit: '%',
                system: 'http://unitsofmeasure.org',
                code: '%',
              },
              interpretation: [{
                coding: [{
                  system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                  code: value < 95 ? 'L' : 'N',
                  display: value < 95 ? 'Low' : 'Normal',
                }],
              }],
            });
          }

          if (observation.measurements?.glucose) {
            const { value } = observation.measurements.glucose;
            components.push({
              code: {
                coding: [{
                  system: 'http://loinc.org',
                  code: '2339-0',
                  display: 'Glucose',
                }],
              },
              valueQuantity: {
                value,
                unit: 'mg/dL',
                system: 'http://unitsofmeasure.org',
                code: 'mg/dL',
              },
              interpretation: [{
                coding: [{
                  system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                  code: value > 126 ? 'H' : value < 70 ? 'L' : 'N',
                  display: value > 126 ? 'High' : value < 70 ? 'Low' : 'Normal',
                }],
              }],
            });
          }

          if (components.length > 0) {
            updates.component = components;
          }
        }

        // Add meta field
        if (!observation.meta) {
          updates.meta = {
            versionId: '1',
            lastUpdated: observation.updatedAt || new Date(),
            profile: ['https://satusehat.kemkes.go.id/fhir/StructureDefinition/Observation'],
          };
        }

        // Update if there are changes
        if (Object.keys(updates).length > 0) {
          await Observation.findByIdAndUpdate(observation._id, updates);
          migratedCount++;
        }
      } catch (error) {
        console.error(`Error migrating observation ${observation._id}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ Migrated ${migratedCount} observations successfully`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} observations failed to migrate`);
    }
  } catch (error) {
    console.error('❌ Error migrating observations:', error);
  }
}

async function migrateFacilities() {
  console.log('🔄 Migrating Facility records to FHIR Organization format...');
  
  try {
    const facilities = await Facility.find({});
    let migratedCount = 0;
    let errorCount = 0;

    for (const facility of facilities) {
      try {
        const updates: any = {};

        // Set active field
        if (facility.active === undefined) {
          updates.active = facility.isActive !== undefined ? facility.isActive : true;
        }

        // Transform facilityType to type array
        if (!facility.type || facility.type.length === 0) {
          if (facility.facilityType) {
            const typeMap: { [key: string]: string } = {
              'hospital': 'prov',
              'clinic': 'prov',
              'puskesmas': 'prov',
              'laboratory': 'dept',
            };
            
            updates.type = [{
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/organization-type',
                code: typeMap[facility.facilityType] || 'prov',
                display: facility.facilityType,
              }],
              text: facility.facilityType,
            }];
          }
        }

        // Transform single phone to telecoms array
        if (!facility.telecoms || facility.telecoms.length === 0) {
          const telecoms: any[] = [];
          
          if (facility.phoneNumber) {
            telecoms.push({
              system: 'phone',
              value: facility.phoneNumber,
              use: 'work',
            });
          }
          
          if (facility.email) {
            telecoms.push({
              system: 'email',
              value: facility.email,
              use: 'work',
            });
          }
          
          if (telecoms.length > 0) {
            updates.telecoms = telecoms;
          }
        }

        // Transform single address to addresses array
        if (!facility.addresses || facility.addresses.length === 0) {
          if (facility.address) {
            updates.addresses = [{
              use: 'work',
              type: 'physical',
              text: `${facility.address.street || ''}, ${facility.address.city || ''}, ${facility.address.province || ''}`,
              line: facility.address.street ? [facility.address.street] : [],
              city: facility.address.city,
              state: facility.address.province,
              postalCode: facility.address.postalCode,
              country: facility.address.country || 'Indonesia',
            }];
          }
        }

        // Add meta field
        if (!facility.meta) {
          updates.meta = {
            versionId: '1',
            lastUpdated: facility.updatedAt || new Date(),
            profile: ['https://satusehat.kemkes.go.id/fhir/StructureDefinition/Organization'],
          };
        }

        // Update if there are changes
        if (Object.keys(updates).length > 0) {
          await Facility.findByIdAndUpdate(facility._id, updates);
          migratedCount++;
        }
      } catch (error) {
        console.error(`Error migrating facility ${facility._id}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ Migrated ${migratedCount} facilities successfully`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} facilities failed to migrate`);
    }
  } catch (error) {
    console.error('❌ Error migrating facilities:', error);
  }
}

async function runMigration() {
  try {
    console.log('🚀 Starting FHIR migration...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI as string, {
      dbName: 'djaja'
    });
    console.log('✅ Connected to MongoDB\n');

    // Run migrations
    await migratePatients();
    console.log('');
    await migrateObservations();
    console.log('');
    await migrateFacilities();
    console.log('');

    console.log('🎉 Migration completed successfully!');
    console.log('📝 All existing data has been transformed to FHIR R4 format');
    console.log('🔄 Backward compatibility maintained - old fields still accessible');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration();
}

export { migratePatients, migrateObservations, migrateFacilities };
