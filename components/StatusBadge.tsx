import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface StatusBadgeProps {
  isConnected: boolean;
  lastUpdate: number | null;
}

export default function StatusBadge({ isConnected, lastUpdate }: StatusBadgeProps) {
  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Belum ada data';
    
    const date = new Date(lastUpdate);
    
    const waktu = date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    }).replace('.', ':'); 
    
    return `${waktu}`;
  };

  return (
    <div className={`
      inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300
      ${isConnected 
        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50' 
        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50'
      }
    `}>
      {isConnected ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>Terhubung</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Terputus</span>
        </>
      )}
      <span className="text-xs opacity-75 font-normal ml-1">
        • {formatLastUpdate()}
      </span>
    </div>
  );
}
