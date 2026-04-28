import React from 'react';
import { History, Loader2 } from 'lucide-react';
import { useActivityLog } from '@/lib/hooks';

export default function ActivityLogCard() {
  const { activityLog, loading } = useActivityLog(5); // Ambil 5 log terbaru

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-lg border border-indigo-100 dark:border-indigo-900/50 p-6 transition-all duration-300">
      <div className="flex items-center gap-2 mb-6">
        <History className="w-5 h-5 text-gray-900 dark:text-white transition-colors" />
        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight transition-colors">Log Aktivitas Terbaru</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Memuat log...
        </div>
      ) : activityLog.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-gray-300 dark:border-slate-600">
          <p className="text-sm font-medium">Belum ada aktivitas tercatat.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {activityLog.map((log, index) => (
            <li key={index} className="flex items-start gap-3 p-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg border border-gray-100 dark:border-slate-700 shadow-sm">
              <div className="flex-shrink-0 mt-0.5">
                {log.action.includes('Mode') && (
                  <span className="text-indigo-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </span>
                )}
                {log.action.includes('diubah menjadi ON') && (
                  <span className="text-emerald-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </span>
                )}
                {log.action.includes('diubah menjadi OFF') && (
                  <span className="text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                  {log.action}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate">
                  Oleh: {log.userEmail} pada {formatTimestamp(log.timestamp)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}