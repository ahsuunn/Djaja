import { invoke } from '@tauri-apps/api/core';

export interface PortInfo {
  name: string;
  port_type: string;
  description?: string;
}

export interface SerialConfig {
  baud_rate: number;
  data_bits: number;
  stop_bits: number;
  parity: 'none' | 'odd' | 'even';
}

export class SerialPortManager {
  /**
   * List all available serial ports
   */
  static async listPorts(): Promise<PortInfo[]> {
    try {
      return await invoke<PortInfo[]>('list_serial_ports');
    } catch (error) {
      console.error('Failed to list serial ports:', error);
      throw error;
    }
  }

  /**
   * Open a serial port with the specified configuration
   */
  static async openPort(portName: string, config: SerialConfig): Promise<string> {
    try {
      return await invoke<string>('open_serial_port', {
        portName,
        config,
      });
    } catch (error) {
      console.error('Failed to open serial port:', error);
      throw error;
    }
  }

  /**
   * Close a serial port
   */
  static async closePort(portName: string): Promise<string> {
    try {
      return await invoke<string>('close_serial_port', { portName });
    } catch (error) {
      console.error('Failed to close serial port:', error);
      throw error;
    }
  }

  /**
   * Write data to a serial port
   */
  static async writeData(portName: string, data: string): Promise<number> {
    try {
      return await invoke<number>('write_serial_data', {
        portName,
        data,
      });
    } catch (error) {
      console.error('Failed to write to serial port:', error);
      throw error;
    }
  }

  /**
   * Read data from a serial port
   */
  static async readData(portName: string, bufferSize: number = 1024): Promise<string> {
    try {
      return await invoke<string>('read_serial_data', {
        portName,
        bufferSize,
      });
    } catch (error) {
      console.error('Failed to read from serial port:', error);
      throw error;
    }
  }

  /**
   * Get list of available baud rates
   */
  static async getAvailableBaudRates(): Promise<number[]> {
    try {
      return await invoke<number[]>('get_available_baud_rates');
    } catch (error) {
      console.error('Failed to get available baud rates:', error);
      throw error;
    }
  }
}

/**
 * Check if the app is running in Tauri environment
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}
