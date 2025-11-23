# Building Standalone Desktop Application

## Prerequisites for Building

1. **Node.js 18+** installed
2. **Rust toolchain** installed (for Tauri)
3. **MongoDB Atlas account** (free tier works)

## Setup Steps

### 1. Configure Production Database

Before building, copy the example config and add your MongoDB Atlas credentials:

````bash
cd server
cp config.example.json config.json
````

Edit `server/config.json`:
````json
{
  "mongoUri": "mongodb+srv://your-username:your-password@your-cluster.mongodb.net/djaja?retryWrites=true&w=majority",
  "jwtSecret": "your-secure-jwt-secret-here-minimum-32-characters",
  "port": 5000
}
````

**⚠️ Important**: 
- Never commit `server/config.json` to git (it's in `.gitignore`)
- Use a strong, unique JWT secret for production
- Ensure MongoDB Atlas allows connections from anywhere (0.0.0.0/0) or specific IPs

### 2. Build the Server

````bash
cd server
npm install
npm run build
````

This compiles TypeScript to JavaScript in `server/dist/`

### 3. Build the Desktop Application

````bash
cd ..
npm run tauri build
````

This will:
- Build the Next.js frontend
- Build the TypeScript server backend
- Bundle everything into a standalone executable
- Output to `src-tauri/target/release/bundle/`

### 4. Distribution

The standalone executable can be found at:
- **Windows**: `src-tauri/target/release/bundle/msi/Djaja - Diagnostics as a Service_0.1.0_x64_en-US.msi`
- **Windows (NSIS)**: `src-tauri/target/release/bundle/nsis/Djaja - Diagnostics as a Service_0.1.0_x64-setup.exe`

## What's Included in the Standalone Build

✅ **Bundled Resources**:
- Next.js frontend (compiled)
- Express backend server (compiled from TypeScript)
- All Node.js dependencies
- MongoDB connection configuration
- JWT authentication secrets

✅ **Auto-Start Features**:
- Backend server starts automatically when app launches
- Connects to MongoDB Atlas (cloud database)
- IndexedDB for offline-first functionality

## System Requirements for End Users

### Required:
- **Windows 10/11 64-bit** (or appropriate OS)
- **Node.js 18+** must be installed
- **Internet connection** (for MongoDB Atlas)

### Not Required:
- MongoDB installation (uses cloud database)
- Git or development tools
- Manual server configuration

## Distribution Checklist

Before sharing the executable:

- [ ] `server/config.json` has production MongoDB Atlas URI
- [ ] JWT secret is strong and unique (not the development one)
- [ ] Test the `.exe` on a clean machine without development tools
- [ ] Verify server starts automatically
- [ ] Test login functionality
- [ ] Test offline mode with IndexedDB caching
- [ ] Include Node.js installation instructions for users

## Troubleshooting

### "Server failed to start"
- Ensure Node.js 18+ is installed on the target machine
- Check MongoDB Atlas connection string is correct
- Verify network allows connections to MongoDB Atlas

### "Cannot connect to database"
- Check MongoDB Atlas allows connections from 0.0.0.0/0
- Verify username/password in `config.json` are correct
- Ensure cluster is running (not paused)

### "Authentication failed"
- Verify JWT secret in `config.json` matches between builds
- Clear browser localStorage and try again
- Check user exists in MongoDB database

## Advanced: Creating Installer

The build process creates installers:
- **MSI Installer**: Standard Windows installer
- **NSIS Installer**: Modern installer with more options

Both are located in `src-tauri/target/release/bundle/`

## Development vs Production

**Development Mode** (`npm run tauri dev`):
- Reads from `.env` files
- Hot reload enabled
- Server runs from TypeScript source
- Development database

**Production Mode** (`npm run tauri build`):
- Reads from `config.json`
- Compiled and optimized
- Server runs from compiled JavaScript
- Production database (MongoDB Atlas)

## Security Notes

🔒 **Keep Secret**:
- `server/config.json` (contains credentials)
- JWT secrets
- MongoDB connection strings

📦 **Safe to Share**:
- Built executables/installers
- `server/config.example.json` (template)
- Documentation files

## Next Steps

After building, test the executable by:
1. Copying to a different computer without development tools
2. Installing (double-click the `.msi` or `.exe`)
3. Ensuring Node.js 18+ is installed
4. Running the application
5. Testing login and all features
