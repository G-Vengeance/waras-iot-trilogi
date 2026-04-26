import React, { useState } from 'react';
import { Settings, Zap, Radio, ShieldAlert, ShieldCheck, X, Info } from 'lucide-react';
import { ControlMode, ActuatorState } from '@/lib/types';
import { useAuth } from '@/lib/hooks';
import AuthModal from './AuthModal';

interface ControlPanelProps {
  mode: ControlMode;
  actuators: ActuatorState;
  onModeChange: (mode: ControlMode) => void;
  onActuatorToggle: (actuator: keyof ActuatorState) => Promise<{success: boolean, message?: string}> | void;
  disabled?: boolean;
}

const MASTER_EMAILS = [
  "pratamagerrio@gmail.com",
  "warasiottrilogi@gmail.com"
];

export default function ControlPanel({
  mode,
  actuators,
  onModeChange,
  onActuatorToggle,
  disabled = false,
}: ControlPanelProps) {
  
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [limitError, setLimitError] = useState(''); 
  const [isRoleInfoOpen, setIsRoleInfoOpen] = useState(false);

  const isMaster = user ? MASTER_EMAILS.includes(user.email || '') : false;

  const handleProtectedModeChange = (newMode: ControlMode) => {
    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      onModeChange(newMode);
    }
  };

  const handleProtectedActuator = async (actuatorName: keyof ActuatorState) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    
    setLimitError(''); 
    const result = await onActuatorToggle(actuatorName);
    
    // @ts-ignore
    if (result && result.success === false) {
      // @ts-ignore
      setLimitError(result.message); 
      setTimeout(() => setLimitError(''), 5000);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-br from-indigo-50/50 to-white dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-lg border border-indigo-100 dark:border-indigo-900/50 p-6 transition-all duration-300">
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-900 dark:text-white transition-colors" />
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight transition-colors">Panel Kontrol</h3>
          </div>
          
          {user && (
            <button 
              onClick={() => setIsRoleInfoOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-extrabold uppercase tracking-wide shadow-sm transition-all hover:scale-105 active:scale-95
                ${isMaster 
                  ? 'bg-amber-100/50 border-amber-200 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400' 
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'
                }
              `}
              title="Klik untuk melihat penjelasan role"
            >
              {isMaster ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
              {isMaster ? 'Master' : 'Publik'}
              <Info className="w-3 h-3 ml-0.5 opacity-70" />
            </button>
          )}
        </div>

        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${limitError ? 'max-h-24 opacity-100 mb-4' : 'max-h-0 opacity-0 m-0'}`}>
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg text-xs font-bold text-red-600 dark:text-red-400 shadow-sm text-center">
            {limitError}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3 transition-colors">
            Mode Operasi
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleProtectedModeChange('otomatis' as ControlMode)}
              className={`px-4 py-3 rounded-lg border-2 font-bold transition-all duration-200 shadow-sm ${
                mode === 'otomatis' || mode === 'auto'
                  ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                  : 'bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-500'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Otomatis</span>
              </div>
            </button>
            
            <button
              onClick={() => handleProtectedModeChange('manual' as ControlMode)}
              className={`px-4 py-3 rounded-lg border-2 font-bold transition-all duration-200 shadow-sm ${
                mode === 'manual'
                  ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                  : 'bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-500'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Radio className="w-4 h-4" />
                <span>Manual</span>
              </div>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3 transition-colors">
            Kontrol Aktuator
            {(mode === 'otomatis' || mode === 'auto') && (
              <span className="ml-2 text-xs text-orange-600 dark:text-orange-400 font-normal italic">
                (Nonaktif di mode otomatis)
              </span>
            )}
          </label>

          <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg border border-indigo-50 dark:border-slate-700 shadow-sm transition-colors duration-300">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full shadow-sm transition-colors ${actuators.feeder ? 'bg-emerald-500 animate-pulse-slow' : 'bg-gray-300 dark:bg-slate-600'}`} />
              <div>
                <p className="font-bold text-gray-900 dark:text-white transition-colors">Feeder</p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors">Pakan turun</p>
              </div>
            </div>
            <button
              onClick={() => handleProtectedActuator('feeder')}
              disabled={mode === 'otomatis' || mode === 'auto' || disabled}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors shadow-inner ${actuators.feeder ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'} ${(mode === 'otomatis' || mode === 'auto' || disabled) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${actuators.feeder ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg border border-indigo-50 dark:border-slate-700 shadow-sm transition-colors duration-300">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full shadow-sm transition-colors ${actuators.pelontar ? 'bg-emerald-500 animate-pulse-slow' : 'bg-gray-300 dark:bg-slate-600'}`} />
              <div>
                <p className="font-bold text-gray-900 dark:text-white transition-colors">Pelontar</p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors">Tembak pakan</p>
              </div>
            </div>
            <button
              onClick={() => handleProtectedActuator('pelontar')}
              disabled={mode === 'otomatis' || mode === 'auto' || disabled}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors shadow-inner ${actuators.pelontar ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'} ${(mode === 'otomatis' || mode === 'auto' || disabled) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${actuators.pelontar ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div className="mt-6 p-3 bg-indigo-50/80 dark:bg-indigo-900/20 backdrop-blur-sm border border-indigo-200 dark:border-indigo-800/50 rounded-lg text-center transition-colors shadow-sm flex flex-col gap-1">
          <p className="text-xs text-indigo-800 dark:text-indigo-300 font-bold transition-colors">
             {mode === 'manual' ? "🟢 Anda memegang kendali penuh" : "🔵 Sistem bekerja secara otomatis"}
          </p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium flex items-center justify-center gap-1 mt-1">
             Status Akses: 
             {user 
                ? (isMaster ? <span className="text-amber-600 dark:text-amber-400 font-bold">Master</span> : <span className="text-emerald-600 dark:text-emerald-400 font-bold">Operator Publik</span>) 
                : <span className="text-gray-500 font-bold">Terkunci (Guest)</span>
             }
          </p>
        </div>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={() => setIsAuthModalOpen(false)} 
      />

      {/* 👇 MODAL POP-UP PENJELASAN ROLE (PINTAR & RAHASIA) 👇 */}
      {isRoleInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm border border-indigo-100 dark:border-slate-700 relative overflow-hidden">
            
            <button 
              onClick={() => setIsRoleInfoOpen(false)} 
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-500" />
                Tingkat Akses
              </h2>
              
              <div className="space-y-5">
                
                {/* 👇 Penjelasan INI HANYA MUNCUL kalau yang login adalah MASTER 👇 */}
                {isMaster && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                    <h3 className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold mb-2">
                      <ShieldCheck className="w-4 h-4" /> Master
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                      Anda memiliki akses eksklusif tingkat tinggi. Anda dapat mengontrol semua aktuator (Feeder & Pelontar) tanpa ada batasan waktu atau kuota jumlah klik (Unlimited).
                    </p>
                  </div>
                )}

                {/* 👇 Penjelasan INI HANYA MUNCUL kalau yang login adalah PUBLIK 👇 */}
                {!isMaster && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700 rounded-xl">
                    <h3 className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold mb-2">
                      <ShieldAlert className="w-4 h-4" /> Operator Publik
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                      Demi menjaga keawetan dan mencegah kerusakan hardware akibat <i>spam</i> klik, pengguna publik dibatasi hanya dapat mengirim <b>MAKSIMAL 2 PERINTAH KONTROL SETIAP 2 JAM</b>.
                    </p>
                  </div>
                )}

              </div>
              
              <button 
                onClick={() => setIsRoleInfoOpen(false)}
                className="w-full mt-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-white font-bold rounded-lg transition-colors text-sm"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}