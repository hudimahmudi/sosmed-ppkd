// File ini: daftar komentar (bisa dibalas & di-like) + form kirim komentar
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';
import { fullTime, timeAgo } from '../utils/time.js';
import Avatar from './Avatar.jsx';
import ImageInput from './ImageInput.jsx';

// Balasan hanya menjorok ke dalam sampai 2 tingkat. Balasan yang lebih dalam
// tetap ditampilkan sejajar (ada tulisan "membalas ..." supaya jelas siapa yang dibalas)
// agar tampilan tidak makin sempit di layar HP.
const MAX_NESTED_LEVEL = 2;

// ===== Form kirim komentar / balasan =====
// parentId = null -> komentar biasa. parentId = id komentar -> balasan untuk komentar itu.
function CommentForm({ postId, parentId = null, placeholder, submitLabel, showAvatar = true, autoFocus = false, onAdded, onCancel }) {
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
      if (parentId) form.append('parentId', String(parentId)); // penanda ini adalah balasan
      if (file) form.append('image', file);
      if (imageUrl) form.append('imageUrl', imageUrl);

      const data = await api.post(`/posts/${postId}/comments`, form);
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
    <form onSubmit={handleSubmit} className="flex gap-2.5">
      {showAvatar && <Avatar src={user.avatar} name={user.name} size="sm" />}
      <div className="min-w-0 flex-1">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
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
          <div className="flex items-center gap-3">
            {/* Tombol Batal hanya ada di form balasan */}
            {onCancel && (
              <button type="button" onClick={onCancel} className="text-xs text-neutral-500 hover:text-neutral-900">
                Batal
              </button>
            )}
            <button type="submit" disabled={sending} className="rounded-full bg-neutral-900 px-4 py-1 text-xs font-semibold text-white disabled:opacity-50">
              {sending ? 'Mengirim...' : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

// ===== Satu komentar + tombol like/balas + balasan-balasannya (rekursif) =====
function CommentNode({ comment, depth, ctx }) {
  const { notify } = useAuth();
  const { post, tree, byId, replyingTo, setReplyingTo, onAdded, onCommentUpdated } = ctx;
  const [busy, setBusy] = useState(false); // cegah klik like berulang saat loading

  const parent = comment.parentId ? byId[comment.parentId] : null; // komentar yang dibalas
  const replies = tree[comment.id] || [];
  const nested = depth < MAX_NESTED_LEVEL; // balasan menjorok atau sejajar?

  // Aksi klik Like pada komentar (toggle)
  async function handleLike() {
    if (busy) return;
    setBusy(true);
    try {
      const data = await api.post(`/posts/comments/${comment.id}/like`);
      onCommentUpdated({ ...comment, likeCount: data.likeCount, likedByMe: data.liked });
    } catch (err) {
      notify('error', err.message);
    } finally {
      setBusy(false);
    }
  }

  // Balasan terkirim -> tampilkan di layar lalu tutup form balasan
  function handleReplyAdded(reply) {
    onAdded(reply);
    setReplyingTo(null);
  }

  const isReplying = replyingTo === comment.id;

  return (
    <div>
      <div className="mb-3 flex gap-2.5">
        {/* Foto profil pengomentar (klik untuk melihat profil) */}
        <Link to={`/users/${comment.author.id}`} aria-label={`Lihat profil ${comment.author.name}`} className="shrink-0">
          <Avatar src={comment.author.avatar} name={comment.author.name} size="sm" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl bg-neutral-50 px-3.5 py-2.5">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <Link to={`/users/${comment.author.id}`} className="text-sm font-semibold text-neutral-900 hover:underline">
                {comment.author.name}
              </Link>
              <span title={fullTime(comment.createdAt)} className="text-xs text-neutral-400">{timeAgo(comment.createdAt)}</span>
            </div>
            {/* Penanda kalau ini balasan: siapa yang dibalas */}
            {parent && <p className="text-xs text-neutral-400">↪ membalas {parent.author.name}</p>}
            {/* Teks komentar (React otomatis meng-escape -> aman dari XSS) */}
            {comment.comment && <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-neutral-800">{comment.comment}</p>}
            {/* Gambar komentar */}
            {comment.image && <img src={comment.image} alt="Lampiran komentar" className="mt-2 max-h-56 rounded-xl border border-neutral-200" />}
          </div>

          {/* Tombol Like & Balas */}
          <div className="mt-1 flex items-center gap-4 px-2 text-xs">
            <button
              onClick={handleLike}
              disabled={busy}
              aria-pressed={comment.likedByMe}
              aria-label={comment.likedByMe ? 'Batalkan suka komentar' : 'Sukai komentar'}
              className={`flex items-center gap-1 ${comment.likedByMe ? 'font-semibold text-red-600' : 'text-neutral-500 hover:text-neutral-900'}`}
            >
              <span>{comment.likedByMe ? '♥' : '♡'}</span>
              <span>{comment.likeCount}</span>
            </button>
            <button
              onClick={() => setReplyingTo(isReplying ? null : comment.id)}
              className="text-neutral-500 hover:text-neutral-900"
            >
              {isReplying ? 'Tutup' : 'Balas'}
            </button>
          </div>

          {/* Form balasan (hanya satu form balasan yang terbuka dalam satu waktu) */}
          {isReplying && (
            <div className="mt-2">
              <CommentForm
                postId={post.id}
                parentId={comment.id}
                placeholder={`Balas ${comment.author.name}...`}
                submitLabel="Kirim"
                showAvatar={false}
                autoFocus
                onAdded={handleReplyAdded}
                onCancel={() => setReplyingTo(null)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Balasan-balasan untuk komentar ini */}
      {replies.length > 0 &&
        (nested ? (
          // Menjorok ke dalam, garis tipis di kiri sebagai penanda satu utas
          <div className="ml-4 border-l-2 border-neutral-100 pl-3">
            {replies.map((r) => (
              <CommentNode key={r.id} comment={r} depth={depth + 1} ctx={ctx} />
            ))}
          </div>
        ) : (
          // Sudah terlalu dalam -> sejajar (tidak menjorok lagi)
          <div>
            {replies.map((r) => (
              <CommentNode key={r.id} comment={r} depth={depth} ctx={ctx} />
            ))}
          </div>
        ))}
    </div>
  );
}

export default function CommentSection({ post, onAdded, onCommentUpdated }) {
  const [replyingTo, setReplyingTo] = useState(null); // id komentar yang sedang dibalas (null = tidak ada)

  // Susun komentar menjadi pohon: byId = cari komentar lewat id, tree = daftar balasan per komentar
  const byId = {};
  post.comments.forEach((c) => (byId[c.id] = c));
  const tree = {};
  const roots = []; // komentar tingkat atas (bukan balasan)
  post.comments.forEach((c) => {
    if (c.parentId && byId[c.parentId]) (tree[c.parentId] ||= []).push(c);
    else roots.push(c);
  });

  const ctx = { post, tree, byId, replyingTo, setReplyingTo, onAdded, onCommentUpdated };

  return (
    <div className="mt-3 border-t border-neutral-100 pt-3">
      {/* Daftar komentar */}
      {post.comments.length === 0 && <p className="mb-3 text-xs text-neutral-400">Belum ada komentar.</p>}
      {roots.map((c) => (
        <CommentNode key={c.id} comment={c} depth={0} ctx={ctx} />
      ))}

      {/* Form komentar baru */}
      <CommentForm postId={post.id} placeholder="Balas..." submitLabel="Balas" onAdded={onAdded} />
    </div>
  );
}