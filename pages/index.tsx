import React from 'react';
import Head from 'next/head';
import { Droplets, Wind, Thermometer, Activity } from 'lucide-react';
import StatCard from '@/components/StatCard';
import ChartCard from '@/components/ChartCard';
import ControlPanel from '@/components/ControlPanel';
import StatusBadge from '@/components/StatusBadge';
import {
  useSensorData,
  useHistoricalData,
  useSystemControl,
  useConnectionStatus,
} from '@/lib/hooks';

export default function Dashboard() {
  const { sensorData, loading: sensorLoading, error } = useSensorData();
  const { historyData, loading: historyLoading } = useHistoricalData(50);
  const { control, loading: controlLoading, updateMode, toggleActuator } = useSystemControl();
  const { isConnected, lastUpdate } = useConnectionStatus();

  const isLoading = sensorLoading || controlLoading;

  return (
    <>
      <Head>
        <title>WARAS - Dashboard IoT Monitoring</title>
        <meta name="description" content="Sistem monitoring IoT untuk kualitas air berbasis ESP32" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Main Background ditambahkan dark:from-gray-900 dark:to-gray-800 */}
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
        
        {/* Header - ditambahkan dark:bg-gray-800 dark:border-gray-700 */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                {/* Text Title ditambahkan dark:text-white */}
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 transition-colors duration-300">
                  <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  WARAS Dashboard
                </h1>
                {/* Subtitle ditambahkan dark:text-gray-400 */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-300">
                  Sistem Monitoring Kualitas Air Real-time
                </p>
              </div>
              <StatusBadge isConnected={isConnected} lastUpdate={lastUpdate} />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error State - Dark Mode Support */}
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-4 transition-colors">
              <p className="text-red-800 dark:text-red-300 text-sm">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          {/* Loading State - Dark Mode Support */}
          {isLoading && (
            <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 transition-colors">
              <div className="text-blue-800 dark:text-blue-300 text-sm flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent" />
                Memuat data dari Firebase...
              </div>
            </div>
          )}

          {/* Sensor Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="pH Level"
              value={sensorData?.ph ?? 0}
              unit="pH"
              icon={Droplets}
              color="blue"
              trend="stable"
              subtitle="Tingkat keasaman air"
            />
            <StatCard
              title="Dissolved Oxygen"
              value={sensorData?.do ?? 0}
              unit="mg/L"
              icon={Wind}
              color="green"
              trend="up"
              subtitle="Oksigen terlarut"
            />
            <StatCard
              title="Temperature"
              value={sensorData?.temperature ?? 0}
              unit="°C"
              icon={Thermometer}
              color="orange"
              trend="stable"
              subtitle="Suhu air"
            />
          </div>

          {/* Charts & Control Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Historical Charts */}
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
            </div>

            {/* Control Panel */}
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

          {/* Footer Info - Dark Mode Support */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-6 transition-colors duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Data Points</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">{historyData.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Last Update</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
                  {sensorData?.timestamp 
                    ? new Date(sensorData.timestamp).toLocaleTimeString('id-ID')
                    : '-'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">System Status</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
                  {isConnected ? '🟢 Online' : '🔴 Offline'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}