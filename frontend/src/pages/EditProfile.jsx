// File ini: halaman edit profil (nama, bio, foto profil)
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';
import Avatar from '../components/Avatar.jsx';
import Field from '../components/Field.jsx';
import ImageInput from '../components/ImageInput.jsx';

export default function EditProfile() {
  const { user, setUser, notify } = useAuth();
  const [name, setName] = useState(user.name); // isi awal = data sekarang
  const [bio, setBio] = useState(user.bio || '');
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  // Aksi klik Simpan perubahan
  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setSending(true);
    try {
      const form = new FormData();
      form.append('name', name);
      form.append('bio', bio);
      if (file) form.append('image', file);
      if (imageUrl) form.append('imageUrl', imageUrl);

      const data = await api.put('/profile', form);
      setUser(data.user); // update user di React -> navbar, post, komentar ikut berubah
      setFile(null);
      setImageUrl('');
      notify('success', 'Profil berhasil disimpan.');
    } catch (err) {
      setErrors(err.errors);
      if (!Object.keys(err.errors).length) notify('error', err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-0 bg-white p-6 sm:mt-4 sm:rounded-3xl sm:border sm:border-neutral-200">
      <h1 className="text-xl font-bold text-neutral-900">Edit profil</h1>

      {/* Foto profil saat ini */}
      <div className="my-5 flex items-center gap-4">
        <Avatar src={user.avatar} name={user.name} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-sm font-medium text-neutral-700">Foto profil</p>
          <ImageInput file={file} onFile={setFile} url={imageUrl} onUrl={setImageUrl} error={errors.imageUrl || errors.image} />
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Field label="Nama pengguna" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <Field label="Bio" textarea value={bio} onChange={(e) => setBio(e.target.value)} error={errors.bio} placeholder="Ceritakan sedikit tentang dirimu" />
        <button type="submit" disabled={sending} className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50">
          {sending ? 'Menyimpan...' : 'Simpan perubahan'}
        </button>
      </form>
    </div>
  );
}
