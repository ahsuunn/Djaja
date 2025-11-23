use tauri::Manager;
use std::process::{Command, Child};
use std::sync::Mutex;

pub struct ServerState {
    pub(crate) process: Mutex<Option<Child>>,
}

#[tauri::command]
pub fn start_backend_server(app_handle: tauri::AppHandle) -> Result<String, String> {
    let resource_path = app_handle.path()
        .resource_dir()
        .expect("failed to resolve resource directory");
    
    let server_path = resource_path.join("server");
    
    let child = Command::new("node")
        .arg("dist/server.js")
        .current_dir(server_path)
        .spawn()
        .map_err(|e| format!("Failed to start server: {}", e))?;
    
    let state: tauri::State<ServerState> = app_handle.state();
    *state.process.lock().unwrap() = Some(child);
    
    Ok("Server started successfully".to_string())
}

#[tauri::command]
pub fn stop_backend_server(app_handle: tauri::AppHandle) -> Result<String, String> {
    let state: tauri::State<ServerState> = app_handle.state();
    let mut process = state.process.lock().unwrap();
    
    if let Some(mut child) = process.take() {
        child.kill().map_err(|e| format!("Failed to stop server: {}", e))?;
        Ok("Server stopped successfully".to_string())
    } else {
        Ok("Server was not running".to_string())
    }
}