import React, { useEffect, useState, useRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
  minSafe?: number; 
  maxSafe?: number; 
}

export default function StatCard({
  title,
  value,
  unit,
  icon: Icon,
  color,
  subtitle,
  minSafe,
  maxSafe,
}: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/50',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/50',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/50',
  };

  const selectedColor = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

  // --- MEMORI INTERNAL STATCARD ---
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [trendText, setTrendText] = useState('Mengumpulkan data...');
  const lastMeaningfulValue = useRef<number | null>(null);

  const currentValue = Number(value);

  // --- LOGIKA CEK BAHAYA ---
  const isDanger = (minSafe !== undefined && currentValue < minSafe) || (maxSafe !== undefined && currentValue > maxSafe);

  useEffect(() => {
    // 1. BLOKIR KEDIP AWAL
    if (lastMeaningfulValue.current === null || (lastMeaningfulValue.current === 0 && currentValue !== 0)) {
      lastMeaningfulValue.current = currentValue;
      setTrend('stable');
      setTrendText('Stabil');
      return; 
    }

    // 2. HITUNG SELISIH DARI ANGKA TERAKHIR YANG BERBEDA
    const diff = currentValue - lastMeaningfulValue.current;

    // Threshold sensitif (0.01)
    if (Math.abs(diff) >= 0.01) {
      if (diff > 0) {
        setTrend('up');
        setTrendText(`Naik ${diff.toFixed(2).replace('.', ',')} ${unit}`);
      } else {
        setTrend('down');
        setTrendText(`Turun ${Math.abs(diff).toFixed(2).replace('.', ',')} ${unit}`);
      }
      lastMeaningfulValue.current = currentValue;
    } 
  }, [currentValue, unit]);

  // --- LOGIKA FORMAT ANGKA ---
  let displayValue = value;
  if (typeof value === 'number') {
    if (unit.includes('°C')) {
      displayValue = value.toFixed(1).replace('.', ','); // Khusus Suhu: 36,5
    } else {
      displayValue = value.toFixed(2); // Untuk DO dan pH: 7.50
    }
  }

  return (
    <div className={`relative bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-lg border p-4 sm:p-6 transition-all duration-300 ${isDanger ? 'border-red-400 shadow-red-100 dark:shadow-red-900/20' : 'border-indigo-100 dark:border-indigo-900/50'}`}>
      
      {/* 👇 PENGATURAN ALIGNMENT AGAR ICON TIDAK MENCONG DI HP 👇 */}
      <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4">
        
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 truncate transition-colors">
            {title}
          </p>
          <div className="flex items-baseline gap-1.5">
            {/* ANGKA UTAMA TETAP NORMAL SESUAI PERMINTAAN TUAN MUDA */}
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white transition-colors">
              {displayValue}
            </h3>
            <span className="text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors">
              {unit}
            </span>
          </div>
        </div>

        {/* 👇 KOTAK ICON ANTI-GEPENG (flex-shrink-0 & w/h yang diatur fix) 👇 */}
        <div className={`flex flex-shrink-0 items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl border transition-colors duration-300 ${selectedColor}`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>

      </div>
      
      {/* AREA TREN DINAMIS & SUBTITLE */}
      <div className="mt-4 pt-3 sm:pt-4 border-t border-gray-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors">
        
        <div className="flex items-center gap-1.5 text-xs font-bold">
          {trend === 'up' && (
            <>
              <span className="text-emerald-600 dark:text-emerald-400 text-sm">↑</span>
              <span className="text-emerald-600 dark:text-emerald-400">{trendText}</span>
            </>
          )}
          {trend === 'down' && (
            <>
              <span className="text-red-600 dark:text-red-400 text-sm">↓</span>
              <span className="text-red-600 dark:text-red-400">{trendText}</span>
            </>
          )}
          {trend === 'stable' && (
            <>
              <span className="text-gray-400 dark:text-gray-500 text-sm">→</span>
              <span className="text-gray-500 dark:text-gray-400">{trendText}</span>
            </>
          )}
        </div>

        {subtitle && (
          <span className="text-[10px] sm:text-xs font-medium text-gray-400 dark:text-gray-500">
            {subtitle}
          </span>
        )}
      </div>

    </div>
  );
}