import React, { useEffect, useState, useRef } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
  minSafe?: number; // Tambahan parameter batas aman bawah
  maxSafe?: number; // Tambahan parameter batas aman atas
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

  // --- LOGIKA CEK BAHAYA (Sangat Halus) ---
  const isDanger = (minSafe !== undefined && currentValue < minSafe) || (maxSafe !== undefined && currentValue > maxSafe);

  useEffect(() => {
    // 1. BLOKIR KEDIP AWAL
    if (lastMeaningfulValue.current === null || (lastMeaningfulValue.current === 0 && currentValue !== 0)) {
      lastMeaningfulValue.current = currentValue;
      setTrend('stable');
      setTrendText('Stabil (Data Awal)');
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
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 transition-colors duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 transition-colors">{title}</p>
          <div className="flex items-baseline gap-2">
            {/* ANGKA UTAMA DIKEMBALIKAN KE WARNA NORMAL (Tidak ikut merah) */}
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors">
              {displayValue}
            </h3>
            <span className="text-lg font-medium text-gray-500 dark:text-gray-400 transition-colors">{unit}</span>
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 transition-colors">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg border transition-colors duration-300 ${selectedColor}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {/* AREA TREN DINAMIS */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 transition-colors">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {trend === 'up' && (
            <>
              <span className="text-green-600 dark:text-green-400 text-sm">↑</span>
              <span className="text-green-600 dark:text-green-400">{trendText}</span>
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
      </div>
    </div>
  );
}