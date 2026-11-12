// File ini: auth guard di frontend (halaman hanya untuk yang sudah login)
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from './Navbar.jsx';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  // Masih mengecek sesi -> tampilkan teks tunggu
  if (loading) {
    return <p className="p-10 text-center text-sm text-neutral-500">Memuat...</p>;
  }

  // Tidak ada sesi -> lempar ke Login sambil membawa pesan peringatan
  if (!user) {
    return (
      <Navigate to="/login" replace state={{ warning: 'Silakan login dulu untuk membuka halaman itu.' }} />
    );
  }

  // Ada sesi -> tampilkan navbar + isi halaman
  return (
    <div className="min-h-screen bg-neutral-100">
      <Navbar />
      <main className="mx-auto w-full max-w-xl pb-10 sm:px-4">
        <Outlet />
      </main>
    </div>
  );
}
