// File ini: daftar komentar + form kirim komentar
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';
import { fullTime, timeAgo } from '../utils/time.js';
import Avatar from './Avatar.jsx';
import ImageInput from './ImageInput.jsx';

export default function CommentSection({ post, onAdded }) {
  const { user, notify } = useAuth();
  const [text, setText] = useState(''); // isi komentar
  const [file, setFile] = useState(null); // gambar komentar (opsional)
  const [imageUrl, setImageUrl] = useState('');
  const [showImage, setShowImage] = useState(false);
  const [sending, setSending] = useState(false);

  // Aksi kirim komentar
  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    try {
      const form = new FormData();
      form.append('comment', text);
      if (file) form.append('image', file);
      if (imageUrl) form.append('imageUrl', imageUrl);

      const data = await api.post(`/posts/${post.id}/comments`, form);
      onAdded(data.comment); // tambahkan ke daftar komentar di layar

      // Kosongkan form
      setText('');
      setFile(null);
      setImageUrl('');
      setShowImage(false);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-3 border-t border-neutral-100 pt-3">
      {/* Daftar komentar */}
      {post.comments.length === 0 && <p className="mb-3 text-xs text-neutral-400">Belum ada komentar.</p>}
      {post.comments.map((c) => (
        <div key={c.id} className="mb-3 flex gap-2.5">
          {/* Foto profil pengomentar */}
          <Avatar src={c.author.avatar} name={c.author.name} size="sm" />
          <div className="min-w-0 flex-1 rounded-2xl bg-neutral-50 px-3.5 py-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-neutral-900">{c.author.name}</span>
              <span title={fullTime(c.createdAt)} className="text-xs text-neutral-400">{timeAgo(c.createdAt)}</span>
            </div>
            {/* Teks komentar (React otomatis meng-escape -> aman dari XSS) */}
            {c.comment && <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-neutral-800">{c.comment}</p>}
            {/* Gambar komentar */}
            {c.image && <img src={c.image} alt="Lampiran komentar" className="mt-2 max-h-56 rounded-xl border border-neutral-200" />}
          </div>
        </div>
      ))}

      {/* Form komentar */}
      <form onSubmit={handleSubmit} className="flex gap-2.5">
        <Avatar src={user.avatar} name={user.name} size="sm" />
        <div className="min-w-0 flex-1">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Balas..."
            className="w-full rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm outline-none focus:border-neutral-400"
          />
          {showImage && (
            <div className="mt-2">
              <ImageInput file={file} onFile={setFile} url={imageUrl} onUrl={setImageUrl} />
            </div>
          )}
          <div className="mt-2 flex items-center justify-between">
            <button type="button" onClick={() => setShowImage(!showImage)} className="text-xs text-neutral-500 hover:text-neutral-900">
              {showImage ? 'Tutup gambar' : 'Tambah gambar'}
            </button>
            <button type="submit" disabled={sending} className="rounded-full bg-neutral-900 px-4 py-1 text-xs font-semibold text-white disabled:opacity-50">
              {sending ? 'Mengirim...' : 'Balas'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
