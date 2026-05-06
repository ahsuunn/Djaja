# 🏥 Djaja - Diagnostics as a Service (MVP)

![Djaja Logo](https://via.placeholder.com/800x200/269CAE/ffffff?text=Djaja+Diagnostics+Platform)

**Cloud-based diagnostic platform bringing quality healthcare to remote areas (3T: Terdepan, Terluar, Tertinggal)**

---

## 🎯 Project Overview

Djaja is a comprehensive telemedicine and diagnostics platform. This MVP simulates IoT-based diagnostic devices and provides a complete cloud diagnostic infrastructure with AI-assisted analysis, electronic medical records (FHIR-compliant), and telemedicine capabilities.

### 🌟 Key Features

- ✅ **IoT Device Simulation Dashboard** - Simulates BP, HR, SpO2, Glucose, EKG devices
- ✅ **AI Diagnostics Engine** - Rule-based analysis with smart interpretations
- ✅ **Electronic Medical Records (RME)** - FHIR-ready patient data management
- ✅ **Telemedicine Consultation** - Video calls via Jitsi integration
- ✅ **Role-Based Access Control** - Admin, Doctor, Nakes, Patient roles
- ✅ **Healthcare Facility Dashboard** - Real-time metrics and monitoring
- ✅ **Offline-First Support** - For 3T areas with limited connectivity
- ✅ **Audit Trail & Compliance** - Permenkes 24/2022 compliant

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling with custom colors (#269CAE, #316F83)
- **shadcn/ui** - Beautiful, accessible UI components
- **Recharts** - Data visualization
- **Socket.IO Client** - Real-time device simulation

### Backend
- **Node.js + Express** - RESTful API server
- **MongoDB + Mongoose** - NoSQL database with ODM
- **JWT** - Secure authentication
- **Socket.IO** - WebSocket for IoT simulation
- **bcryptjs** - Password hashing

### External Services
- **MongoDB Atlas** - Cloud database (free tier)
- **Jitsi Meet** - Video conferencing
- **Vercel** - Frontend deployment (free)

---

## 📦 Project Structure

```
Djaja/
├── app/                      # Next.js App Router
│   ├── globals.css          # Global styles with brand colors
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── components/
│   └── ui/                  # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       └── input.tsx
├── lib/
│   └── utils.ts             # Utility functions
├── server/                   # Backend server
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js        # MongoDB connection
│   │   ├── models/          # Mongoose models
│   │   │   ├── User.js
│   │   │   ├── Patient.js
│   │   │   ├── Observation.js
│   │   │   ├── Facility.js
│   │   │   └── AuditLog.js
│   │   ├── routes/          # API routes
│   │   │   ├── auth.js
│   │   │   ├── patients.js
│   │   │   ├── observations.js
│   │   │   ├── users.js
│   │   │   ├── facilities.js
│   │   │   └── fhir.js
│   │   ├── middleware/
│   │   │   └── auth.js      # JWT middleware
│   │   └── server.js        # Main server file
│   └── package.json
├── public/                   # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites

Before you begin, ensure you have:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Git** - [Download](https://git-scm.com/)
- **MongoDB Atlas Account** (free) - [Sign up](https://www.mongodb.com/cloud/atlas/register)

### Step 1: Clone the Repository

```powershell
git clone https://github.com/ahsuunn/Djaja.git
cd Djaja
```

### Step 2: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a **free cluster** (M0 Sandbox)
3. Create a database user with username and password
4. Add your IP address to the IP Whitelist (or use `0.0.0.0/0` for development)
5. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

### Step 3: Configure Environment Variables

#### Frontend Environment (.env.local)

Create a file named `.env.local` in the root directory:

```bash
# Copy the example file
Copy-Item .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000
JWT_SECRET=your-super-secret-jwt-key-change-this
MONGODB_URI=your-mongodb-connection-string-here
NEXT_PUBLIC_JITSI_DOMAIN=meet.jit.si
```

#### Backend Environment (server/.env)

Create a file named `.env` in the `server/` directory:

```bash
# Copy the example file
Copy-Item server\.env.example server\.env
```

Edit `server/.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=7d
MONGODB_URI=your-mongodb-connection-string-here
CORS_ORIGIN=http://localhost:3000
```

**⚠️ Important:** Replace `your-mongodb-connection-string-here` with your actual MongoDB Atlas connection string!

### Step 4: Install Dependencies

#### Install Frontend Dependencies
```powershell
npm install
```

#### Install Backend Dependencies
```powershell
cd server
npm install
cd ..
```

### Step 5: Start the Development Servers

#### Option A: Run Both Servers Separately (Recommended for Development)

**Terminal 1 - Backend Server:**
```powershell
cd server
npm run dev
```
✅ Backend will run on `http://localhost:5000`

**Terminal 2 - Frontend Server:**
```powershell
npm run dev
```
✅ Frontend will run on `http://localhost:3000`

#### Option B: Run from Root (if configured)
```powershell
# Terminal 1
npm run server

# Terminal 2
npm run dev
```

### Step 6: Access the Application

Open your browser and navigate to:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api/health

---

## 👤 Default User Accounts

For testing purposes, you'll need to register users via the `/api/auth/register` endpoint or create a registration page.

### Sample User Registration (using Postman/curl):

```bash
# Register a Doctor
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Ahmad Suryanto",
    "email": "doctor@djaja.com",
    "password": "password123",
    "role": "doctor",
    "licenseNumber": "DOC-2024-001",
    "specialization": "General Practitioner",
    "phoneNumber": "+6281234567890"
  }'

# Register a Nakes (Healthcare Worker)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Siti Nurhaliza",
    "email": "nakes@djaja.com",
    "password": "password123",
    "role": "nakes",
    "phoneNumber": "+6281234567891"
  }'
```

---

## 🎨 Brand Colors

The platform uses the following color scheme:

- **Primary:** `#269CAE` (Teal Blue)
- **Secondary:** `#316F83` (Dark Teal)
- **Primary Light:** `#3DB8CC`

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient

### Observations (Diagnostic Tests)
- `GET /api/observations` - Get all observations
- `POST /api/observations` - Create new observation
- `PUT /api/observations/:id/review` - Add doctor review
- `GET /api/observations/stats/summary` - Get statistics

### FHIR (Medical Records)
- `GET /api/fhir/Patient/:id` - Get patient in FHIR format
- `GET /api/fhir/Observation/:id` - Get observation in FHIR format

### Facilities
- `GET /api/facilities` - Get all facilities
- `POST /api/facilities` - Create new facility

---

## 🔌 WebSocket Events (IoT Simulation)

### Client → Server
```javascript
socket.emit('device-data', {
  deviceId: 'BP-001',
  patientId: '507f1f77bcf86cd799439011',
  bloodPressure: { systolic: 140, diastolic: 90 },
  heartRate: 85,
  spO2: 97,
  glucose: 110,
  ekg: { rhythm: 'regular', waveformData: [...] }
});
```

### Server → Client
```javascript
socket.on('diagnostic-result', (data) => {
  console.log('Analysis:', data.analysis);
});
```

---

## 🧪 Testing the MVP

### 1. Test Device Simulation
1. Navigate to http://localhost:3000/device-simulator
2. Generate fake vital signs data
3. Click "Send to Cloud"
4. View AI analysis results

### 2. Test Patient Management
1. Login as `nakes` or `doctor`
2. Create a new patient
3. Run diagnostic tests
4. View results in dashboard

### 3. Test FHIR Export
1. Create a patient and observation
2. Access `/api/fhir/Patient/{id}`
3. Access `/api/fhir/Observation/{id}`
4. Verify FHIR R4 format compliance

---

## 🌐 Deployment Guide

### Deploy Frontend to Vercel

```powershell
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Deploy Backend Options

1. **Railway** (Recommended)
2. **Render**
3. **Heroku**
4. **AWS EC2/Lambda**

---

## 📋 Next Steps for Full Implementation

### Phase 1: Core MVP Enhancement (Current)
- ✅ Device simulation dashboard
- ✅ Basic diagnostic engine
- ✅ Patient management
- ✅ Authentication & RBAC

### Phase 2: UI/UX Development (Next)
- [ ] Build complete dashboard pages
- [ ] Create device simulator UI
- [ ] Implement patient registration form
- [ ] Add observation results display
- [ ] Create telemedicine video interface

### Phase 3: Advanced Features
- [ ] Offline-first mode with IndexedDB
- [ ] Real MQTT integration
- [ ] PDF report generation
- [ ] SMS/Email notifications
- [ ] Google Maps facility view

### Phase 4: Testing & Optimization
- [ ] Unit tests with Jest
- [ ] Integration tests
- [ ] Performance optimization
- [ ] Security audit

---

## 🐛 Troubleshooting

### Issue: MongoDB connection fails
**Solution:** Verify your connection string and ensure your IP is whitelisted in MongoDB Atlas.

### Issue: Port already in use
**Solution:** 
```powershell
# Find and kill process on port 5000
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force

# Or use a different port
$env:PORT=5001; npm run dev
```

### Issue: Module not found errors
**Solution:**
```powershell
# Clear cache and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

---

## 📝 Development Workflow

1. **Create a new feature branch**
   ```powershell
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes and commit**
   ```powershell
   git add .
   git commit -m "Add: your feature description"
   ```

3. **Push to GitHub**
   ```powershell
   git push origin feature/your-feature-name
   ```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Team

- **Developer:** Your Name
- **Project:** TED 2025 Hackathon
- **Category:** Healthcare Technology

---

## 📞 Support

For questions or issues:
- **GitHub Issues:** [Create an issue](https://github.com/ahsuunn/Djaja/issues)
- **Email:** support@djaja.com (placeholder)

---

## 🙏 Acknowledgments

- **MongoDB Atlas** - Database hosting
- **Vercel** - Frontend hosting
- **shadcn/ui** - UI components
- **Jitsi** - Video conferencing
- **FHIR** - Healthcare data standards

---

**Built with ❤️ for better healthcare accessibility in Indonesia's 3T regions**
