// Types untuk sensor data
export interface SensorData {
  ph: number;
  do: number;
  temperature: number;
  timestamp: number;
}

// Types untuk control mode
export type ControlMode = 'auto' | 'manual' | 'otomatis';

// Types untuk actuator state
export interface ActuatorState {
  feeder: boolean;
  pelontar: boolean;
}

// Types untuk system control
export interface SystemControl {
  mode: ControlMode;
  actuators: ActuatorState;
}

// Types untuk historical data
export interface HistoricalDataPoint {
  timestamp: number;
  ph: number;
  do: number;
  temperature: number;
}

// Complete IoT data structure in Firebase
export interface IoTData {
  sensors: {
    current: SensorData;
    history: HistoricalDataPoint[];
  };
  control: SystemControl;
  lastUpdated: number;
}
