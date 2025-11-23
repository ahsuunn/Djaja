# FHIR Migration Guide

This guide explains how to migrate your existing non-FHIR compliant data to the new FHIR R4 compliant format following the SATUSEHAT Kemenkes framework.

## Overview

The system has been updated to support FHIR R4 standard with Indonesian Ministry of Health (Kemenkes) SATUSEHAT extensions. All existing data models have been enhanced with FHIR-compliant fields while maintaining backward compatibility.

## What Changed?

### Patient Model
- **Added FHIR identifiers**: `nik` (NIK), `ihsNumber` (IHS Number from MPI), `passportNumber`, `kk` (Kartu Keluarga)
- **Names array**: Supports multiple names with use, family, given, prefix, suffix
- **Addresses array**: Multiple addresses with Indonesian administrative codes (province, city, district, RT/RW)
- **Telecoms array**: Multiple contact points (phone, email, fax) with ranking
- **Contacts array**: Emergency contacts with FHIR relationship coding
- **Extensions**: `citizenshipStatus` (WNI/WNA), `religion`, `education`, `occupation`, `birthPlace`
- **Additional fields**: `maritalStatus`, `multipleBirth`, `deceased`, `communication`, `photo`, `meta`

### Observation Model
- **FHIR status**: registered, preliminary, final, amended, corrected, cancelled
- **Category array**: vital-signs, laboratory, imaging with standard coding
- **Code with LOINC**: Standardized codes (8867-4 for heart rate, 85354-9 for blood pressure)
- **Subject reference**: Patient reference in FHIR format
- **Component array**: Multi-component observations (BP has systolic + diastolic)
- **Value types**: valueQuantity (with UCUM codes), valueCodeableConcept, valueString
- **Interpretation**: H (high), L (low), N (normal), HH (critical high), LL (critical low)
- **Reference range**: Low/high values with units
- **Meta structure**: Version tracking and profile conformance

### Facility Model (Organization)
- **Active field**: FHIR standard active/inactive status
- **Type array**: Organization type coding (prov-provider, dept-department)
- **Alias array**: Alternative facility names
- **Telecoms array**: Multiple contact points (phone, email, fax)
- **Addresses array**: With administrative codes extension
- **PartOf**: Parent organization reference
- **Contact array**: Contact parties with purpose coding
- **Endpoint array**: Technical endpoints (APIs, HL7 interfaces)
- **Accreditation array**: Hospital accreditation details

### New FHIR Resources
- **Practitioner**: Healthcare providers (doctors, nakes, nurses) with qualifications
- **Encounter**: Patient visits/consultations with diagnosis and hospitalization
- **Condition**: Diagnoses and medical history with ICD-10/SNOMED CT coding
- **AllergyIntolerance**: Allergies with reactions and severity
- **DiagnosticReport**: Test reports with ML analysis results
- **MedicationStatement**: Current medications with dosage and timing

## Migration Steps

### 1. Backup Your Database

Before running any migration, **always backup your database**:

```bash
# MongoDB backup
mongodump --uri="mongodb://localhost:27017/djaja" --out="./backup-$(date +%Y%m%d)"
```

### 2. Run the Migration Script

The migration script will automatically transform your existing data to FHIR format:

```bash
cd server
npm run migrate:fhir
```

This will:
- ✅ Transform Patient records (names, addresses, telecoms, contacts)
- ✅ Transform Observation records (LOINC codes, components, interpretation)
- ✅ Transform Facility records (types, telecoms, addresses)
- ✅ Add FHIR meta fields (versionId, lastUpdated, profile)
- ✅ Maintain backward compatibility (old fields still accessible)

### 3. Verify Migration

After migration, verify your data:

```bash
# Start the server
npm run dev

# Test FHIR endpoints
curl http://localhost:5000/api/fhir/Patient/{patientId}
curl http://localhost:5000/api/fhir/Observation/{observationId}
```

## Backward Compatibility

The migration maintains full backward compatibility:

### Old Format Still Works
```javascript
// Legacy API call still works
POST /api/patients
{
  "name": "John Doe",
  "phoneNumber": "08123456789",
  "address": {
    "street": "Jl. Sudirman No. 1",
    "city": "Jakarta",
    "province": "DKI Jakarta"
  }
}
```

### Automatic FHIR Transformation
The API automatically transforms legacy fields to FHIR format:
- `name` → `names` array with HumanName structure
- `phoneNumber` → `telecoms` array with ContactPoint structure
- `address` → `addresses` array with Address structure
- Legacy fields are preserved for backward compatibility

### New FHIR Format
```javascript
// New FHIR API call
POST /api/patients
{
  "nik": "3201234567890123",
  "ihsNumber": "P123456789",
  "names": [{
    "use": "official",
    "text": "John Doe",
    "family": "Doe",
    "given": ["John"]
  }],
  "telecoms": [{
    "system": "phone",
    "value": "08123456789",
    "use": "mobile",
    "rank": 1
  }],
  "addresses": [{
    "use": "home",
    "type": "physical",
    "line": ["Jl. Sudirman No. 1"],
    "city": "Jakarta",
    "state": "DKI Jakarta",
    "postalCode": "12345",
    "country": "Indonesia",
    "extension": [{
      "url": "https://satusehat.kemkes.go.id/fhir/StructureDefinition/administrative-code",
      "extension": [
        { "url": "province", "valueCode": "31" },
        { "url": "city", "valueCode": "3171" },
        { "url": "district", "valueCode": "317101" }
      ]
    }]
  }]
}
```

## Frontend Updates Required

To fully utilize FHIR fields, update your frontend forms:

### 1. Patient Registration Form
Add fields for:
- NIK (Nomor Induk Kependudukan)
- IHS Number (Indonesia Health Service Number)
- Religion (select: islam, christian-protestant, christian-catholic, hindu, buddhist, confucianist, other)
- Marital Status (select: M-married, S-single, D-divorced, W-widowed)
- Citizenship Status (select: WNI, WNA)
- Education level
- Occupation
- Birth place
- Multiple addresses support
- Multiple phone numbers with ranking

### 2. Device Simulator
Update to create FHIR Observations with:
- LOINC codes for each vital sign
- Component array for blood pressure (systolic + diastolic)
- UCUM unit codes
- Interpretation codes (H, L, N)

### 3. Teleconsultation
Create FHIR Encounter resources when:
- Video call starts
- Diagnosis is made
- Treatment is prescribed

## FHIR Endpoints

New FHIR-compliant endpoints are available:

```bash
# Get Patient in FHIR R4 format
GET /api/fhir/Patient/:id

# Get Observation in FHIR R4 format
GET /api/fhir/Observation/:id

# More FHIR endpoints coming soon:
# - GET /api/fhir/Practitioner/:id
# - GET /api/fhir/Encounter/:id
# - GET /api/fhir/Condition/:id
# - GET /api/fhir/AllergyIntolerance/:id
# - GET /api/fhir/DiagnosticReport/:id
# - GET /api/fhir/MedicationStatement/:id
```

## Testing

Test the migration with sample data:

```javascript
// Test Patient FHIR compliance
const patient = await Patient.findOne();
console.log('NIK:', patient.nik);
console.log('IHS Number:', patient.ihsNumber);
console.log('Names:', patient.names);
console.log('Addresses:', patient.addresses);
console.log('Telecoms:', patient.telecoms);
console.log('Meta:', patient.meta);

// Test Observation FHIR compliance
const observation = await Observation.findOne();
console.log('Status:', observation.status);
console.log('Category:', observation.category);
console.log('Code:', observation.code);
console.log('Component:', observation.component);
console.log('Interpretation:', observation.interpretation);
```

## Troubleshooting

### Migration fails for some records
- Check MongoDB logs for specific errors
- Verify data integrity before migration
- Run migration again (it's idempotent - safe to run multiple times)

### Old frontend still works but doesn't show new fields
- Frontend needs updates to display FHIR fields
- API will continue to return both old and new fields
- Update frontend forms gradually

### FHIR validation errors
- Ensure all required fields are provided (subject, code, status)
- Check coding arrays have system, code, display
- Verify references use proper format: `ResourceType/id`

## Resources

- **FHIR R4 Specification**: https://hl7.org/fhir/R4/
- **SATUSEHAT Documentation**: https://satusehat.kemkes.go.id/platform/docs/id/fhir/framework/
- **LOINC Codes**: https://loinc.org/
- **SNOMED CT**: https://www.snomed.org/
- **ICD-10**: https://www.who.int/standards/classifications/classification-of-diseases

## Next Steps

1. ✅ Run migration script on existing data
2. 🔄 Update frontend forms to collect FHIR fields
3. 🔄 Update device simulator to create FHIR Observations
4. 🔄 Update teleconsultation to create FHIR Encounters
5. 🔄 Add FHIR search parameters to API
6. 🔄 Implement FHIR Bundle export/import
7. 🔄 Add FHIR validation middleware

## Support

If you encounter any issues during migration:
1. Check the migration logs for specific errors
2. Verify your MongoDB connection
3. Ensure you have backups before running migration
4. Review the FHIR models in `server/src/models/`
5. Check API routes for transformation logic

---

**Last Updated**: November 2025
**FHIR Version**: R4
**SATUSEHAT Profile Version**: 1.0
