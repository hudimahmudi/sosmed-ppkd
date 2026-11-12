// File ini: satu kartu postingan (teks, gambar, like, komentar, menu edit/hapus)
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';
import { fullTime, timeAgo } from '../utils/time.js';
import Avatar from './Avatar.jsx';
import CommentSection from './CommentSection.jsx';
import ImageInput from './ImageInput.jsx';

export default function PostCard({ post, onUpdated, onDeleted }) {
  const { user, notify } = useAuth();
  const [showComments, setShowComments] = useState(false); // buka/tutup komentar
  const [busy, setBusy] = useState(false); // cegah klik like berulang saat loading

  // State menu titik tiga
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null); // penanda area menu (untuk deteksi klik di luar)

  // State mode edit
  const [editing, setEditing] = useState(false); // true = sedang mengedit
  const [editText, setEditText] = useState(''); // isi teks saat diedit
  const [editFile, setEditFile] = useState(null); // gambar baru (upload)
  const [editUrl, setEditUrl] = useState(''); // gambar baru (URL)
  const [removeImage, setRemoveImage] = useState(false); // hapus gambar lama?
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Menu dan tombol edit hanya tampil untuk pemilik (server tetap memeriksa lagi)
  const isOwner = Number(post.author.id) === Number(user.id);

  // Tutup menu kalau klik di luar atau tekan Escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Aksi klik Like (toggle)
  async function handleLike() {
    if (busy) return;
    setBusy(true);
    try {
      const data = await api.post(`/posts/${post.id}/like`);
      // Perbarui jumlah like & status like dari jawaban server
      onUpdated({ ...post, likeCount: data.likeCount, likedByMe: data.liked });
    } catch (err) {
      notify('error', err.message);
    } finally {
      setBusy(false);
    }
  }

  // Aksi klik Hapus di menu
  async function handleDelete() {
    setMenuOpen(false);
    if (!window.confirm('Hapus postingan ini?')) return; // minta konfirmasi dulu
    try {
      await api.del(`/posts/${post.id}`);
      onDeleted(post.id); // hilangkan dari layar
      notify('success', 'Postingan dihapus.');
    } catch (err) {
      notify('error', err.message);
    }
  }

  // Aksi klik Edit di menu: masuk mode edit dengan isi awal = data post sekarang
  function handleEditStart() {
    setMenuOpen(false);
    setEditText(post.content || '');
    setEditFile(null);
    setEditUrl('');
    setRemoveImage(false);
    setEditError('');
    setEditing(true);
  }

  // Aksi klik Batal
  function handleEditCancel() {
    setEditing(false);
  }

  // Aksi klik Simpan
  async function handleEditSave(e) {
    e.preventDefault();
    setEditError('');
    setSaving(true);
    try {
      // FormData karena bisa membawa file gambar baru
      const form = new FormData();
      form.append('content', editText);
      if (editFile) form.append('image', editFile);
      if (editUrl) form.append('imageUrl', editUrl);
      if (removeImage) form.append('removeImage', 'true');

      const data = await api.put(`/posts/${post.id}`, form);

      // Perbarui post di layar dengan data terbaru dari server
      onUpdated({
        ...post,
        content: data.post.content,
        image: data.post.image,
        updatedAt: data.post.updatedAt,
      });
      setEditing(false);
      notify('success', 'Postingan berhasil diedit.');
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Aksi komentar baru berhasil dikirim
  function handleCommentAdded(comment) {
    onUpdated({ ...post, comments: [...post.comments, comment] });
  }

  return (
    <article className="flex gap-3 border-b border-neutral-200 px-5 py-4">
      {/* Foto profil penulis di samping postingan */}
      <Avatar src={post.author.avatar} name={post.author.name} />

      <div className="min-w-0 flex-1">
        {/* Baris nama + waktu + menu titik tiga */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-semibold text-neutral-900">{post.author.name}</span>
            <span title={fullTime(post.createdAt)} className="text-xs text-neutral-400">{timeAgo(post.createdAt)}</span>
            {/* Penanda kalau post pernah diedit */}
            {post.updatedAt && (
              <span title={fullTime(post.updatedAt)} className="text-xs text-neutral-400">· diedit</span>
            )}
          </div>

          {/* Menu titik tiga: Edit + Hapus jadi satu (hanya untuk pemilik) */}
          {isOwner && !editing && (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Menu postingan"
                className="rounded-full px-2 py-0.5 text-lg leading-none text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
              >
                ···
              </button>

              {menuOpen && (
                <div role="menu" className="absolute right-0 z-10 mt-1 w-36 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
                  <button onClick={handleEditStart} role="menuitem" className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100">
                    Edit
                  </button>
                  <button onClick={handleDelete} role="menuitem" className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                    Hapus
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {editing ? (
          // ====== MODE EDIT ======
          <form onSubmit={handleEditSave} className="mt-2">
            {/* Kolom teks */}
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-[15px] outline-none focus:border-neutral-400"
            />

            {/* Gambar lama (kalau ada dan belum dihapus) */}
            {post.image && !removeImage && (
              <div className="mt-2">
                <img src={post.image} alt="Gambar saat ini" className="max-h-48 rounded-xl border border-neutral-200" />
                <button type="button" onClick={() => setRemoveImage(true)} className="mt-1 text-xs text-red-600 underline">
                  Hapus gambar
                </button>
              </div>
            )}
            {post.image && removeImage && (
              <p className="mt-2 text-xs text-neutral-500">
                Gambar akan dihapus.{' '}
                <button type="button" onClick={() => setRemoveImage(false)} className="underline">Batalkan</button>
              </p>
            )}

            {/* Pilih gambar baru (ganti / tambah) */}
            <div className="mt-2">
              <ImageInput file={editFile} onFile={setEditFile} url={editUrl} onUrl={setEditUrl} />
            </div>

            {editError && <p className="mt-2 text-xs text-red-600">{editError}</p>}

            {/* Tombol Batal & Simpan */}
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={handleEditCancel} className="rounded-full border border-neutral-200 px-4 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50">
                Batal
              </button>
              <button type="submit" disabled={saving} className="rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        ) : (
          // ====== MODE LIHAT BIASA ======
          <>
            {/* Teks status */}
            {post.content && <p className="mt-1 whitespace-pre-wrap break-words text-[15px] text-neutral-800">{post.content}</p>}

            {/* Gambar status */}
            {post.image && <img src={post.image} alt="Gambar postingan" className="mt-3 max-h-96 w-full rounded-2xl border border-neutral-200 object-cover" />}
          </>
        )}

        {/* Tombol aksi: like & komentar */}
        <div className="mt-3 flex items-center gap-5 text-sm">
          <button
            onClick={handleLike}
            disabled={busy}
            aria-pressed={post.likedByMe}
            className={`flex items-center gap-1.5 ${post.likedByMe ? 'font-semibold text-red-600' : 'text-neutral-500 hover:text-neutral-900'}`}
          >
            <span>{post.likedByMe ? '♥' : '♡'}</span>
            <span>{post.likeCount}</span>
          </button>
          <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900">
            <span>Komentar</span>
            <span>{post.comments.length}</span>
          </button>
        </div>

        {/* Bagian komentar (muncul kalau dibuka) */}
        {showComments && <CommentSection post={post} onAdded={handleCommentAdded} />}
      </div>
    </article>
  );
}