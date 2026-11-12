// File ini: menyimpan data user yang sedang login + notifikasi global
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../utils/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // data user (null = belum login)
  const [loading, setLoading] = useState(true); // true selama mengecek sesi
  const [notice, setNotice] = useState(null); // notifikasi {type, text}

  // Saat aplikasi pertama dibuka, tanya backend: "sesi saya masih aktif?"
  useEffect(() => {
    api
      .get('/auth/me')
      .then((data) => setUser(data.user)) // sesi aktif
      .catch(() => setUser(null)) // tidak ada sesi
      .finally(() => setLoading(false)); // selesai mengecek
  }, []);

  // Tampilkan notifikasi lalu hilang otomatis setelah 3,5 detik
  function notify(type, text) {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 3500);
  }

  // Aksi logout: hancurkan sesi di server, lalu kosongkan user di React
  async function logout() {
    await api.post('/auth/logout');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, notice, notify, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook supaya komponen lain bisa memanggil: const { user } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
