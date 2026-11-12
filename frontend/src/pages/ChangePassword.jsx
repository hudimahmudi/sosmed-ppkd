// File ini: halaman ubah password (wajib isi password lama)
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';
import Field from '../components/Field.jsx';

export default function ChangePassword() {
  const { notify } = useAuth();
  const empty = { oldPassword: '', newPassword: '', newPasswordConfirm: '' };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  const change = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  // Aksi klik Ubah password
  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setSending(true);
    try {
      await api.put('/profile/password', form);
      notify('success', 'Password berhasil diubah.');
      setForm(empty); // kosongkan form
    } catch (err) {
      setErrors(err.errors); // contoh: "Password lama salah."
      if (!Object.keys(err.errors).length) notify('error', err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-0 bg-white p-6 sm:mt-4 sm:rounded-3xl sm:border sm:border-neutral-200">
      <h1 className="mb-5 text-xl font-bold text-neutral-900">Ubah password</h1>
      <form onSubmit={handleSubmit} noValidate>
        <Field label="Password lama" type="password" value={form.oldPassword} onChange={change('oldPassword')} error={errors.oldPassword} />
        <Field label="Password baru" type="password" value={form.newPassword} onChange={change('newPassword')} error={errors.newPassword} />
        <Field label="Konfirmasi password baru" type="password" value={form.newPasswordConfirm} onChange={change('newPasswordConfirm')} error={errors.newPasswordConfirm} />
        <button type="submit" disabled={sending} className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50">
          {sending ? 'Menyimpan...' : 'Ubah password'}
        </button>
      </form>
    </div>
  );
}
