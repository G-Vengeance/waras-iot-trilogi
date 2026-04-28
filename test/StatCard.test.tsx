import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatCard from '@/components/StatCard';
import { Thermometer } from 'lucide-react';

/**
 * Mendemonstrasikan siklus TDD pada komponen StatCard.
 */
describe('StatCard Component', () => {

  // --- Siklus 1: Test untuk fungsionalitas dasar ---

  // 🟥 RED: Tulis test ini pertama kali. Ini akan gagal karena belum ada implementasi.
  // 🟩 GREEN: Render komponen dengan props dan tambahkan ekspektasi di bawah.
  test('harus menampilkan judul, nilai yang diformat, dan unit dengan benar', () => {
    render(
      <StatCard
        title="Temperature"
        value={28.789}
        unit="°C"
        icon={Thermometer}
        color="orange"
      />
    );

    // Harapannya, teks "Temperature" muncul di layar.
    expect(screen.getByText('Temperature')).toBeInTheDocument();

    // Harapannya, nilai numerik diformat menjadi satu desimal dengan koma (sesuai logika di komponen).
    expect(screen.getByText('28,8')).toBeInTheDocument();
    
    // Harapannya, unit "°C" muncul di layar.
    expect(screen.getByText('°C')).toBeInTheDocument();
  });

  // --- Siklus 2: Test untuk logika kondisi "bahaya" ---

  // 🟥 RED: Tulis test ini untuk memeriksa apakah kelas CSS untuk "bahaya" ditambahkan saat nilai di luar batas.
  // 🟩 GREEN: Implementasikan logika `isDanger` di dalam komponen StatCard.tsx agar test ini lolos.
  test('harus menerapkan style "bahaya" jika nilai di bawah minSafe', () => {
    const { container } = render(
      <StatCard
        title="Temperature"
        value={24.5} // Nilai ini di bawah batas aman (26.0)
        unit="°C"
        icon={Thermometer}
        color="orange"
        minSafe={26.0}
        maxSafe={30.0}
      />
    );

    // Harapannya, komponen memiliki kelas CSS 'border-red-400'
    expect(container.firstChild).toHaveClass('border-red-400');
  });

  test('harus menerapkan style "bahaya" jika nilai di atas maxSafe', () => {
    const { container } = render(
      <StatCard
        title="pH Level"
        value={9.2} // Nilai ini di atas batas aman (8.5)
        unit="pH"
        icon={Thermometer}
        color="blue"
        minSafe={6.5}
        maxSafe={8.5}
      />
    );

    // Harapannya, komponen juga memiliki kelas CSS 'border-red-400'
    expect(container.firstChild).toHaveClass('border-red-400');
  });

  // 🟦 REFACTOR: Pastikan logika tidak salah dan tidak menerapkan style "bahaya" saat tidak diperlukan.
  test('TIDAK boleh menerapkan style "bahaya" jika nilai dalam rentang aman', () => {
    const { container } = render(
      <StatCard
        title="pH Level"
        value={7.5} // Nilai aman
        unit="pH"
        icon={Thermometer}
        color="blue"
        minSafe={6.5}
        maxSafe={8.5}
      />
    );

    // Harapannya, komponen TIDAK memiliki kelas 'border-red-400'
    expect(container.firstChild).not.toHaveClass('border-red-400');
  });

});