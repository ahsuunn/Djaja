use tauri::Manager;
use std::process::{Command, Child};
use std::sync::Mutex;
use std::path::PathBuf;
use std::env;

pub struct ServerState {
    pub process: Mutex<Option<Child>>,
}

impl ServerState {
    pub fn new() -> Self {
        ServerState {
            process: Mutex::new(None),
        }
    }
}

impl Drop for ServerState {
    fn drop(&mut self) {
        if let Ok(mut process) = self.process.lock() {
            if let Some(child) = process.take() {
                #[cfg(target_os = "windows")]
                {
                    let _ = Command::new("taskkill")
                        .args(["/F", "/T", "/PID", &child.id().to_string()])
                        .spawn();
                }
                
                #[cfg(not(target_os = "windows"))]
                {
                    let _ = child.kill();
                }
                
                println!("🛑 Backend server stopped");
            }
        }
    }
}

fn get_server_path(_app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    // In development, use the server folder from project root
    if cfg!(debug_assertions) {
        // Get the current working directory (will be src-tauri when running via cargo)
        let cwd = env::current_dir()
            .map_err(|e| format!("Failed to get current directory: {}", e))?;
        
        // Check if we're in src-tauri directory, if so go up one level
        let project_root = if cwd.ends_with("src-tauri") {
            cwd.parent()
                .ok_or_else(|| "Failed to get parent directory".to_string())?
                .to_path_buf()
        } else {
            cwd
        };
        
        let server_path = project_root.join("server");
        
        if server_path.exists() {
            println!("✅ Found server directory at: {:?}", server_path);
            Ok(server_path)
        } else {
            Err(format!("Server directory not found at: {:?}. Project root: {:?}", server_path, project_root))
        }
    } else {
        // In production, use bundled resources
        let resource_path = _app_handle.path()
            .resource_dir()
            .map_err(|e| format!("Failed to resolve resource directory: {}", e))?;
        Ok(resource_path.join("server"))
    }
}

pub fn start_backend_server_internal(app_handle: tauri::AppHandle) -> Result<String, String> {
    let state: tauri::State<ServerState> = app_handle.state();
    let mut process_lock = state.process.lock().unwrap();
    
    // Check if server is already running
    if process_lock.is_some() {
        return Ok("Server is already running".to_string());
    }
    
    let server_path = get_server_path(&app_handle)?;
    
    if !server_path.exists() {
        return Err(format!("Server directory not found at: {:?}", server_path));
    }
    
    // Determine which script to run
    let server_script = if cfg!(debug_assertions) {
        // Development: run from src
        "src/server.ts"
    } else {
        // Production: run compiled version
        "dist/server.js"
    };
    
    #[cfg(target_os = "windows")]
    let (node_command, args) = if cfg!(debug_assertions) {
        // Development: use npm.cmd (the .cmd is required on Windows)
        ("npm.cmd", vec!["run", "dev"])
    } else {
        // Production: use node
        ("node", vec![server_script])
    };
    
    #[cfg(not(target_os = "windows"))]
    let (node_command, args) = if cfg!(debug_assertions) {
        ("npm", vec!["run", "dev"])
    } else {
        ("node", vec![server_script])
    };
    
    println!("Starting server from: {:?}", server_path);
    println!("Using command: {} {:?}", node_command, args);
    
    let child = Command::new(node_command)
        .args(&args)
        .current_dir(&server_path)
        .spawn()
        .map_err(|e| format!("Failed to start server: {}. Make sure Node.js is installed.", e))?;
    
    *process_lock = Some(child);
    
    Ok(format!("Server started successfully from {:?}", server_path))
}

#[tauri::command]
pub fn start_backend_server(app_handle: tauri::AppHandle) -> Result<String, String> {
    start_backend_server_internal(app_handle)
}

#[tauri::command]
pub fn stop_backend_server(app_handle: tauri::AppHandle) -> Result<String, String> {
    let state: tauri::State<ServerState> = app_handle.state();
    let mut process = state.process.lock().unwrap();
    
    if let Some(child) = process.take() {
        #[cfg(target_os = "windows")]
        {
            // On Windows, kill the process tree
            let _ = Command::new("taskkill")
                .args(["/F", "/T", "/PID", &child.id().to_string()])
                .spawn();
        }
        
        #[cfg(not(target_os = "windows"))]
        {
            child.kill().map_err(|e| format!("Failed to stop server: {}", e))?;
        }
        
        Ok("Server stopped successfully".to_string())
    } else {
        Ok("Server was not running".to_string())
    }
}

#[tauri::command]
pub fn get_server_status(app_handle: tauri::AppHandle) -> Result<String, String> {
    let state: tauri::State<ServerState> = app_handle.state();
    let process = state.process.lock().unwrap();
    
    if process.is_some() {
        Ok("running".to_string())
    } else {
        Ok("stopped".to_string())
    }
}