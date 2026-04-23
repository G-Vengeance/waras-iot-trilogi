// lib/predictive.ts

export function getChartDataWithPrediction(
  data: any[],
  keys: string[],
  analyzeCount: number, // Berapa data ke belakang yang dianalisis (contoh: 20 data)
  predictCount: number  // Berapa titik ke depan yang ditebak (contoh: 12 titik = 60 menit)
) {
  if (!data || data.length < 2) return [];

  // Ambil potongan data terakhir sesuai slider
  const slicedData = data.slice(-Math.min(analyzeCount, data.length));
  const n = slicedData.length;

  // 1. Hitung Rumus Regresi Linear (Slope & Intercept) untuk tiap Sensor (pH & DO)
  const models = keys.reduce((acc, key) => {
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    slicedData.forEach((d, i) => {
      const y = Number(d[key]) || 0;
      sumX += i;
      sumY += y;
      sumXY += i * y;
      sumX2 += i * i;
    });
    // Rumus matematika mencari kemiringan garis masa depan
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    acc[key] = { slope, intercept };
    return acc;
  }, {} as Record<string, { slope: number; intercept: number }>);

  // 2. Format ulang data asli agar siap digambar (Data Masa Lalu)
  const result = slicedData.map((d, i) => {
    const row: any = { timestamp: d.timestamp, isPrediction: false };
    keys.forEach(k => {
      row[`${k}_actual`] = d[k]; // Garis Solid
      // Di titik paling ujung masa lalu, kita mulai garis putus-putusnya agar tersambung
      if (i === n - 1) {
        row[`${k}_predicted`] = d[k];
      }
    });
    return row;
  });

  // 3. Proyeksikan Data Masa Depan (Titik Tebakan)
  const lastTimestamp = slicedData[n - 1].timestamp;
  const interval = 5 * 60 * 1000; // Asumsi ESP32 kirim data tiap 5 menit

  for (let i = 1; i <= predictCount; i++) {
    const row: any = {
      timestamp: lastTimestamp + (i * interval),
      isPrediction: true
    };
    const xFuture = n - 1 + i;
    keys.forEach(k => {
      let val = models[k].slope * xFuture + models[k].intercept;
      // Jaga-jaga agar tebakan nilai tidak menjadi minus
      row[`${k}_predicted`] = Math.max(0, val); 
    });
    result.push(row);
  }

  return result;
}