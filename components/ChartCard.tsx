import React, { useEffect, useState, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush
} from 'recharts';
import { HistoricalDataPoint } from '@/lib/types';
import { getDatabase, ref, get } from 'firebase/database';

interface ChartCardProps {
  data: HistoricalDataPoint[];
  title: string;
  dataKeys: {
    key: keyof HistoricalDataPoint;
    name: string;
    color: string;
  }[];
}

export default function ChartCard({ data, title, dataKeys }: ChartCardProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [zoomDomain, setZoomDomain] = useState({ start: 0, end: 100 });
  const chartRef = useRef<HTMLDivElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  
  // 👇 State diubah untuk menampung format Tanggal Penuh (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    // Menghasilkan format "2026-04-23"
    return today.toISOString().split('T')[0];
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (data && data.length > 0) {
      setZoomDomain({ start: 0, end: data.length - 1 });
    }
  }, [data]);

  useEffect(() => {
    const el = chartRef.current;
    if (!el || data.length === 0) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); 
      setZoomDomain(prev => {
        const currentRange = prev.end - prev.start;
        const zoomSpeed = Math.max(1, Math.floor(currentRange * 0.1));
        if (e.deltaY < 0) {
          const newStart = prev.start + zoomSpeed;
          const newEnd = prev.end - zoomSpeed;
          if (newEnd - newStart < 5) return prev;
          return { start: newStart, end: newEnd };
        } else {
          return {
            start: Math.max(0, prev.start - zoomSpeed),
            end: Math.min(data.length - 1, prev.end + zoomSpeed)
          };
        }
      });
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [data.length]);

  const formatXAxis = (timestamp: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const dayMonth = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    const time = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${dayMonth}, ${time}`;
  };

  const formatYAxis = (value: number) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes("suhu") || titleLower.includes("temp")) {
      return value.toFixed(1).replace('.', ',') + ' °C';
    }
    return value.toString(); 
  };

  // 👇 --- LOGIKA EXPORT HARIAN --- 👇
  const handleExportHarian = async (format: 'csv' | 'xml') => {
    if (!selectedDate) return alert("Pilih tanggal terlebih dahulu!");
    
    setIsExporting(true);
    
    // Pecah YYYY-MM-DD menjadi tahun-bulan saja (karena Firebase nyimpannya per bulan)
    // Contoh: "2026-04-23" menjadi "2026-04"
    const targetMonthFolder = selectedDate.substring(0, 7);
    
    const db = getDatabase();
    const dataRef = ref(db, `sensors/history/${targetMonthFolder}`);

    try {
      const snapshot = await get(dataRef);
      if (snapshot.exists()) {
        const firebaseData = snapshot.val();
        
        // 1. Ubah object Firebase jadi array
        // 2. Filter data: HANYA ambil data yang timestamp-nya terjadi pada 'selectedDate'
        const filteredDataArray = Object.values(firebaseData)
          .filter((d: any) => {
            if (!d.timestamp) return false;
            // Ubah timestamp (milidetik) menjadi YYYY-MM-DD sesuai zona waktu lokal
            const dataDate = new Date(d.timestamp);
            // Menyesuaikan waktu lokal Tuan Muda agar tidak beda hari karena UTC
            const localDateStr = new Date(dataDate.getTime() - (dataDate.getTimezoneOffset() * 60000))
                                  .toISOString().split('T')[0];
            return localDateStr === selectedDate;
          })
          .sort((a: any, b: any) => a.timestamp - b.timestamp);
        
        if (filteredDataArray.length > 0) {
          if (format === 'csv') generateCSV(filteredDataArray, selectedDate);
          else generateXML(filteredDataArray, selectedDate);
        } else {
          alert(`Tidak ada data sensor yang terekam pada tanggal ${selectedDate}`);
        }
      } else {
        alert(`Data kosong untuk bulan ${targetMonthFolder}`);
      }
    } catch (error) {
      console.error("Gagal mengambil data harian:", error);
      alert("Terjadi kesalahan koneksi ke database.");
    } finally {
      setIsExporting(false);
    }
  };

  const generateCSV = (dataArray: any[], dateString: string) => {
    const headers = ['Timestamp', 'Waktu Lengkap', ...dataKeys.map(k => k.name)].join(',');
    const csvRows = dataArray.map(row => {
      const dateStr = new Date(row.timestamp).toISOString().replace(/T|Z/g, ' ');
      const values = dataKeys.map(k => row[k.key] !== undefined ? row[k.key] : 0);
      return [row.timestamp, dateStr, ...values].join(',');
    });
    
    const csvString = `${headers}\n${csvRows.join('\n')}`;
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `Data_${title.replace(/\s+/g, '_')}_${dateString}.csv`, true);
  };

  const generateXML = (dataArray: any[], dateString: string) => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<HistoricalData>\n';
    dataArray.forEach(row => {
      xml += '  <Record>\n';
      xml += `    <Timestamp>${row.timestamp}</Timestamp>\n`;
      xml += `    <Waktu>${new Date(row.timestamp).toISOString().replace(/T|Z/g, ' ')}</Waktu>\n`;
      dataKeys.forEach(k => {
        xml += `    <${k.key}>${row[k.key] !== undefined ? row[k.key] : 0}</${k.key}>\n`;
      });
      xml += '  </Record>\n';
    });
    xml += '</HistoricalData>';

    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `Data_${title.replace(/\s+/g, '_')}_${dateString}.xml`, true);
  };

  const triggerDownload = (uri: string, filename: string, isUrl = false) => {
    const link = document.createElement('a');
    link.href = isUrl ? uri : encodeURI(uri);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pointData = payload[0].payload;
      return (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-gray-300/80 dark:border-slate-500/80 z-50 transition-all duration-300">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-300 uppercase mb-3 tracking-wider">
            {new Date(pointData.timestamp).toLocaleString('id-ID', {
              day: '2-digit', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit', second: '2-digit'
            })}
          </p>
          {payload.map((entry: any, index: number) => {
            let formattedValue = entry.value.toFixed(2);
            let unit = "";
            const nameLower = entry.name.toLowerCase();
            if (nameLower.includes("suhu") || nameLower.includes("temp")) {
              formattedValue = entry.value.toFixed(1).replace('.', ','); 
              unit = " °C";
            }
            return (
              <div key={index} className="flex items-center gap-3 mb-1.5">
                <div className="w-2.5 h-2.5 rounded-full shadow-md" style={{ backgroundColor: entry.color }} />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {entry.name}: <span className="text-slate-900 dark:text-white font-bold ml-1">{formattedValue}{unit}</span>
                </p>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  if (!isMounted) return <div className="h-[400px] bg-slate-50/50 dark:bg-slate-800/50 animate-pulse rounded-2xl" />;

  return (
    <div className="bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-lg border border-indigo-100 dark:border-indigo-900/50 p-6 transition-all duration-300">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight transition-colors">
            {title}
          </h3>
          <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest shadow-sm">
            Live Data
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 👇 Input Tipe Date (Hari-Bulan-Tahun) 👇 */}
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-semibold px-2 py-1.5 border rounded-lg bg-white/50 dark:bg-slate-700 dark:text-white dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
            title="Pilih Tanggal Export"
          />
          <button 
            onClick={() => handleExportHarian('csv')}
            disabled={isExporting}
            className="text-xs font-bold px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 hover:shadow-sm transition-all disabled:opacity-50"
          >
            {isExporting ? '...' : 'CSV'}
          </button>
          <button 
            onClick={() => handleExportHarian('xml')}
            disabled={isExporting}
            className="text-xs font-bold px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-sm transition-all disabled:opacity-50"
          >
            {isExporting ? '...' : 'XML'}
          </button>
        </div>
      </div>
      
      {data.length === 0 ? (
        <div className="h-80 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-300 dark:border-slate-600">
           <div className="animate-bounce mb-3 text-3xl">📊</div>
           <p className="text-sm font-medium">Menunggu aliran data dari sensor...</p>
        </div>
      ) : (
        <div ref={chartRef} className="cursor-crosshair">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" className="text-gray-200 dark:text-slate-700" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
                stroke="currentColor"
                className="text-gray-500 dark:text-slate-400"
                tick={{ fontSize: 11, fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                minTickGap={50}
              />
              <YAxis 
                stroke="currentColor" 
                className="text-gray-500 dark:text-slate-400"
                tick={{ fontSize: 11, fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                domain={[
                  (dataMin: number) => Number((dataMin - 0.5).toFixed(1)),
                  (dataMax: number) => Number((dataMax + 0.5).toFixed(1))
                ]}
                tickFormatter={formatYAxis} 
                width={65} 
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Legend 
                iconType="circle"
                wrapperStyle={{ paddingTop: '20px', paddingBottom: '10px', fontSize: '13px', fontWeight: 'bold', color: 'inherit' }} 
              />
              
              {dataKeys.map((item) => (
                <Line
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  stroke={item.color}
                  strokeWidth={3.5}
                  name={item.name}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0, className: "shadow-glow" }}
                  animationDuration={300} 
                />
              ))}

              <Brush 
                dataKey="timestamp" 
                height={35} 
                stroke="#94a3b8" 
                fill="transparent"
                tickFormatter={() => ""} 
                startIndex={zoomDomain.start}
                endIndex={zoomDomain.end}
                onChange={(newIndex) => {
                  if (newIndex.startIndex !== undefined && newIndex.endIndex !== undefined) {
                    setZoomDomain({ start: newIndex.startIndex, end: newIndex.endIndex });
                  }
                }}
                className="opacity-70 hover:opacity-100 transition-opacity"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}