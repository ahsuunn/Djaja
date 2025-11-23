mod serial;
mod server;

use serial::SerialManager;
use server::ServerState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(SerialManager::new())
    .manage(ServerState::new())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      
      // Auto-start backend server when app launches
      let handle = app.handle().clone();
      tauri::async_runtime::spawn(async move {
        // Wait a bit for the app to initialize
        tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
        
        match server::start_backend_server_internal(handle.clone()) {
          Ok(msg) => println!("✅ {}", msg),
          Err(e) => eprintln!("❌ Failed to auto-start server: {}", e),
        }
      });
      
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      serial::list_serial_ports,
      serial::open_serial_port,
      serial::close_serial_port,
      serial::write_serial_data,
      serial::read_serial_data,
      serial::get_available_baud_rates,
      server::start_backend_server,
      server::stop_backend_server,
      server::get_server_status,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
