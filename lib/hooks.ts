import { useEffect, useState } from 'react';
import { ref, onValue, update, set, query, limitToLast } from 'firebase/database'; // Tambah query & limitToLast
import { database } from './firebase';
import { SensorData, SystemControl, HistoricalDataPoint, ControlMode, ActuatorState } from './types';

/**
 * Hook Sensor Data - (Sudah Aman)
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
 * Hook Historical Data - FIX JALUR BULANAN 🚀
 */
export function useHistoricalData(limitCount: number = 50) {
  const [historyData, setHistoryData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Dapatkan string bulan sekarang (Format: YYYY-MM)
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // 2. Arahkan ref langsung ke sub-folder bulan sekarang
    const historyPath = `sensors/history/${currentMonth}`;
    const historyRef = ref(database, historyPath);

    const unsubscribe = onValue(historyRef, (snapshot) => {
      setLoading(false);
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Ubah object Firebase menjadi array
        const dataArray: HistoricalDataPoint[] = Object.values(data);
        
        // Sorting: Data terbaru di paling kanan grafik
        const sorted = dataArray
          .sort((a, b) => b.timestamp - a.timestamp) // Urutkan terbaru dulu
          .slice(0, limitCount)                     // Ambil sebanyak limit
          .reverse();                                // Balik lagi buat grafik (kiri ke kanan)
          
        setHistoryData(sorted);
      } else {
        // Jika folder bulan ini belum ada (misal baru ganti bulan)
        setHistoryData([]);
      }
    });

    return () => unsubscribe();
  }, [limitCount]);

  return { historyData, loading };
}

/**
 * Hook System Control - (Sudah Aman)
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
          mode: 'manual',
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
 * Hook Connection Status - (Sudah Aman)
 */
export function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  useEffect(() => {
    const statusRef = ref(database, 'lastUpdated');

    const unsubscribe = onValue(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        const timestamp = snapshot.val() as number;
        setLastUpdate(timestamp);
      }
    });

    const interval = setInterval(() => {
      if (lastUpdate) {
        const now = Date.now();
        const diff = now - lastUpdate;
        setIsConnected(diff < 40000); // Dikasih toleransi 40 detik
      } else {
        setIsConnected(false);
      }
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [lastUpdate]);

  return { isConnected, lastUpdate };
}