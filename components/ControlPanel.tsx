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
  disabled = false,
}: ControlPanelProps) {
  
  const isForceEnabled = false;

  return (
    <div className="bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-lg border border-indigo-100 dark:border-indigo-900/50 p-6 transition-all duration-300">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5 text-gray-900 dark:text-white transition-colors" />
        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight transition-colors">Panel Kontrol</h3>
      </div>

      {/* Mode Selection */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3 transition-colors">
          Mode Operasi
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onModeChange('otomatis' as ControlMode)}
            className={`
            px-4 py-3 rounded-lg border-2 font-bold transition-all duration-200 cursor-pointer shadow-sm
            // @ts-ignore
            ${mode === 'otomatis' || mode === 'auto'
              ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-500 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300'
              : 'bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-500'
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
              px-4 py-3 rounded-lg border-2 font-bold transition-all duration-200 cursor-pointer shadow-sm
              ${mode === 'manual'
                ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-500 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300'
                : 'bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-500'
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
        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3 transition-colors">
          Kontrol Aktuator
          {(mode === 'otomatis' || mode === 'auto') && (
            <span className="ml-2 text-xs text-orange-600 dark:text-orange-400 font-normal italic">
              (Nonaktif di mode otomatis)
            </span>
          )}
        </label>

        {/* Feeder Control */}
        <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg border border-indigo-50 dark:border-slate-700 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className={`
              w-3 h-3 rounded-full shadow-sm transition-colors
              ${actuators.feeder ? 'bg-emerald-500 animate-pulse-slow' : 'bg-gray-300 dark:bg-slate-600'}
            `} />
            <div>
              <p className="font-bold text-gray-900 dark:text-white transition-colors">Feeder</p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors">Sistem pemberian pakan</p>
            </div>
          </div>
          <button
            onClick={() => onActuatorToggle('feeder')}
            disabled={mode === 'otomatis' || mode === 'auto'}
            className={`
              relative inline-flex h-8 w-14 items-center rounded-full transition-colors shadow-inner
              ${actuators.feeder ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'}
              ${(mode === 'otomatis' || mode === 'auto') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
            `}
          >
            <span
              className={`
                inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform
                ${actuators.feeder ? 'translate-x-7' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {/* Pelontar Control */}
        <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg border border-indigo-50 dark:border-slate-700 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className={`
              w-3 h-3 rounded-full shadow-sm transition-colors
              ${actuators.pelontar ? 'bg-emerald-500 animate-pulse-slow' : 'bg-gray-300 dark:bg-slate-600'}
            `} />
            <div>
              <p className="font-bold text-gray-900 dark:text-white transition-colors">Pelontar</p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors">Sistem pelontar otomatis</p>
            </div>
          </div>
          <button
            onClick={() => onActuatorToggle('pelontar')}
            disabled={mode === 'otomatis' || mode === 'auto'}
            className={`
              relative inline-flex h-8 w-14 items-center rounded-full transition-colors shadow-inner
              ${actuators.pelontar ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'}
              ${(mode === 'otomatis' || mode === 'auto') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
            `}
          >
            <span
              className={`
                inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform
                ${actuators.pelontar ? 'translate-x-7' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
      </div>

      {/* Status Info */}
      <div className="mt-6 p-3 bg-indigo-50/80 dark:bg-indigo-900/20 backdrop-blur-sm border border-indigo-200 dark:border-indigo-800/50 rounded-lg text-center transition-colors shadow-sm">
        <p className="text-xs text-indigo-800 dark:text-indigo-300 font-bold transition-colors">
           {mode === 'manual' ? "🟢 Anda memegang kendali penuh" : "🔵 Sistem bekerja secara otomatis"}
        </p>
      </div>
    </div>
  );
}