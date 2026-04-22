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
  Brush
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
  const [zoomDomain, setZoomDomain] = useState({ start: 0, end: 100 });
  const chartRef = useRef<HTMLDivElement>(null);

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
        // UI Tooltip Disamakan jadi solid, tidak blur lagi
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 z-50 transition-colors duration-300">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 tracking-wider">
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
                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {entry.name}: <span className="text-slate-900 dark:text-white ml-1">{formattedValue}{unit}</span>
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
    // UI Container DIKEMBALIKAN KE STYLE SOLID (Sama persis dengan StatCard)
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 transition-colors duration-300">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight transition-colors">{title}</h3>
          <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-widest shadow-sm">
            Live Data
          </span>
        </div>
        
        {data.length > 0 && (
          <div className="flex items-center gap-2">
            <button 
              onClick={exportToCSV}
              className="text-xs font-bold px-4 py-2 bg-gray-50 dark:bg-slate-700/50 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 hover:shadow-sm transition-all"
            >
              CSV
            </button>
            <button 
              onClick={exportToXML}
              className="text-xs font-bold px-4 py-2 bg-gray-50 dark:bg-slate-700/50 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 hover:shadow-sm transition-all"
            >
              XML
            </button>
          </div>
        )}
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
              {/* --- FIX ZOOM EKSTREM --- */}
              <YAxis 
                stroke="currentColor" 
                className="text-gray-500 dark:text-slate-400"
                tick={{ fontSize: 11, fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                // Diberi margin atas bawah sebesar 0.5 agar grafik tidak melar/extreme
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