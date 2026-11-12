// File ini: kotak untuk menulis status baru (teks dan/atau gambar)
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';
import Avatar from './Avatar.jsx';
import ImageInput from './ImageInput.jsx';

export default function PostForm({ onCreated }) {
  const { user, notify } = useAuth();
  const [content, setContent] = useState(''); // isi teks status
  const [file, setFile] = useState(null); // file gambar
  const [imageUrl, setImageUrl] = useState(''); // atau URL gambar
  const [showImage, setShowImage] = useState(false); // tampilkan pilihan gambar?
  const [sending, setSending] = useState(false); // sedang mengirim?
  const [error, setError] = useState(''); // pesan error

  // Aksi klik tombol Posting
  async function handleSubmit(e) {
    e.preventDefault(); // cegah halaman reload
    setError('');
    setSending(true);

    try {
      // FormData dipakai karena ada kemungkinan mengirim file
      const form = new FormData();
      form.append('content', content);
      if (file) form.append('image', file);
      if (imageUrl) form.append('imageUrl', imageUrl);

      const data = await api.post('/posts', form); // kirim ke backend
      onCreated(data.post); // beri tahu Beranda: ada post baru
      notify('success', 'Postingan terkirim.');

      // Kosongkan form
      setContent('');
      setFile(null);
      setImageUrl('');
      setShowImage(false);
    } catch (err) {
      setError(err.message); // tampilkan error di bawah form
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 border-b border-neutral-200 px-5 py-4">
      <Avatar src={user.avatar} name={user.name} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-900">{user.name}</p>
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

        {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

        <div className="flex items-center justify-between">
          {/* Tombol buka/tutup pilihan gambar */}
          <button type="button" onClick={() => setShowImage(!showImage)} className="text-sm text-neutral-500 hover:text-neutral-900">
            {showImage ? 'Tutup gambar' : 'Tambah gambar'}
          </button>
          {/* Tombol kirim */}
          <button
            type="submit"
            disabled={sending}
            className="rounded-full bg-neutral-900 px-5 py-1.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
          >
            {sending ? 'Mengirim...' : 'Posting'}
          </button>
        </div>
      </div>
    </form>
  );
}
