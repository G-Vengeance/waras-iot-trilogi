import { useEffect, useState } from 'react';
import { ref, onValue, update, set, query, limitToLast } from 'firebase/database';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { database } from './firebase'; // Pastikan database diexport dari file ini
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
 * Hook Historical Data - OPTIMASI QUERY 🚀
 */
export function useHistoricalData(limitCount: number = 50) {
  const [historyData, setHistoryData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Menggunakan Query limitToLast agar tidak narik semua data (Hemat Kuota & Cepat)
    const historyRef = query(
      ref(database, `sensors/history/${currentMonth}`),
      limitToLast(limitCount)
    );

    const unsubscribe = onValue(historyRef, (snapshot) => {
      setLoading(false);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const dataArray: HistoricalDataPoint[] = Object.values(data);
        
        const sorted = dataArray
          .sort((a, b) => a.timestamp - b.timestamp); // Urutkan dari lama ke baru untuk grafik
          
        setHistoryData(sorted);
      } else {
        setHistoryData([]);
      }
    });

    return () => unsubscribe();
  }, [limitCount]);

  return { historyData, loading };
}

/**
 * Hook System Control
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
 * Hook Connection Status - FIX: MONITORING LANGSUNG KE DATA SENSOR 🛡️
 */
export function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  useEffect(() => {
    // Kita intip langsung timestamp di dalam folder sensor utama
    // Jika data sensor ter-update, maka status otomatis Online.
    const statusRef = ref(database, 'sensors/current/timestamp');

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
        
        // Toleransi 1 menit (60000ms) untuk hotspot WiFi.
        setIsConnected(diff < 60000); 
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

/**
 * Hook Auth - Pengecek Status Login Operator
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // getAuth() diambil langsung dari modul firebase/auth
    const auth = getAuth(); 
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  return { user, authLoading };
}