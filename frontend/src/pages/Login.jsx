// File ini: halaman login
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';
import Field from '../components/Field.jsx';

export default function Login() {
  const { setUser, notify } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  // Pesan peringatan dari auth guard (kalau dilempar ke sini karena belum login)
  const warning = location.state?.warning;

  const change = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  // Aksi klik Masuk
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      const data = await api.post('/auth/login', form);
      setUser(data.user); // simpan user di React
      notify('success', 'Berhasil masuk.');
      navigate('/', { replace: true }); // ke Beranda
    } catch (err) {
      setError(err.message); // pesan umum: tidak membocorkan email terdaftar atau tidak
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Masuk</h1>
      <p className="mb-6 mt-1 text-sm text-neutral-500">Lanjutkan ke ConnectSpace.</p>

      {/* Notifikasi peringatan dari auth guard */}
      {warning && <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{warning}</p>}
      {/* Pesan error login */}
      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleSubmit} noValidate>
        <Field label="Email" type="email" value={form.email} onChange={change('email')} />
        <Field label="Password" type="password" value={form.password} onChange={change('password')} />
        <button type="submit" disabled={sending} className="mt-2 w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50">
          {sending ? 'Masuk...' : 'Masuk'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-neutral-500">
        Belum punya akun? <Link to="/register" className="font-semibold text-neutral-900 underline">Daftar</Link>
      </p>
    </div>
  );
}
