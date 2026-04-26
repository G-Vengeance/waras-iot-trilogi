import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
// 👇 Tambahan Import untuk Analytics 👇
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const database: Database = getDatabase(app);

// 👇 INISIALISASI ANALYTICS KHUSUS NEXT.JS 👇
let analytics: Analytics | null = null;

// Pastikan Analytics hanya berjalan di sisi Client (Browser), bukan di Server
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => console.error("Analytics gagal dimuat:", err));
}

// Tambahkan 'analytics' ke dalam daftar export
export { app, database, analytics };