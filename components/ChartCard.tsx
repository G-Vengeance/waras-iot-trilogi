import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush, // Tambahan untuk fitur Zoom In/Out
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
  // 1. State untuk menangani Hydration Error
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 2. Format sumbu X (Menampilkan Tanggal, Bulan, dan Jam)
  const formatXAxis = (timestamp: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const dayMonth = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    const time = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${dayMonth}, ${time}`;
  };

  // Format khusus untuk Brush (Slider Zoom) agar tidak terlalu penuh
  const formatBrushAxis = (timestamp: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  };

  // 3. Fungsi Export ke CSV
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

  // 4. Fungsi Export ke XML
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

  // 5. Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pointData = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-xl border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">
            {new Date(pointData.timestamp).toLocaleString('id-ID', {
              day: '2-digit', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit', second: '2-digit'
            })}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <p className="text-sm font-semibold text-gray-700">
                {entry.name}: <span className="text-gray-900">{entry.value.toFixed(2)}</span>
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!isMounted) return <div className="h-[400px] bg-gray-50 animate-pulse rounded-xl" />;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
      
      {/* HEADER: Judul & Tombol Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">
            LIVE
          </span>
        </div>
        
        {/* Grup Tombol Export Modern */}
        {data.length > 0 && (
          <div className="flex items-center gap-2">
            <button 
              onClick={exportToCSV}
              className="text-xs font-semibold px-3 py-1.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              CSV
            </button>
            <button 
              onClick={exportToXML}
              className="text-xs font-semibold px-3 py-1.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              XML
            </button>
          </div>
        )}
      </div>
      
      {/* AREA GRAFIK */}
      {data.length === 0 ? (
        <div className="h-80 flex flex-col items-center justify-center text-gray-400">
           <div className="animate-bounce mb-2">📊</div>
           <p className="text-sm">Menunggu data dari sensor...</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              stroke="#9ca3af"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={40} // Agar teks tanggal tidak tumpang tindih
            />
            <YAxis 
              stroke="#9ca3af" 
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
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
                animationDuration={1000}
              />
            ))}
            
            {/* BRUSH: Ini yang bikin chart bisa di-zoom & di-geser */}
            <Brush 
              dataKey="timestamp"
              height={30}
              stroke="#9ca3af"
              tickFormatter={formatBrushAxis}
              fill="#f9fafb"
              travellerWidth={10}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}