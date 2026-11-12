// File ini: bilah navigasi atas. Semua menu digabung di dalam menu avatar (dropdown)
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';

export default function Navbar() {
  const { user, logout, notify } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false); // true = menu avatar terbuka
  const menuRef = useRef(null); // penanda area menu (untuk deteksi klik di luar)

  // Tutup menu otomatis setiap pindah halaman
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Tutup menu kalau klik di luar area menu atau tekan tombol Escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    // Bersihkan listener saat komponen dilepas
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Aksi klik Keluar
  async function handleLogout() {
    setOpen(false);
    await logout(); // hancurkan sesi
    notify('success', 'Kamu sudah logout.');
    // replace = hapus halaman ini dari riwayat supaya tombol Back tidak membukanya lagi
    navigate('/login', { replace: true });
  }

  // Gaya satu baris menu; menu halaman yang sedang dibuka dibuat lebih tebal
  const itemClass = (path) =>
    `block w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-100 ${
      location.pathname === path ? 'font-semibold text-neutral-900' : 'text-neutral-700'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
        {/* Logo (klik = ke Beranda) */}
        <Link to="/" className="text-lg font-bold tracking-tight text-neutral-900">
          ConnectSpace
        </Link>

        {/* Area avatar + dropdown */}
        <div ref={menuRef} className="relative">
          {/* Tombol avatar: klik untuk buka/tutup menu */}
          <button
            onClick={() => setOpen(!open)}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label="Buka menu akun"
            className="rounded-full ring-offset-2 hover:ring-2 hover:ring-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          >
            <Avatar src={user.avatar} name={user.name} size="sm" />
          </button>

          {/* Isi menu (tampil hanya kalau open = true) */}
          {open && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-neutral-200 bg-white py-1 shadow-lg"
            >
              {/* Info user di bagian atas menu */}
              <div className="border-b border-neutral-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-neutral-900">{user.name}</p>
                <p className="truncate text-xs text-neutral-500">{user.email}</p>
              </div>

              {/* Tiga menu navigasi */}
              <Link to="/" role="menuitem" className={itemClass('/')}>
                Beranda
              </Link>
              <Link to="/profile/edit" role="menuitem" className={itemClass('/profile/edit')}>
                Profil
              </Link>
              <Link to="/profile/password" role="menuitem" className={itemClass('/profile/password')}>
                Kata Sandi
              </Link>

              {/* Tombol keluar dipisah garis */}
              <div className="border-t border-neutral-100">
                <button
                  onClick={handleLogout}
                  role="menuitem"
                  className="block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}