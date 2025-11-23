use serde::{Deserialize, Serialize};
use serialport::{SerialPort, SerialPortType};
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::Duration;
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct PortInfo {
    pub name: String,
    pub port_type: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SerialConfig {
    pub baud_rate: u32,
    pub data_bits: u8,
    pub stop_bits: u8,
    pub parity: String,
}

pub struct SerialManager {
    ports: Mutex<HashMap<String, Box<dyn SerialPort>>>,
}

impl SerialManager {
    pub fn new() -> Self {
        SerialManager {
            ports: Mutex::new(HashMap::new()),
        }
    }
}

#[tauri::command]
pub fn list_serial_ports() -> Result<Vec<PortInfo>, String> {
    let ports = serialport::available_ports().map_err(|e| e.to_string())?;
    
    let port_infos: Vec<PortInfo> = ports
        .iter()
        .map(|port| {
            let port_type = match &port.port_type {
                SerialPortType::UsbPort(_) => "USB".to_string(),
                SerialPortType::BluetoothPort => "Bluetooth".to_string(),
                SerialPortType::PciPort => "PCI".to_string(),
                SerialPortType::Unknown => "Unknown".to_string(),
            };
            
            PortInfo {
                name: port.port_name.clone(),
                port_type,
                description: match &port.port_type {
                    SerialPortType::UsbPort(info) => Some(format!(
                        "USB Device - Manufacturer: {:?}",
                        info.manufacturer.as_ref().unwrap_or(&"Unknown".to_string())
                    )),
                    _ => None,
                },
            }
        })
        .collect();
    
    Ok(port_infos)
}

#[tauri::command]
pub fn open_serial_port(
    port_name: String,
    config: SerialConfig,
    manager: State<SerialManager>,
) -> Result<String, String> {
    let mut ports = manager.ports.lock().map_err(|e| e.to_string())?;
    
    // Check if port is already open
    if ports.contains_key(&port_name) {
        return Err("Port is already open".to_string());
    }
    
    let parity = match config.parity.as_str() {
        "none" => serialport::Parity::None,
        "odd" => serialport::Parity::Odd,
        "even" => serialport::Parity::Even,
        _ => serialport::Parity::None,
    };
    
    let stop_bits = match config.stop_bits {
        1 => serialport::StopBits::One,
        2 => serialport::StopBits::Two,
        _ => serialport::StopBits::One,
    };
    
    let data_bits = match config.data_bits {
        5 => serialport::DataBits::Five,
        6 => serialport::DataBits::Six,
        7 => serialport::DataBits::Seven,
        8 => serialport::DataBits::Eight,
        _ => serialport::DataBits::Eight,
    };
    
    let port = serialport::new(&port_name, config.baud_rate)
        .timeout(Duration::from_millis(100))
        .data_bits(data_bits)
        .stop_bits(stop_bits)
        .parity(parity)
        .open()
        .map_err(|e| format!("Failed to open port: {}", e))?;
    
    ports.insert(port_name.clone(), port);
    
    Ok(format!("Port {} opened successfully", port_name))
}

#[tauri::command]
pub fn close_serial_port(
    port_name: String,
    manager: State<SerialManager>,
) -> Result<String, String> {
    let mut ports = manager.ports.lock().map_err(|e| e.to_string())?;
    
    if ports.remove(&port_name).is_some() {
        Ok(format!("Port {} closed successfully", port_name))
    } else {
        Err("Port not found or already closed".to_string())
    }
}

#[tauri::command]
pub fn write_serial_data(
    port_name: String,
    data: String,
    manager: State<SerialManager>,
) -> Result<usize, String> {
    let mut ports = manager.ports.lock().map_err(|e| e.to_string())?;
    
    let port = ports
        .get_mut(&port_name)
        .ok_or_else(|| "Port not open".to_string())?;
    
    let bytes = data.as_bytes();
    let written = port
        .write(bytes)
        .map_err(|e| format!("Failed to write to port: {}", e))?;
    
    port.flush()
        .map_err(|e| format!("Failed to flush port: {}", e))?;
    
    Ok(written)
}

#[tauri::command]
pub fn read_serial_data(
    port_name: String,
    buffer_size: usize,
    manager: State<SerialManager>,
) -> Result<String, String> {
    let mut ports = manager.ports.lock().map_err(|e| e.to_string())?;
    
    let port = ports
        .get_mut(&port_name)
        .ok_or_else(|| "Port not open".to_string())?;
    
    let mut buffer = vec![0u8; buffer_size];
    
    match port.read(&mut buffer) {
        Ok(bytes_read) => {
            let data = String::from_utf8_lossy(&buffer[..bytes_read]).to_string();
            Ok(data)
        }
        Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => {
            Ok(String::new()) // No data available
        }
        Err(e) => Err(format!("Failed to read from port: {}", e)),
    }
}

#[tauri::command]
pub fn get_available_baud_rates() -> Vec<u32> {
    vec![
        300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600,
    ]
}
