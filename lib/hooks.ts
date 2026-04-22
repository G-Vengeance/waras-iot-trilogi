import { useEffect, useState } from 'react';
import { ref, onValue, update, set, DatabaseReference } from 'firebase/database';
import { database } from './firebase';
import { SensorData, SystemControl, HistoricalDataPoint, ControlMode, ActuatorState } from './types';

/**
 * Hook Sensor Data
 */
export function useSensorData() {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sensorRef = ref(database, 'sensors/current');
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      setLoading(false);
      if (snapshot.exists()) {
        setSensorData(snapshot.val() as SensorData);
        setError(null);
      } else {
        setError('Data sensor belum tersedia');
      }
    }, (err) => {
      setLoading(false);
      setError(err.message);
    });
    return () => unsubscribe();
  }, []);

  return { sensorData, loading, error };
}

/**
 * Hook Historical Data - Optimasi Sorting
 */
export function useHistoricalData(limit: number = 50) {
  const [historyData, setHistoryData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const historyRef = ref(database, 'sensors/history');
    const unsubscribe = onValue(historyRef, (snapshot) => {
      setLoading(false);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const dataArray: HistoricalDataPoint[] = Object.values(data);
        const sorted = dataArray
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, limit)
          .reverse(); 
        setHistoryData(sorted);
      }
    });
    return () => unsubscribe();
  }, [limit]);

  return { historyData, loading };
}

/**
 * Hook System Control - Sinkronisasi dengan ESP32 ("otomatis")
 */
export function useSystemControl() {
  const [control, setControl] = useState<SystemControl | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const controlRef = ref(database, 'control');
    const unsubscribe = onValue(controlRef, (snapshot) => {
      setLoading(false);
      if (snapshot.exists()) {
        setControl(snapshot.val() as SystemControl);
      } else {
        const defaultControl: SystemControl = {
          mode: 'manual', // Default ke manual
          actuators: { feeder: false, pelontar: false }
        };
        set(controlRef, defaultControl);
        setControl(defaultControl);
      }
    });
    return () => unsubscribe();
  }, []);

  const updateMode = async (mode: ControlMode) => {
    setUpdating(true);
    try {
      await update(ref(database, 'control'), { mode });
    } catch (err) {
      console.error('Gagal update mode:', err);
    } finally {
      setUpdating(false);
    }
  };

  const toggleActuator = async (actuator: keyof ActuatorState) => {
    if (control?.actuators) {
      setUpdating(true);
      try {
        const newState = !control.actuators[actuator];
        await set(ref(database, `control/actuators/${actuator}`), newState);
      } catch (err) {
        console.error('Gagal update aktuator:', err);
      } finally {
        setUpdating(false);
      }
    }
  };

  return { control, loading, updating, updateMode, toggleActuator };
}

/**
 *
 */
export function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  useEffect(() => {
    // 1. Ambil data timestamp terakhir dari ESP32
    const statusRef = ref(database, 'lastUpdated');

    const unsubscribe = onValue(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        const timestamp = snapshot.val() as number;
        setLastUpdate(timestamp);
      }
    });

    // 2. HEARTBEAT CHECKER 
    const interval = setInterval(() => {
      if (lastUpdate) {
        const now = Date.now();
        const diff = now - lastUpdate;
        
        setIsConnected(diff < 30000); 
      } else {
        setIsConnected(false);
      }
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [lastUpdate]); // Re-run checker lastUpdate

  return { isConnected, lastUpdate };
}