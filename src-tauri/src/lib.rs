mod serial;

use serial::SerialManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(SerialManager::new())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      serial::list_serial_ports,
      serial::open_serial_port,
      serial::close_serial_port,
      serial::write_serial_data,
      serial::read_serial_data,
      serial::get_available_baud_rates,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
