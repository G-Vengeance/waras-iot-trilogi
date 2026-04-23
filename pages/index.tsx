import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Activity, Droplets, Wind, Thermometer, User as UserIcon } from 'lucide-react';
import StatCard from '@/components/StatCard';
import ChartCard from '@/components/ChartCard';
import ControlPanel from '@/components/ControlPanel';
import StatusBadge from '@/components/StatusBadge';
import PredictiveChartCard from '@/components/PredictiveChartCard';
import UserProfileModal from '@/components/UserProfileModal'; // 👇 Import Modal Profil
import {
  useSensorData,
  useHistoricalData,
  useSystemControl,
  useConnectionStatus,
  useAuth // 👇 Import Hook Auth
} from '@/lib/hooks';

export default function Dashboard() {
  const { sensorData, loading: sensorLoading, error } = useSensorData();
  const { historyData, loading: historyLoading } = useHistoricalData(50);
  const { control, loading: controlLoading, updateMode, toggleActuator } = useSystemControl();
  const { isConnected, lastUpdate } = useConnectionStatus();

  // 👇 Ambil data user & siapkan state untuk Modal Profil 👇
  const { user } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const isLoading = sensorLoading || controlLoading;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formatLastUpdate = (timestamp: number) => {
    const date = new Date(timestamp);
    const tgl = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const jam = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');
    return `${tgl} - ${jam}`;
  };

  return (
    <>
      <Head>
        <title>WARAS - Dashboard IoT Monitoring</title>
        <meta name="description" content="Sistem monitoring IoT untuk kualitas air berbasis ESP32" />
        <link rel="icon" href="/logo-dark2.png" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-50/90 to-white/90 dark:from-slate-800/90 dark:to-slate-900/90 backdrop-blur-md shadow-sm border-b border-indigo-100 dark:border-indigo-900/50 sticky top-0 z-40 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              
              <div className="flex items-center gap-2">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <img 
                    src="/logo-light.png" 
                    alt="Logo WARAS" 
                    className="absolute inset-0 w-full h-full object-contain drop-shadow-md rounded-lg transition-opacity duration-500 ease-in-out opacity-100 dark:opacity-0"
                  />
                  <img 
                    src="/logo-dark2.png" 
                    alt="Logo WARAS" 
                    className="absolute inset-0 w-full h-full object-contain drop-shadow-md rounded-lg transition-opacity duration-500 ease-in-out opacity-0 dark:opacity-100"
                  />
                </div>

                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    WARAS Dashboard
                  </h1>
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    Sistem Monitoring Kualitas Air Real-time
                  </p>
                </div>
              </div>

              {/* 👇 Status Badge & Tombol Profil User 👇 */}
              <div className="flex items-center gap-4">
                {isMounted && <StatusBadge isConnected={isConnected} lastUpdate={lastUpdate} />}
                
                {/* Tombol hanya muncul kalau Tuan Muda sudah Login */}
                {user && (
                  <button 
                    onClick={() => setIsProfileModalOpen(true)}
                    className="flex items-center gap-2 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-600 shadow-sm transition-all"
                  >
                    <img 
                      src={user.photoURL || "https://api.dicebear.com/7.x/bottts/svg?seed=Felix&backgroundColor=b6e3f4"} 
                      alt="Avatar" 
                      className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 dark:border-slate-500"
                    />
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200 hidden sm:block">
                      {user.displayName || 'Operator'}
                    </span>
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4 shadow-sm">
              <p className="text-red-800 dark:text-red-300 text-sm font-bold">
                Error: <span className="font-medium">{error}</span>
              </p>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="pH Level"
              value={sensorData?.ph ?? 0}
              unit="pH"
              icon={Droplets}
              color="blue"
              minSafe={6.5} 
              maxSafe={8.5} 
              subtitle="Ideal: 6.5 - 8.5 pH"
            />
            <StatCard
              title="Dissolved Oxygen"
              value={sensorData?.do ?? 0}
              unit="mg/L"
              icon={Wind}
              color="green"
              minSafe={4.0} 
              subtitle="Minimal: 4.0 mg/L"
            />
            <StatCard
              title="Temperature"
              value={sensorData?.temperature ?? 0}
              unit="°C"
              icon={Thermometer}
              color="orange"
              minSafe={26.0} 
              maxSafe={30.0} 
              subtitle="Ideal: 26 - 30 °C"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 space-y-6">
              <ChartCard
                title="Grafik pH & DO"
                data={historyData}
                dataKeys={[
                  { key: 'ph', name: 'pH Level', color: '#3b82f6' },
                  { key: 'do', name: 'DO (mg/L)', color: '#10b981' },
                ]}
              />
              <ChartCard
                title="Grafik Suhu"
                data={historyData}
                dataKeys={[
                  { key: 'temperature', name: 'Suhu (°C)', color: '#f59e0b' },
                ]}
              />
              <PredictiveChartCard data={historyData} />
            </div>

            <div className="lg:col-span-1">
              {control && (
                <ControlPanel
                  mode={control.mode}
                  actuators={control.actuators}
                  onModeChange={updateMode}
                  onActuatorToggle={toggleActuator}
                  disabled={!isConnected}
                />
              )}
            </div>
          </div>

          {/* Footer Status */}
          <div className="bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-lg border border-indigo-100 dark:border-indigo-900/50 p-6 transition-all duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Total Data Points</p>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{historyData.length}</p>
              </div>
              <div className="border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 pt-4 md:pt-0">
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Last Update</p>
                <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">
                  {isMounted && sensorData?.timestamp ? formatLastUpdate(sensorData.timestamp) : '-'}
                </p>
              </div>
              <div className="border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 pt-4 md:pt-0">
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400">System Status</p>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
                  {isConnected ? '🟢 Online' : '🔴 Terputus'}
                </p>
              </div>
            </div>
          </div>
          
        </div>
      </main>

      {/* 👇 Panggil Modal Profil di luar <main> 👇 */}
      <UserProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        user={user} 
      />
    </>
  );
}