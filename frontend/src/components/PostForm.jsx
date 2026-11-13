// File ini: kotak untuk menulis status baru (teks dan/atau gambar)
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';
import Avatar from './Avatar.jsx';
import ImageInput from './ImageInput.jsx';
import CharCounter from './CharCounter.jsx';
import { MAX_POST_LENGTH, countChars } from '../utils/limits.js';
import { getCurrentLocation } from '../utils/location.js';

export default function PostForm({ onCreated }) {
  const { user, notify } = useAuth();
  const [content, setContent] = useState(''); // isi teks status
  const [file, setFile] = useState(null); // file gambar
  const [imageUrl, setImageUrl] = useState(''); // atau URL gambar
  const [showImage, setShowImage] = useState(false); // tampilkan pilihan gambar?
  const [sending, setSending] = useState(false); // sedang mengirim?
  const [error, setError] = useState(''); // pesan error
  const [location, setLocation] = useState(null); // lokasi posting {name, latitude, longitude} (opsional)
  const [locating, setLocating] = useState(false); // sedang mengambil lokasi?

  // Fitur 1: tombol Posting dimatikan kalau teks melebihi batas karakter
  const charCount = countChars(content);
  const overLimit = charCount > MAX_POST_LENGTH;

  // Fitur 5: ambil lokasi pengguna (browser akan meminta izin dulu)
  async function handleAddLocation() {
    if (locating) return;
    setError('');
    setLocating(true);
    try {
      setLocation(await getCurrentLocation());
    } catch (err) {
      setError(err.message);
    } finally {
      setLocating(false);
    }
  }

  // Aksi klik tombol Posting
  async function handleSubmit(e) {
    e.preventDefault(); // cegah halaman reload
    if (overLimit) return; // jaga-jaga kalau form dikirim lewat tombol Enter
    setError('');
    setSending(true);

    try {
      // FormData dipakai karena ada kemungkinan mengirim file
      const form = new FormData();
      form.append('content', content);
      if (file) form.append('image', file);
      if (imageUrl) form.append('imageUrl', imageUrl);
      if (location) {
        form.append('locationName', location.name);
        form.append('latitude', String(location.latitude));
        form.append('longitude', String(location.longitude));
      }

      const data = await api.post('/posts', form); // kirim ke backend
      onCreated(data.post); // beri tahu Beranda: ada post baru
      notify('success', 'Postingan terkirim.');

      // Kosongkan form
      setContent('');
      setFile(null);
      setImageUrl('');
      setShowImage(false);
      setLocation(null);
    } catch (err) {
      setError(err.message); // tampilkan error di bawah form
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 border-b border-neutral-200 px-5 py-4">
      <Link to={`/users/${user.id}`} aria-label="Lihat profil saya" className="shrink-0">
        <Avatar src={user.avatar} name={user.name} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={`/users/${user.id}`} className="text-sm font-semibold text-neutral-900 hover:underline">
          {user.name}
        </Link>
        {/* Kolom teks status */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ada yang baru?"
          rows={2}
          className="mt-1 w-full resize-none bg-transparent text-[15px] outline-none placeholder:text-neutral-400"
        />

        {/* Pilihan gambar muncul kalau tombol Gambar diklik */}
        {showImage && (
          <div className="mb-3">
            <ImageInput file={file} onFile={setFile} url={imageUrl} onUrl={setImageUrl} />
          </div>
        )}

        {/* Fitur 5: lokasi yang dipilih (klik x untuk menghapus) */}
        {location && (
          <div className="mb-2 inline-flex max-w-full items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700">
            <span aria-hidden="true">📍</span>
            <span className="truncate">{location.name}</span>
            <button type="button" onClick={() => setLocation(null)} aria-label="Hapus lokasi" className="text-neutral-400 hover:text-neutral-900">
              ✕
            </button>
          </div>
        )}

        {/* Fitur 1: pesan kalau melebihi batas */}
        {overLimit && <p className="mb-2 text-xs text-red-600">Postingan maksimal {MAX_POST_LENGTH} karakter. Kurangi {charCount - MAX_POST_LENGTH} karakter lagi.</p>}

        {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

        <div className="flex items-center justify-between">
          {/* Tombol buka/tutup pilihan gambar */}
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setShowImage(!showImage)} className="text-sm text-neutral-500 hover:text-neutral-900">
              {showImage ? 'Tutup gambar' : 'Tambah gambar'}
            </button>
            {/* Fitur 5: tombol tambah lokasi (hilang setelah lokasi dipilih) */}
            {!location && (
              <button type="button" onClick={handleAddLocation} disabled={locating} className="text-sm text-neutral-500 hover:text-neutral-900 disabled:opacity-50">
                {locating ? 'Mencari lokasi...' : 'Tambah lokasi'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Fitur 1: penghitung karakter */}
            <CharCounter count={charCount} max={MAX_POST_LENGTH} />
            {/* Tombol kirim (disable kalau sedang mengirim ATAU melebihi batas karakter) */}
            <button
              type="submit"
              disabled={sending || overLimit}
              className="rounded-full bg-neutral-900 px-5 py-1.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? 'Mengirim...' : 'Posting'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}