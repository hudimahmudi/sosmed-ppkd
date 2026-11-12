// File ini: halaman daftar akun (langsung auto-login ke Beranda)
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';
import Field from '../components/Field.jsx';

export default function Register() {
  const { setUser, notify } = useAuth();
  const navigate = useNavigate();
  // State untuk semua isian form
  const [form, setForm] = useState({ name: '', email: '', password: '', passwordConfirm: '' });
  const [errors, setErrors] = useState({}); // error per field
  const [sending, setSending] = useState(false);

  // Fungsi bantu: update satu field saat diketik
  const change = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  // Aksi klik Daftar
  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setSending(true);
    try {
      const data = await api.post('/auth/register', form);
      setUser(data.user); // sesi sudah aktif di server -> simpan user di React
      notify('success', `Selamat datang, ${data.user.name}!`);
      navigate('/', { replace: true }); // LANGSUNG ke Beranda (tanpa halaman login)
    } catch (err) {
      setErrors(err.errors); // tampilkan error di bawah tiap kolom
      if (!Object.keys(err.errors).length) notify('error', err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Buat akun</h1>
      <p className="mb-6 mt-1 text-sm text-neutral-500">Gabung ke ConnectSpace dan mulai ngobrol.</p>

      <form onSubmit={handleSubmit} noValidate>
        <Field label="Nama lengkap" value={form.name} onChange={change('name')} error={errors.name} />
        <Field label="Email" type="email" value={form.email} onChange={change('email')} error={errors.email} />
        <Field label="Password" type="password" value={form.password} onChange={change('password')} error={errors.password} />
        <Field label="Konfirmasi password" type="password" value={form.passwordConfirm} onChange={change('passwordConfirm')} error={errors.passwordConfirm} />
        <button type="submit" disabled={sending} className="mt-2 w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50">
          {sending ? 'Mendaftar...' : 'Daftar'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-neutral-500">
        Sudah punya akun? <Link to="/login" className="font-semibold text-neutral-900 underline">Masuk</Link>
      </p>
    </div>
  );
}
