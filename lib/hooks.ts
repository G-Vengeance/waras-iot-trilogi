import { useEffect, useState } from 'react';
import { ref, onValue, update, set, query, limitToLast, get, push } from 'firebase/database';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { database } from './firebase'; 
import { SensorData, SystemControl, HistoricalDataPoint, ControlMode, ActuatorState } from './types';
import { logEvent } from 'firebase/analytics';
import { analytics, auth as firebaseAuth } from './firebase'; // Import auth juga

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
          .sort((a, b) => a.timestamp - b.timestamp); 
          
        setHistoryData(sorted);
      } else {
        setHistoryData([]);
      }
    });

    return () => unsubscribe();
  }, [limitCount]);

  return { historyData, loading };
}

// 👇 DAFTAR EMAIL MASTER (Admin yang Bebas Kuota) 👇
const MASTER_EMAILS = [
  "pratamagerrio@gmail.com",
  "warasiottrilogi@gmail.com"
];

/**
 * Interface untuk entri Log Aktivitas
 */
export interface ActivityLogEntry {
  timestamp: number;
  userEmail: string | null;
  action: string;
  details?: string;
}

/**
 * Fungsi untuk mencatat aktivitas ke Firebase Realtime Database
 */
async function logActivity(action: string, details?: string) {
  const user = firebaseAuth.currentUser;
  const logRef = ref(database, 'activity_log');
  await push(logRef, {
    timestamp: Date.now(),
    userEmail: user ? user.email : 'Guest',
    action,
    details,
  });
}

/**
 * Hook System Control - DENGAN FITUR ROLE & RATE LIMIT 🛡️
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
      await update(ref(database, 'control'), { mode }); // Update mode di Firebase
      
      // Catat aktivitas ke log
      await logActivity(`Mode operasi diubah menjadi ${mode}`);

      if (analytics) {
        logEvent(analytics, 'mode_changed', { new_mode: mode }); // Log ke Analytics
      }
      
    } catch (err) {
      console.error('Gagal update mode:', err);
    } finally {
      setUpdating(false);
    }
  };

  // 👇 Fungsi Toggle yang sudah diperketat dengan Sistem Kuota 👇
  const toggleActuator = async (actuator: keyof ActuatorState): Promise<{success: boolean, message?: string}> => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    // 1. Cek Login
    if (!user) return { success: false, message: "Akses ditolak. Silakan login." };

    // 2. Cek Jabatan (Master atau Publik)
    const isMaster = MASTER_EMAILS.includes(user.email || '');

    // 3. JIKA BUKAN MASTER, CEK KUOTA (RATE LIMIT: 2x per 2 Jam)
    if (!isMaster) {
      setUpdating(true);
      const limitRef = ref(database, `rate_limit/${user.uid}`);
      const snapshot = await get(limitRef);
      const now = Date.now();
      const twoHoursAgo = now - (2 * 60 * 60 * 1000); // Waktu 2 jam yang lalu dalam milidetik

      let validClicks: number[] = [];
      if (snapshot.exists()) {
        const clicks = snapshot.val() as number[];
        // Buang riwayat klik yang sudah lebih dari 2 jam
        validClicks = clicks.filter(time => time > twoHoursAgo);
      }

      // Jika dalam 2 jam terakhir sudah klik 2 kali atau lebih, Blokir!
      if (validClicks.length >= 2) {
        setUpdating(false);
        return { success: false, message: "⏳ Kuota Habis! Anda hanya diizinkan mengontrol 2 kali per 2 jam." };
      }

      // Jika kuota masih ada, catat waktu klik saat ini ke Firebase
      validClicks.push(now);
      await set(limitRef, validClicks);
    }

    // 4. EKSEKUSI PERINTAH KE HARDWARE (JIKA LOLOS CEKALAN)
    if (control?.actuators) {
      setUpdating(true);
      try {
        const newState = !control.actuators[actuator];
        await set(ref(database, `control/actuators/${actuator}`), newState);

        // Catat aktivitas ke log
        await logActivity(`${actuator} diubah menjadi ${newState ? 'ON' : 'OFF'}`);
        
        // 👇 FIX: FIREBASE ANALYTICS DITANAM DI SINI 👇
        if (analytics) {
          logEvent(analytics, 'actuator_used', {
            actuator_name: actuator,           // Mencatat 'feeder' atau 'pelontar' ke Analytics
            action: newState ? 'ON' : 'OFF',   // Mencatat apakah dihidupkan/dimatikan
            user_email: user.email,            // Siapa pelakunya
            user_role: isMaster ? 'Master' : 'Publik' 
          });
        }
        
        return { success: true };
      } catch (err) {
        console.error('Gagal update aktuator:', err);
        return { success: false, message: "Gagal menyambung ke server database." };
      } finally {
        setUpdating(false);
      }
    }
    return { success: false, message: "Sistem belum siap." };
  };

  return { control, loading, updating, updateMode, toggleActuator };
}

/**
 * Hook Activity Log - Mengambil log aktivitas terbaru
 */
export function useActivityLog(limitCount: number = 10) {
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const logRef = query(
      ref(database, 'activity_log'),
      limitToLast(limitCount) // Ambil N entri log terbaru
    );

    const unsubscribe = onValue(logRef, (snapshot) => {
      setLoading(false);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const dataArray: ActivityLogEntry[] = Object.values(data);
        setActivityLog(dataArray.sort((a, b) => b.timestamp - a.timestamp)); // Urutkan dari terbaru
      } else {
        setActivityLog([]);
      }
    });
    return () => unsubscribe();
  }, [limitCount]);

  return { activityLog, loading };
}

/**
 * Hook Connection Status - MONITORING LANGSUNG KE DATA SENSOR 🛡️
 */
export function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  useEffect(() => {
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
        
        // Toleransi 1 menit (60000ms) untuk menentukan status Offline/Online
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
    const auth = getAuth(); 
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  return { user, authLoading };
}