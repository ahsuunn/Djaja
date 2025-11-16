# 🚀 SETUP GUIDE - What to Do Next

## ✅ What We've Built So Far

Your Djaja Diagnostics MVP now has:

1. **✅ Complete Backend Infrastructure**
   - Express.js server with WebSocket support
   - MongoDB models (User, Patient, Observation, Facility, AuditLog)
   - JWT authentication with role-based access control
   - RESTful API endpoints
   - FHIR-compliant data format
   - Real-time IoT device simulation via WebSocket
   - Rule-based diagnostic AI engine

2. **✅ Frontend Foundation**
   - Next.js 14 with TypeScript
   - Tailwind CSS with brand colors (#269CAE, #316F83)
   - shadcn/ui components (Button, Card, Input)
   - Landing page with features showcase
   - Project structure ready for rapid development

---

## 📋 IMMEDIATE NEXT STEPS (Priority Order)

### Step 1: Install Dependencies and Test Setup (15 minutes)

```powershell
# 1. Install frontend dependencies
npm install

# 2. Install backend dependencies
cd server
npm install
cd ..

# 3. Set up MongoDB Atlas (if not done yet)
# - Go to https://www.mongodb.com/cloud/atlas
# - Create free account and cluster
# - Get connection string

# 4. Create environment files
# Copy and edit .env.local for frontend
Copy-Item .env.local.example .env.local

# Copy and edit server/.env for backend
Copy-Item server\.env.example server\.env

# 5. Edit the .env files with your MongoDB connection string
# Use notepad or VS Code to edit:
notepad .env.local
notepad server\.env
```

### Step 2: Start Development Servers (5 minutes)

Open **TWO** PowerShell terminals:

**Terminal 1 - Backend:**
```powershell
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
npm run dev
```

Visit:
- Frontend: http://localhost:3000
- Backend Health: http://localhost:5000/api/health

---

## 🎯 DEVELOPMENT ROADMAP (Next 2-3 Days)

### Day 1: Core UI Pages (6-8 hours)

#### Morning Session (4 hours)
1. **Create Authentication Pages**
   ```
   app/auth/login/page.tsx
   app/auth/register/page.tsx
   ```
   - Login form with email/password
   - Register form with role selection
   - JWT token storage in localStorage
   - Redirect after successful auth

2. **Create Dashboard Layout**
   ```
   app/dashboard/layout.tsx
   app/dashboard/page.tsx
   ```
   - Sidebar navigation
   - Header with user info
   - Role-based menu items
   - Logout button

#### Afternoon Session (4 hours)
3. **Build Device Simulator Page**
   ```
   app/device-simulator/page.tsx
   ```
   - Sliders for BP (systolic/diastolic)
   - Input for heart rate (60-100 bpm)
   - Input for SpO2 (90-100%)
   - Input for glucose (70-200 mg/dL)
   - EKG rhythm selector (regular/irregular)
   - "Send to Cloud" button
   - Real-time results display
   - WebSocket connection

4. **Create Patient List Page**
   ```
   app/dashboard/patients/page.tsx
   app/dashboard/patients/[id]/page.tsx
   ```
   - Table of patients
   - Search/filter functionality
   - "Add Patient" button
   - Patient detail view

---

### Day 2: Medical Records & Diagnostics (6-8 hours)

#### Morning Session (4 hours)
1. **Patient Registration Form**
   ```
   app/dashboard/patients/new/page.tsx
   ```
   - Name, DOB, gender, address
   - Phone number, emergency contact
   - Blood type, allergies
   - Medical history
   - Form validation

2. **Observation Creation Page**
   ```
   app/dashboard/observations/new/page.tsx
   ```
   - Select patient
   - Choose test type
   - Input measurements
   - Auto-save to database

#### Afternoon Session (4 hours)
3. **Observation Results Display**
   ```
   app/dashboard/observations/page.tsx
   app/dashboard/observations/[id]/page.tsx
   ```
   - List all observations
   - Status badges (normal/warning/critical)
   - Filter by patient/date/status
   - Detailed view with analysis

4. **Doctor Review Interface**
   ```
   app/dashboard/observations/[id]/review/page.tsx
   ```
   - View patient info + test results
   - Add doctor notes
   - Mark as reviewed
   - FHIR export button

---

### Day 3: Dashboard & Advanced Features (6-8 hours)

#### Morning Session (4 hours)
1. **Healthcare Facility Dashboard**
   ```
   app/dashboard/overview/page.tsx
   ```
   - Statistics cards (total tests, critical cases, patients)
   - Charts with Recharts:
     - Line chart: Tests over time
     - Bar chart: Tests by type
     - Pie chart: Status distribution
   - Recent observations table
   - Device status indicators (simulated)

2. **Telemedicine Interface**
   ```
   app/dashboard/telemedicine/page.tsx
   ```
   - Jitsi Meet embed
   - Patient selection
   - Video call interface
   - Chat sidebar (optional)

#### Afternoon Session (4 hours)
3. **FHIR Export Feature**
   ```
   components/FHIRExport.tsx
   ```
   - Export patient as FHIR JSON
   - Export observation as FHIR JSON
   - Download as .json file
   - Copy to clipboard

4. **Testing & Polish**
   - Test all user flows
   - Fix bugs
   - Add loading states
   - Add error handling
   - Improve UI/UX

---

## 🛠️ RECOMMENDED TOOLS & LIBRARIES TO INSTALL

### For Better Development Experience

```powershell
# Install additional useful packages
npm install --save \
  react-hook-form \
  zod \
  @hookform/resolvers \
  sonner \
  date-fns \
  jspdf \
  react-chartjs-2 \
  chart.js
```

### VS Code Extensions (Recommended)
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- ESLint
- Prettier
- MongoDB for VS Code
- REST Client (for testing API)

---

## 📝 CODE TEMPLATES TO SPEED UP DEVELOPMENT

### 1. API Hook Template (`lib/hooks/useApi.ts`)

```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function useApi<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(response.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint]);

  return { data, loading, error };
}
```

### 2. Protected Route Component

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function ProtectedRoute({ children, allowedRoles }: { 
  children: React.ReactNode; 
  allowedRoles?: string[];
}) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
    }
    // Add role checking logic here
  }, [router]);

  return <>{children}</>;
}
```

### 3. WebSocket Hook for Device Simulator

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useDeviceSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL!);
    setSocket(newSocket);

    newSocket.on('diagnostic-result', (data) => {
      setResult(data);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const sendData = (deviceData: any) => {
    socket?.emit('device-data', deviceData);
  };

  return { sendData, result };
}
```

---

## 🎨 UI/UX DESIGN TIPS

### Color Usage Guide
- **Primary (#269CAE)**: Main actions, links, active states
- **Secondary (#316F83)**: Secondary buttons, headers
- **Success**: Green for normal results
- **Warning**: Yellow/Orange for caution results
- **Critical**: Red for critical results

### Typography
- **Headings**: font-bold, text-2xl to text-4xl
- **Body**: text-base, text-muted-foreground
- **Labels**: text-sm, font-medium

### Spacing
- **Card padding**: p-6
- **Section spacing**: mb-8 or mb-12
- **Grid gaps**: gap-4 or gap-6

---

## 🧪 TESTING CHECKLIST

Before demo/pitch:

- [ ] User can register and login
- [ ] User can create a patient
- [ ] User can simulate device data
- [ ] AI analysis shows correct results
- [ ] Doctor can review observations
- [ ] FHIR export works
- [ ] Dashboard shows statistics
- [ ] Telemedicine video loads
- [ ] All pages are responsive (mobile-friendly)
- [ ] No console errors

---

## 🎤 DEMO SCRIPT FOR HACKATHON

### 1. Opening (30 seconds)
"Hi! We're presenting Djaja - a cloud-based diagnostics platform for Indonesia's 3T regions. Our solution brings quality healthcare to remote areas using simulated IoT devices and telemedicine."

### 2. Live Demo (3 minutes)

**Step 1:** Show device simulator
- "Here's our IoT device simulator. In production, this would be real medical devices."
- Generate BP reading: 140/90 (shows as Stage 1 Hypertension)
- Send to cloud
- Show AI analysis in real-time

**Step 2:** Show patient management
- "Healthcare workers can register patients with complete medical history."
- Create a sample patient
- View patient details

**Step 3:** Show doctor dashboard
- "Doctors see all diagnostic results in real-time."
- Show statistics
- Review an observation
- Add doctor notes

**Step 4:** Show FHIR export
- "Our system is FHIR-compliant, making it interoperable with other health systems."
- Export patient data
- Show JSON format

**Step 5:** Show telemedicine
- "For follow-ups, doctors can consult patients remotely via video call."
- Launch Jitsi interface

### 3. Closing (30 seconds)
"Djaja solves the healthcare access problem in 3T regions by providing affordable, cloud-based diagnostics with offline support. Thank you!"

---

## 📞 NEED HELP?

### Common Issues & Solutions

1. **Can't connect to MongoDB**
   - Double-check connection string
   - Verify IP whitelist in MongoDB Atlas
   - Check if cluster is running

2. **Frontend can't reach backend**
   - Ensure backend is running on port 5000
   - Check CORS settings in server/src/server.js
   - Verify NEXT_PUBLIC_API_URL in .env.local

3. **Components not styling correctly**
   - Run: `npm install`
   - Check if Tailwind is compiling: restart dev server
   - Verify tailwind.config.ts is correct

4. **TypeScript errors**
   - Run: `npm install --save-dev @types/node @types/react @types/react-dom`
   - Check tsconfig.json

---

## 🚀 READY TO BUILD?

Start with:
```powershell
# Install everything first
npm install
cd server
npm install
cd ..

# Set up .env files
# Then start coding!
```

**Focus on building ONE feature at a time.** Quality over quantity!

Good luck with your hackathon! 🎉
