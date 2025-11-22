# Djaja Desktop Application - Tauri Setup Guide

## Overview

This project has been converted from a Next.js web application to a Tauri desktop application for Windows, enabling native serial port communication for IoT device integration.

## Prerequisites

Before building the desktop application, ensure you have:

1. **Node.js** (v18 or later)
2. **Rust** (latest stable version)
   - Install from: https://rustup.rs/
   - Run: `rustup update`
3. **Visual Studio Build Tools** (for Windows)
   - Install from: https://visualstudio.microsoft.com/downloads/
   - Select "Desktop development with C++" workload

## Project Structure

```
Djaja/
├── app/                    # Next.js pages and components
├── components/             # React components
├── lib/                    # Utility libraries
│   └── tauri-serial.ts    # Tauri serial port utilities
├── src-tauri/             # Tauri backend (Rust)
│   ├── src/
│   │   ├── lib.rs         # Main Tauri entry point
│   │   └── serial.rs      # Serial port commands
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
├── out/                   # Built Next.js static files
└── package.json           # Node.js dependencies
```

## Installation

1. **Install Node.js dependencies:**
   ```powershell
   npm install
   ```

2. **Verify Rust installation:**
   ```powershell
   rustc --version
   cargo --version
   ```

## Development

### Running in Development Mode

Start the development server with hot-reload:

```powershell
npm run tauri:dev
```

This will:
- Start the Next.js development server on `http://localhost:3000`
- Launch the Tauri desktop application
- Enable hot-reload for both frontend and backend changes

### Key Features in Desktop App

1. **Serial Port Communication**
   - List available COM ports
   - Configure baud rate, data bits, stop bits, and parity
   - Read and write data to connected IoT devices
   - Real-time data streaming

2. **Device Simulator**
   - Simulates medical IoT devices
   - Stream vital signs data via serial port or WebSocket
   - Support for Blood Pressure, Heart Rate, SpO2, Temperature, EKG

3. **Patient Management**
   - Electronic Medical Records (EMR)
   - FHIR-compliant data export
   - Patient demographics and medical history

4. **Teleconsultation**
   - Real-time video/audio consultation
   - Integrated with diagnostic results
   - Medical professional dashboard

## Building for Production

### Build the Desktop Application

```powershell
npm run tauri:build
```

This will:
1. Build the Next.js app as static files (`npm run build`)
2. Compile the Rust backend
3. Package everything into a Windows installer

Build artifacts will be located in:
```
src-tauri/target/release/
├── djaja-diagnostics.exe          # Standalone executable
└── bundle/
    └── msi/
        └── Djaja - Diagnostics as a Service_0.1.0_x64_en-US.msi
```

### Installation Package

The MSI installer includes:
- The application executable
- All required dependencies
- Desktop shortcuts
- Start menu entries
- Uninstaller

## Serial Port Configuration

### Supported Configurations

- **Baud Rates**: 300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600
- **Data Bits**: 5, 6, 7, 8
- **Stop Bits**: 1, 2
- **Parity**: None, Odd, Even

### Default Configuration

```
Baud Rate: 9600
Data Bits: 8
Stop Bits: 1
Parity: None
```

### Connecting IoT Devices

1. Connect your medical IoT device to a USB or serial port
2. Open the **Device Simulator** page
3. Click on **Serial Port Configuration**
4. Select your device from the dropdown
5. Configure connection parameters if needed
6. Click **Connect**

### Data Format

The application expects JSON-formatted data from serial devices:

```json
{
  "deviceId": "BP-001",
  "bloodPressure": {
    "systolic": 120,
    "diastolic": 80
  },
  "heartRate": 72,
  "spO2": 98,
  "temperature": 36.5,
  "timestamp": "2025-11-22T10:30:00Z"
}
```

## API Integration

### Backend Server

The desktop app communicates with the backend server for:
- Patient data management
- Diagnostic analysis (AI/ML)
- Data storage and retrieval
- Teleconsultation services

Configure the API URL in your environment:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000
```

### Starting the Backend Server

```powershell
cd server
npm install
npm run dev
```

## Troubleshooting

### Common Issues

1. **Rust compilation errors**
   - Ensure Visual Studio Build Tools are installed
   - Update Rust: `rustup update`

2. **Serial port access denied**
   - Close other applications using the COM port
   - Run the app as Administrator
   - Check device drivers are installed

3. **Next.js build errors**
   - Clear the build cache: `rm -rf .next out`
   - Reinstall dependencies: `npm install`

4. **Tauri window doesn't appear**
   - Check if port 3000 is available
   - Verify `beforeDevCommand` in `tauri.conf.json`

### Debug Logs

Enable debug logging in development:
- Open DevTools: Right-click → Inspect Element (Development mode only)
- Check console for Tauri API calls
- Rust logs appear in the terminal running `tauri:dev`

## Distribution

### Creating an Installer

The build process automatically creates an MSI installer for Windows distribution.

To customize the installer:
1. Edit `src-tauri/tauri.conf.json`
2. Modify the `bundle` section
3. Add custom icons in `src-tauri/icons/`

### Code Signing (Optional)

For production deployment, sign your executable:

```json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": "YOUR_CERT_THUMBPRINT",
      "digestAlgorithm": "sha256",
      "timestampUrl": "http://timestamp.digicert.com"
    }
  }
}
```

## Security Considerations

1. **Serial Port Access**: Only granted to explicitly opened ports
2. **API Communication**: Use HTTPS in production
3. **Data Privacy**: Patient data encrypted in transit
4. **Content Security Policy**: Configured in `tauri.conf.json`

## Updates

To update Tauri or dependencies:

```powershell
# Update Node.js packages
npm update

# Update Rust packages
cd src-tauri
cargo update
```

## Support

For issues or questions:
- Check documentation at: https://tauri.app/
- Review project issues on GitHub
- Contact the development team

## License

Djaja - Diagnostics as a Service
Copyright © 2025 Djaja Team
