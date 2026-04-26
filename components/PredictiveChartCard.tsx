import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { HistoricalDataPoint } from '@/lib/types';
import { getChartDataWithPrediction } from '@/lib/predictive'; // Import rumus dari file baru tadi

interface PredictiveChartProps {
  data: HistoricalDataPoint[];
}

export default function PredictiveChartCard({ data }: PredictiveChartProps) {
  // Slider Controls
  const [analyzePoints, setAnalyzePoints] = useState(20); // Default baca 20 data ke belakang
  const [predictMinutes, setPredictMinutes] = useState(60); // Default tebak 60 menit ke depan

  // Jalankan rumus hanya saat data atau slider berubah
  const chartData = useMemo(() => {
    const predictCount = Math.ceil(predictMinutes / 5); // Bagi 5 karena data masuk tiap 5 mnt
    return getChartDataWithPrediction(data, ['ph', 'do'], analyzePoints, predictCount);
  }, [data, analyzePoints, predictMinutes]);

  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Tooltip Glassmorphism yang Tuan Muda suka
  const PredictiveTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pointData = payload[0].payload;
      return (
        <div 
          className="p-5 rounded-2xl z-50 transition-all duration-300 dark:bg-slate-900/60"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.55)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: pointData.isPrediction ? '2px solid rgba(239, 68, 68, 0.8)' : '2px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15)'
          }}
        >
          <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-300 uppercase mb-3 tracking-widest border-b border-slate-300/50 pb-2 flex items-center justify-between">
            {new Date(pointData.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            {pointData.isPrediction && <span className="text-red-500 ml-3 bg-red-100 px-2 py-0.5 rounded-full text-[9px]">PREDIKSI</span>}
          </p>
          
          {/* Tampilkan pH */}
          {(pointData.ph_actual || pointData.ph_predicted) && (
             <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-md border border-white/50" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  pH: <span className="text-black dark:text-white text-base ml-1">{(pointData.ph_actual || pointData.ph_predicted).toFixed(2)}</span>
                </p>
             </div>
          )}
          
          {/* Tampilkan DO */}
          {(pointData.do_actual || pointData.do_predicted) && (
             <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-md border border-white/50" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  DO: <span className="text-black dark:text-white text-base ml-1">{(pointData.do_actual || pointData.do_predicted).toFixed(2)} mg/L</span>
                </p>
             </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-lg border border-indigo-100 dark:border-indigo-900/50 p-6">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            AI Predictive Analysis
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1"></p>
        </div>

        {/* Panel Kendali Slider */}
        <div className="flex flex-col sm:flex-row gap-6 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Analisis Data Lalu: <span className="text-indigo-600">{analyzePoints} Titik</span>
            </label>
            <input 
              type="range" min="5" max="50" step="5"
              value={analyzePoints} onChange={(e) => setAnalyzePoints(Number(e.target.value))}
              className="accent-indigo-600 w-32"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Prediksi Masa Depan: <span className="text-emerald-600">{predictMinutes} Menit</span>
            </label>
            <input 
              type="range" min="15" max="120" step="15"
              value={predictMinutes} onChange={(e) => setPredictMinutes(Number(e.target.value))}
              className="accent-emerald-600 w-32"
            />
          </div>
        </div>
      </div>

      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.4} />
            <XAxis dataKey="timestamp" tickFormatter={formatXAxis} tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" domain={['auto', 'auto']} width={60}/>
            <Tooltip content={<PredictiveTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
            
            {/* Garis Batas Kritis DO */}
            <ReferenceLine y={4.0} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Batas Kritis DO (4.0)', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />

            {/* Garis Masa Lalu (Solid) */}
            <Line type="monotone" name="pH Historis" dataKey="ph_actual" stroke="#3b82f6" strokeWidth={3} dot={false} />
            <Line type="monotone" name="DO Historis" dataKey="do_actual" stroke="#10b981" strokeWidth={3} dot={false} />

            {/* Garis Masa Depan (Dashed / Putus-putus) */}
            <Line type="monotone" name="Prediksi pH" dataKey="ph_predicted" stroke="#3b82f6" strokeWidth={3} strokeDasharray="6 6" dot={false} />
            <Line type="monotone" name="Prediksi DO" dataKey="do_predicted" stroke="#10b981" strokeWidth={3} strokeDasharray="6 6" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
    </div>
  );
}