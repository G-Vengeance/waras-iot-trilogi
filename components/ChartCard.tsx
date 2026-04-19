import React, { useEffect, useState, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { HistoricalDataPoint } from '@/lib/types';

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
  
  // State untuk melacak indeks data yang sedang di-zoom
  const [zoomDomain, setZoomDomain] = useState({ start: 0, end: 100 });
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset zoom setiap kali data dari Firebase berubah drastis
  useEffect(() => {
    if (data && data.length > 0) {
      setZoomDomain({ start: 0, end: data.length - 1 });
    }
  }, [data]);

  // Logic Kustom: Zoom in/out menggunakan Scroll Mouse
  useEffect(() => {
    const el = chartRef.current;
    if (!el || data.length === 0) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // Cegah halaman web ikut ter-scroll saat mouse di atas chart
      
      // Kecepatan zoom (mengambil 5% dari total data per satu kali scroll)
      const zoomSpeed = Math.max(1, Math.floor(data.length * 0.05));

      if (e.deltaY < 0) {
        // Scroll Up -> Zoom In (Persempit jarak)
        setZoomDomain(prev => {
          const newStart = prev.start + zoomSpeed;
          const newEnd = prev.end - zoomSpeed;
          // Batas maksimal zoom (sisakan minimal 5 titik data agar chart tidak error)
          if (newEnd - newStart < 5) return prev;
          return { start: newStart, end: newEnd };
        });
      } else {
        // Scroll Down -> Zoom Out (Perlebar jarak)
        setZoomDomain(prev => {
          return {
            start: Math.max(0, prev.start - zoomSpeed),
            end: Math.min(data.length - 1, prev.end + zoomSpeed)
          };
        });
      }
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

  const exportToCSV = () => {
    if (!data || data.length === 0) return;
    const headers = ['Timestamp', 'Waktu Lengkap', ...dataKeys.map(k => k.name)].join(',');
    const csvRows = data.map(row => {
      const dateStr = new Date(row.timestamp).toISOString().replace(/T|Z/g, ' ');
      const values = dataKeys.map(k => row[k.key]);
      return [row.timestamp, dateStr, ...values].join(',');
    });
    
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${csvRows.join('\n')}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.download = `Data_${title.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToXML = () => {
    if (!data || data.length === 0) return;
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<HistoricalData>\n';
    data.forEach(row => {
      xml += '  <Record>\n';
      xml += `    <Timestamp>${row.timestamp}</Timestamp>\n`;
      xml += `    <Waktu>${new Date(row.timestamp).toISOString().replace(/T|Z/g, ' ')}</Waktu>\n`;
      dataKeys.forEach(k => {
        xml += `    <${k.key}>${row[k.key]}</${k.key}>\n`;
      });
      xml += '  </Record>\n';
    });
    xml += '</HistoricalData>';

    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Data_${title.replace(/\s+/g, '_')}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

 const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pointData = payload[0].payload;
      return (
        // Background kotak tooltip diubah jadi dark:bg-slate-800
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-xl border border-gray-100 dark:border-slate-700 z-50 transition-colors duration-300">
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase mb-2 tracking-wider">
            {new Date(pointData.timestamp).toLocaleString('id-ID', {
              day: '2-digit', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit', second: '2-digit'
            })}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {/* Teks nama sensor (Suhu, pH) dan Angkanya diubah jadi putih */}
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors">
                {entry.name}: <span className="text-gray-900 dark:text-white transition-colors">{entry.value.toFixed(2)}</span>
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!isMounted) return <div className="h-[400px] bg-gray-50 animate-pulse rounded-xl" />;

  // Memotong data yang akan ditampilkan sesuai rentang zoom
  const displayData = data.slice(zoomDomain.start, zoomDomain.end + 1);
  const isZoomed = data.length > 0 && (zoomDomain.start > 0 || zoomDomain.end < data.length - 1);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-100 dark:border-slate-700 p-6 transition-colors duration-300">
      
{/* HEADER: Judul & Grup Tombol */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {/* Tambahkan dark:text-white di sini */}
          <h3 className="text-lg font-bold text-gray-800 dark:text-white transition-colors">{title}</h3>
          <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-bold">
            LIVE
          </span>
        </div>
        
        {/* Tombol Export Warna Warni - Support Dark Mode */}
        {data.length > 0 && (
          <div className="flex items-center gap-3">
            <button 
              onClick={exportToCSV}
              className="text-xs font-bold px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-all flex items-center gap-1.5"
            >
              CSV
            </button>
            <button 
              onClick={exportToXML}
              className="text-xs font-bold px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all flex items-center gap-1.5"
            >
              XML
            </button>
          </div>
        )}
      </div>
      
      {/* AREA GRAFIK dengan Referensi ref untuk menangkap scroll */}
      {data.length === 0 ? (
        <div className="h-80 flex flex-col items-center justify-center text-gray-400">
           <div className="animate-bounce mb-2">📊</div>
           <p className="text-sm">Menunggu data dari sensor...</p>
        </div>
      ) : (
        <div ref={chartRef} className="cursor-crosshair">
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={displayData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
                stroke="#94a3b8"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
              />
              <YAxis 
                stroke="#94a3b8" 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                iconType="circle"
                wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontWeight: 'bold' }} 
              />
              {dataKeys.map((item) => (
                <Line
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  stroke={item.color}
                  strokeWidth={3}
                  name={item.name}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                  animationDuration={300} // Dipercepat biar zoom terasa responsif
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}