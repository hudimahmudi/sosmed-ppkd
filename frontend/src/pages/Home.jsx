// File ini: Beranda / Feed (gaya Threads)
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';
import PostForm from '../components/PostForm.jsx';
import PostCard from '../components/PostCard.jsx';

export default function Home() {
  const { notify } = useAuth();
  const [posts, setPosts] = useState([]); // daftar postingan
  const [loading, setLoading] = useState(true);

  // Ambil feed dari backend saat halaman pertama dibuka
  useEffect(() => {
    api
      .get('/posts')
      .then((data) => setPosts(data.posts))
      .catch((err) => notify('error', err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Post baru -> taruh di paling atas
  const handleCreated = (post) => setPosts([post, ...posts]);

  // Post diperbarui (like / komentar) -> ganti post yang id-nya sama
  const handleUpdated = (updated) => setPosts(posts.map((p) => (p.id === updated.id ? updated : p)));

  // Post dihapus -> buang dari daftar
  const handleDeleted = (id) => setPosts(posts.filter((p) => p.id !== id));

  return (
    <div className="mt-0 overflow-hidden bg-white sm:mt-4 sm:rounded-3xl sm:border sm:border-neutral-200">
      {/* Form status baru */}
      <PostForm onCreated={handleCreated} />

      {/* Status memuat / kosong */}
      {loading && <p className="p-8 text-center text-sm text-neutral-400">Memuat feed...</p>}
      {!loading && posts.length === 0 && (
        <p className="p-8 text-center text-sm text-neutral-400">Belum ada postingan. Jadi yang pertama menulis!</p>
      )}

      {/* Daftar postingan */}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onUpdated={handleUpdated} onDeleted={handleDeleted} />
      ))}
    </div>
  );
}
