// File ini: guest guard (Login/Register hanya untuk yang belum login)
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function GuestRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="p-10 text-center text-sm text-neutral-500">Memuat...</p>;
  }

  // Sudah login -> arahkan ke Beranda
  if (user) return <Navigate to="/" replace />;

  // Belum login -> tampilkan halaman tamu
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4 py-10">
      <Outlet />
    </div>
  );
}
