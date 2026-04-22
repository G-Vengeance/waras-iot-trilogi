export interface SensorData {
  ph: number;
  do: number;
  temperature: number;
  timestamp: number;
}


export type ControlMode = 'auto' | 'manual' | 'otomatis';

export interface ActuatorState {
  feeder: boolean;
  pelontar: boolean;
}

export interface SystemControl {
  mode: ControlMode;
  actuators: ActuatorState;
}

export interface HistoricalDataPoint {
  timestamp: number;
  ph: number;
  do: number;
  temperature: number;
}

export interface IoTData {
  sensors: {
    current: SensorData;
    history: HistoricalDataPoint[];
  };
  control: SystemControl;
  lastUpdated: number;
}

