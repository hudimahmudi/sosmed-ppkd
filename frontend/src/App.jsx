// File ini: daftar semua halaman (rute) aplikasi
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import GuestRoute from './components/GuestRoute.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Notice from './components/Notice.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Home from './pages/Home.jsx';
import Profile from './pages/Profile.jsx';
import EditProfile from './pages/EditProfile.jsx';
import ChangePassword from './pages/ChangePassword.jsx';

export default function App() {
  const { notice } = useAuth();

  return (
    <>
      {/* Notifikasi sukses/gagal (muncul di atas layar) */}
      <Notice notice={notice} />

      <Routes>
        {/* Halaman tamu: /login dan /register */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Halaman terproteksi: wajib login */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/users/:id" element={<Profile />} />   {/* <-- TAMBAH */}
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/profile/password" element={<ChangePassword />} />
        </Route>

        {/* URL tidak dikenal -> kembali ke Beranda */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
