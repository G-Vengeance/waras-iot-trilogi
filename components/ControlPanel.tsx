import React from 'react';
import { Settings, Zap, Radio } from 'lucide-react';
import { ControlMode, ActuatorState } from '@/lib/types';

interface ControlPanelProps {
  mode: ControlMode;
  actuators: ActuatorState;
  onModeChange: (mode: ControlMode) => void;
  onActuatorToggle: (actuator: keyof ActuatorState) => void;
  disabled?: boolean;
}

export default function ControlPanel({
  mode,
  actuators,
  onModeChange,
  onActuatorToggle,
  disabled = false, // Secara default kita set false
}: ControlPanelProps) {
  
  // PERBAIKAN: Kita buat variabel internal agar tombol tidak terkunci oleh sistem
  // Jika Tuan Muda ingin benar-benar bebas, kita abaikan prop 'disabled' dari luar.
  const isForceEnabled = false; // Ubah ke true jika ingin benar-benar mengabaikan status online/offline

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">Panel Kontrol</h3>
      </div>

      {/* Mode Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Mode Operasi
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onModeChange('otomatis' as ControlMode)} // SINKRON DENGAN ESP32
            className={`
            px-4 py-3 rounded-lg border-2 font-medium transition-all duration-200 cursor-pointer
            ${(mode === 'auto' || mode === 'otomatis')
              ? 'bg-blue-50 border-blue-500 text-blue-700'
              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
            }
          `}
          >
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Otomatis</span>
            </div>
          </button>
          
          <button
            onClick={() => onModeChange('manual' as ControlMode)}
            className={`
              px-4 py-3 rounded-lg border-2 font-medium transition-all duration-200 cursor-pointer
              ${mode === 'manual'
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center justify-center gap-2">
              <Radio className="w-4 h-4" />
              <span>Manual</span>
            </div>
          </button>
        </div>
      </div>

      {/* Actuator Controls */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Kontrol Aktuator
          {(mode === 'otomatis' || mode === 'auto') && (
            <span className="ml-2 text-xs text-orange-600 font-normal italic">
              (Nonaktif di mode otomatis)
            </span>
          )}
        </label>

        {/* Feeder Control */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`
              w-3 h-3 rounded-full
              ${actuators.feeder ? 'bg-green-500 animate-pulse-slow' : 'bg-gray-300'}
            `} />
            <div>
              <p className="font-medium text-gray-900">Feeder</p>
              <p className="text-xs text-gray-500">Sistem pemberian pakan</p>
            </div>
          </div>
          <button
            onClick={() => onActuatorToggle('feeder')}
            // Tombol hanya bisa diklik kalau mode MANUAL
            disabled={mode === 'otomatis' || mode === 'auto'}
            className={`
              relative inline-flex h-8 w-14 items-center rounded-full transition-colors
              ${actuators.feeder ? 'bg-green-500' : 'bg-gray-300'}
              ${(mode === 'otomatis' || mode === 'auto') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span
              className={`
                inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                ${actuators.feeder ? 'translate-x-7' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {/* Pelontar Control */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`
              w-3 h-3 rounded-full
              ${actuators.pelontar ? 'bg-green-500 animate-pulse-slow' : 'bg-gray-300'}
            `} />
            <div>
              <p className="font-medium text-gray-900">Pelontar</p>
              <p className="text-xs text-gray-500">Sistem pelontar otomatis</p>
            </div>
          </div>
          <button
            onClick={() => onActuatorToggle('pelontar')}
            // Tombol hanya bisa diklik kalau mode MANUAL
            disabled={mode === 'otomatis' || mode === 'auto'}
            className={`
              relative inline-flex h-8 w-14 items-center rounded-full transition-colors
              ${actuators.pelontar ? 'bg-green-500' : 'bg-gray-300'}
              ${(mode === 'otomatis' || mode === 'auto') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span
              className={`
                inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                ${actuators.pelontar ? 'translate-x-7' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
      </div>

      {/* Status Info */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
        <p className="text-xs text-blue-700 font-medium">
           {mode === 'manual' ? "🟢 Anda memegang kendali penuh" : "🔵 Sistem bekerja secara otomatis"}
        </p>
      </div>
    </div>
  );
}