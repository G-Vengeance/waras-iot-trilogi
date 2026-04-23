import React, { useState } from 'react';
import { getAuth, updateProfile, updatePassword, signOut } from 'firebase/auth';
import { X, User as UserIcon, Lock, Save, LogOut } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any; 
}

const PREDEFINED_AVATARS = [
  "/avatars/avatar-1.svg",
  "/avatars/avatar-2.svg",
  "/avatars/avatar-3.svg",
  "/avatars/avatar-4.svg",
  "/avatars/avatar-5.svg",
  "/avatars/avatar-6.svg",
];

export default function UserProfileModal({ isOpen, onClose, user }: UserProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.photoURL || PREDEFINED_AVATARS[0]);
  const [newPassword, setNewPassword] = useState('');
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showMessage, setShowMessage] = useState(false); // State untuk mengatur animasi transisi
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !user) return null;

  const auth = getAuth();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Eksekusi Nama dan Avatar (Pasti sukses)
      await updateProfile(auth.currentUser!, {
        displayName: displayName,
        photoURL: selectedAvatar,
      });

      // 2. Eksekusi Password jika diisi
      if (newPassword.trim() !== '') {
        if (newPassword.length < 6) {
          throw new Error('Password baru minimal 6 karakter.');
        }
        
        try {
          await updatePassword(auth.currentUser!, newPassword);
        } catch (pwErr: any) {
          // 👇 Kalau Firebase minta re-auth, kita hiraukan error-nya agar UX tetap elegan 👇
          if (pwErr.code === 'auth/requires-recent-login') {
            console.warn("Ganti password butuh re-auth. Dihiraukan sesuai instruksi Tuan Muda.");
          } else {
            throw pwErr; // Lempar error lain jika ada
          }
        }
      }

      // --- Notifikasi Sukses dengan Animasi ---
      setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
      setShowMessage(true);

      // Mulai hilangkan notifikasi setelah 1.5 detik (Animasi Fade Out)
      setTimeout(() => {
        setShowMessage(false);
      }, 1500);

      // Tutup mode edit dengan mulus setengah detik setelah notifikasi menghilang
      setTimeout(() => {
        setIsEditing(false);
        setNewPassword(''); 
        setIsLoading(false);
      }, 2000);

    } catch (err: any) {
      // Menangani error umum
      setMessage({ type: 'error', text: err.message || 'Gagal memperbarui profil.' });
      setShowMessage(true);
      setIsLoading(false);

      // Error juga otomatis menghilang setelah 3 detik
      setTimeout(() => {
        setShowMessage(false);
      }, 3000);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onClose(); 
    } catch (error) {
      console.error("Gagal Logout:", error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat mencoba keluar.' });
      setShowMessage(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-indigo-100 dark:border-slate-700 relative overflow-hidden">
        
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">
            Profil Operator
          </h2>

          {/* 👇 NOTIFIKASI DENGAN TRANSISI HALUS (SLIDE & FADE) 👇 */}
          <div 
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              showMessage ? 'max-h-24 opacity-100 mb-6' : 'max-h-0 opacity-0 m-0'
            }`}
          >
            <div className={`p-3 rounded-lg text-sm font-bold shadow-sm ${
              message.type === 'success' 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              {message.text}
            </div>
          </div>

          {!isEditing ? (
            // --- TAMPILAN PROFIL ---
            <div className="flex flex-col items-center text-center">
              <img 
                src={user.photoURL || PREDEFINED_AVATARS[0]} 
                alt="Profile" 
                className="w-24 h-24 rounded-full shadow-md border-4 border-indigo-100 dark:border-slate-600 bg-indigo-50 dark:bg-slate-700 p-2 mb-4 object-contain"
              />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {user.displayName || 'Operator WARAS'}
              </h3>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-8">
                {user.email}
              </p>

              <div className="flex w-full gap-3">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <UserIcon className="w-5 h-5" /> Edit Profil
                </button>
                
                <button 
                  onClick={handleLogout}
                  className="flex-1 py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 font-bold rounded-lg shadow-sm border border-red-100 dark:border-red-900/50 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-5 h-5" /> Keluar Akun
                </button>
              </div>
            </div>
          ) : (
            // --- MODE EDIT PROFIL ---
            <form onSubmit={handleSave} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Pilih Avatar</label>
                <div className="grid grid-cols-3 gap-3">
                  {PREDEFINED_AVATARS.map((avatar, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`w-full aspect-square rounded-xl cursor-pointer p-2 transition-all flex items-center justify-center ${
                        selectedAvatar === avatar 
                          ? 'border-4 border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-md scale-105' 
                          : 'border-2 border-transparent bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600'
                      }`}
                    >
                      <img src={avatar} alt={`Avatar ${idx + 1}`} className="w-full h-full object-contain" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">Nama Operator</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Masukkan nama anda"
                />
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">Ganti Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Biarkan KOSONG jika tidak ingin ganti Password"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setShowMessage(false); // Pastikan notifikasi reset kalau user klik Batal
                  }}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 font-bold rounded-lg transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-70"
                >
                  <Save className="w-4 h-4" /> {isLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}