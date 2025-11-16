# ✅ QUICK START CHECKLIST

Use this checklist to get your Djaja MVP up and running quickly!

---

## 📦 Phase 1: Initial Setup (30 minutes)

### ☐ 1. Install Prerequisites
- [ ] Node.js v18+ installed ([download](https://nodejs.org/))
- [ ] Git installed ([download](https://git-scm.com/))
- [ ] VS Code installed (recommended)
- [ ] MongoDB Atlas account created ([sign up](https://www.mongodb.com/cloud/atlas/register))

### ☐ 2. MongoDB Atlas Setup
- [ ] Create a free cluster (M0 Sandbox)
- [ ] Create database user (username + password)
- [ ] Whitelist IP address: `0.0.0.0/0` (for development only!)
- [ ] Copy connection string (looks like: `mongodb+srv://user:pass@cluster.mongodb.net/`)

### ☐ 3. Clone and Install
```powershell
# Clone repository (if not already cloned)
git clone https://github.com/ahsuunn/Djaja.git
cd Djaja

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### ☐ 4. Configure Environment Variables

**Create `.env.local` in root:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000
NEXT_PUBLIC_JITSI_DOMAIN=meet.jit.si
```

**Create `server/.env`:**
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=djaja-super-secret-key-2025-hackathon
JWT_EXPIRE=7d
MONGODB_URI=<YOUR-MONGODB-CONNECTION-STRING-HERE>
CORS_ORIGIN=http://localhost:3000
```

**⚠️ IMPORTANT:** Replace `<YOUR-MONGODB-CONNECTION-STRING-HERE>` with your actual MongoDB connection string!

---

## 🚀 Phase 2: Start Development (5 minutes)

### ☐ 5. Start Backend Server
Open Terminal 1 (PowerShell):
```powershell
cd server
npm run dev
```

**Expected output:**
```
✅ MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net
🚀 Server running on port 5000
📡 WebSocket server ready for IoT connections
```

### ☐ 6. Start Frontend Server
Open Terminal 2 (PowerShell):
```powershell
npm run dev
```

**Expected output:**
```
▲ Next.js 14.2.13
- Local:        http://localhost:3000
✓ Ready in 2.3s
```

### ☐ 7. Verify Everything Works
- [ ] Open browser: http://localhost:3000 (should see landing page)
- [ ] Check backend: http://localhost:5000/api/health (should see `{"status":"OK"}`)

---

## 👤 Phase 3: Create Test Users (10 minutes)

### ☐ 8. Install REST Client Extension
- [ ] Open VS Code
- [ ] Install "REST Client" extension by Huachao Mao
- [ ] Open `api-tests.http` file

### ☐ 9. Register Test Users

In `api-tests.http`, run these requests (click "Send Request" above each):

**Register Doctor:**
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Dr. Ahmad Suryanto",
  "email": "doctor@djaja.com",
  "password": "password123",
  "role": "doctor",
  "licenseNumber": "DOC-2024-001",
  "specialization": "General Practitioner",
  "phoneNumber": "+6281234567890"
}
```
- [ ] Request sent successfully
- [ ] Copy the `token` from response

**Register Nakes:**
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Siti Nurhaliza",
  "email": "nakes@djaja.com",
  "password": "password123",
  "role": "nakes",
  "phoneNumber": "+6281234567891"
}
```
- [ ] Request sent successfully

**Register Admin:**
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@djaja.com",
  "password": "password123",
  "role": "admin",
  "phoneNumber": "+6281234567892"
}
```
- [ ] Request sent successfully

### ☐ 10. Test Login
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "doctor@djaja.com",
  "password": "password123"
}
```
- [ ] Login successful
- [ ] Token received
- [ ] Update `@token` variable in `api-tests.http` with your token

---

## 🧪 Phase 4: Test Core Features (15 minutes)

### ☐ 11. Create a Test Patient
In `api-tests.http`, update the Authorization token and run:
```http
POST http://localhost:5000/api/patients
Authorization: Bearer YOUR-TOKEN-HERE
Content-Type: application/json

{
  "name": "Budi Santoso",
  "dateOfBirth": "1985-05-15",
  "gender": "male",
  "address": {
    "street": "Jl. Merdeka No. 123",
    "city": "Pontianak",
    "province": "Kalimantan Barat",
    "postalCode": "78121"
  },
  "phoneNumber": "+6281234567893",
  "bloodType": "O+",
  "allergies": ["Penisilin"],
  "medicalHistory": ["Diabetes Tipe 2"]
}
```
- [ ] Patient created
- [ ] Copy patient `_id` from response

### ☐ 12. Create a Test Observation
```http
POST http://localhost:5000/api/observations
Authorization: Bearer YOUR-TOKEN-HERE
Content-Type: application/json

{
  "patientId": "PATIENT-ID-FROM-STEP-11",
  "testType": "comprehensive",
  "measurements": {
    "bloodPressure": {
      "systolic": 145,
      "diastolic": 95
    },
    "heartRate": {
      "value": 88
    },
    "spO2": {
      "value": 96
    },
    "glucose": {
      "value": 125
    }
  },
  "overallStatus": "warning"
}
```
- [ ] Observation created
- [ ] Copy observation `_id` from response

### ☐ 13. Test FHIR Export
```http
GET http://localhost:5000/api/fhir/Patient/PATIENT-ID
Authorization: Bearer YOUR-TOKEN-HERE
```
- [ ] FHIR format patient data received

```http
GET http://localhost:5000/api/fhir/Observation/OBSERVATION-ID
Authorization: Bearer YOUR-TOKEN-HERE
```
- [ ] FHIR format observation data received

### ☐ 14. Test Dashboard Stats
```http
GET http://localhost:5000/api/observations/stats/summary
Authorization: Bearer YOUR-TOKEN-HERE
```
- [ ] Statistics received (total, critical, warning, normal counts)

---

## 🎨 Phase 5: UI Development (Start Here!)

### ☐ 15. Install VS Code Extensions (Recommended)
- [ ] ES7+ React/Redux/React-Native snippets
- [ ] Tailwind CSS IntelliSense
- [ ] ESLint
- [ ] Prettier

### ☐ 16. Choose Your First Feature to Build

**Option A: Authentication Pages (Easiest)**
```
Create: app/auth/login/page.tsx
Create: app/auth/register/page.tsx
```
**Estimated time:** 2-3 hours

**Option B: Device Simulator (Most Impressive)**
```
Create: app/device-simulator/page.tsx
Add WebSocket connection
Add real-time results display
```
**Estimated time:** 3-4 hours

**Option C: Dashboard Overview (Best for Demo)**
```
Create: app/dashboard/layout.tsx
Create: app/dashboard/page.tsx
Add charts with Recharts
Add statistics cards
```
**Estimated time:** 4-5 hours

**Option D: Patient Management (Most Complete)**
```
Create: app/dashboard/patients/page.tsx
Create: app/dashboard/patients/new/page.tsx
Create: app/dashboard/patients/[id]/page.tsx
```
**Estimated time:** 4-6 hours

---

## 📚 Phase 6: Reference Documents

### ☐ 17. Read These Files
- [ ] `README.md` - Full project documentation
- [ ] `SETUP_GUIDE.md` - Detailed development roadmap
- [ ] `api-tests.http` - All API endpoint examples

### ☐ 18. Bookmark These Resources
- [ ] Next.js Docs: https://nextjs.org/docs
- [ ] Tailwind CSS: https://tailwindcss.com/docs
- [ ] shadcn/ui: https://ui.shadcn.com
- [ ] MongoDB Docs: https://www.mongodb.com/docs
- [ ] FHIR R4: https://hl7.org/fhir/R4

---

## 🎯 Success Criteria (MVP Complete)

### Minimum Features for Demo:
- [ ] User can register and login
- [ ] User can create a patient
- [ ] User can view patient list
- [ ] Device simulator generates data
- [ ] AI analysis shows results
- [ ] Dashboard shows statistics
- [ ] FHIR export works

### Bonus Features (If Time Permits):
- [ ] Doctor can review observations
- [ ] Telemedicine video interface
- [ ] Responsive mobile design
- [ ] Offline mode simulation
- [ ] PDF report generation

---

## 🚨 Troubleshooting Quick Fixes

### MongoDB Connection Error
```powershell
# Check if connection string is correct in server/.env
notepad server\.env

# Make sure it looks like this (with your credentials):
# MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/djaja?retryWrites=true&w=majority
```

### Port Already in Use
```powershell
# Kill process on port 5000
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force

# Kill process on port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

### Module Not Found
```powershell
# Reinstall dependencies
Remove-Item -Recurse -Force node_modules
npm install

# For backend
cd server
Remove-Item -Recurse -Force node_modules
npm install
cd ..
```

### Environment Variables Not Loading
```powershell
# Restart both servers after editing .env files
# Make sure .env.local is in root directory
# Make sure server/.env is in server directory
```

---

## 📞 Need Help?

**Before asking for help, verify:**
1. ✅ Both servers are running (check both terminals)
2. ✅ MongoDB connection string is correct
3. ✅ You have at least one registered user
4. ✅ Token is copied correctly in API tests

**Common Issues:**
- TypeScript errors? These are warnings - app will still work
- CSS not loading? Restart dev server
- API not responding? Check if backend server is running

---

## 🎉 YOU'RE READY TO BUILD!

Your checklist progress:
- Phase 1: [ ] Complete
- Phase 2: [ ] Complete
- Phase 3: [ ] Complete
- Phase 4: [ ] Complete
- Phase 5: [ ] In Progress
- Phase 6: [ ] Started

**Next Step:** Pick a feature from Phase 5 and start coding!

**Pro Tip:** Build one complete feature at a time. Don't try to do everything at once!

Good luck with TED 2025! 🚀
