# Quick Start: FHIR Migration

## Prerequisites
- MongoDB running on `mongodb://localhost:27017`
- Node.js and npm installed
- Backup of your database (IMPORTANT!)

## Step 1: Backup Database

```powershell
# Create backup directory
mkdir backup

# Backup MongoDB database
mongodump --uri="mongodb://localhost:27017/djaja" --out="./backup/backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
```

## Step 2: Install Dependencies

```powershell
cd server
npm install
```

## Step 3: Configure Environment

Ensure your `.env` file has the correct MongoDB URI:

```env
MONGODB_URI=mongodb://localhost:27017
```

## Step 4: Run Migration

```powershell
npm run migrate:fhir
```

Expected output:
```
🚀 Starting FHIR migration...

✅ Connected to MongoDB

🔄 Migrating Patient records to FHIR format...
✅ Migrated X patients successfully

🔄 Migrating Observation records to FHIR format...
✅ Migrated X observations successfully

🔄 Migrating Facility records to FHIR Organization format...
✅ Migrated X facilities successfully

🎉 Migration completed successfully!
📝 All existing data has been transformed to FHIR R4 format
🔄 Backward compatibility maintained - old fields still accessible
```

## Step 5: Verify Migration

```powershell
# Start the server
npm run dev

# In another PowerShell window, test the API
curl http://localhost:5000/api/patients
curl http://localhost:5000/api/observations
curl http://localhost:5000/api/facilities

# Test FHIR endpoints
curl http://localhost:5000/api/fhir/Patient/{patientId}
curl http://localhost:5000/api/fhir/Observation/{observationId}
```

## Step 6: Check Data

Verify FHIR fields in MongoDB:

```javascript
// Connect to MongoDB
use djaja

// Check Patient FHIR fields
db.patients.findOne({}, {
  nik: 1,
  ihsNumber: 1,
  names: 1,
  addresses: 1,
  telecoms: 1,
  contacts: 1,
  active: 1,
  meta: 1
})

// Check Observation FHIR fields
db.observations.findOne({}, {
  status: 1,
  category: 1,
  code: 1,
  component: 1,
  interpretation: 1,
  meta: 1
})

// Check Facility FHIR fields
db.facilities.findOne({}, {
  active: 1,
  type: 1,
  telecoms: 1,
  addresses: 1,
  meta: 1
})
```

## Troubleshooting

### Migration Script Fails
```powershell
# Check MongoDB is running
Get-Process mongod

# Verify MongoDB connection
mongo mongodb://localhost:27017/djaja --eval "db.stats()"

# Check .env file
cat .env | Select-String MONGODB_URI
```

### Some Records Not Migrated
- Check migration logs for error messages
- Verify data integrity in MongoDB
- Run migration again (it's idempotent)

### Old API Calls Not Working
- Ensure you didn't delete old fields
- Check API routes for proper transformation
- Verify backward compatibility in routes

## Rollback (If Needed)

```powershell
# Stop the server
# Ctrl+C in server terminal

# Restore from backup
mongorestore --uri="mongodb://localhost:27017" --drop ./backup/backup-YYYYMMDD-HHMMSS

# Restart server
npm run dev
```

## What Changed

Your database now has:
- ✅ FHIR-compliant fields added to all records
- ✅ Old fields preserved for backward compatibility
- ✅ Meta fields for version tracking
- ✅ FHIR codes (LOINC, SNOMED, ICD-10)
- ✅ Structured arrays for names, addresses, telecoms

Your API now:
- ✅ Accepts both old and new formats
- ✅ Automatically transforms legacy data to FHIR
- ✅ Returns FHIR-compliant responses
- ✅ Maintains backward compatibility

## Next Steps

1. ✅ Migration complete
2. 🔄 Update frontend to use FHIR fields
3. 🔄 Add NIK, IHS Number inputs to forms
4. 🔄 Update device simulator for FHIR Observations
5. 🔄 Add Encounter tracking to teleconsultation

## Need Help?

- Check `MIGRATION_GUIDE.md` for detailed documentation
- Check `FHIR_IMPLEMENTATION_SUMMARY.md` for technical details
- Review model files in `server/src/models/` for FHIR structure

---

**Estimated Time**: 5-10 minutes
**Risk**: Low (backward compatible, preserves all data)
**Reversible**: Yes (restore from backup)
