// File ini: halaman profil (diri sendiri atau orang lain) + daftar postingannya
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../utils/api.js';
import Avatar from '../components/Avatar.jsx';
import PostCard from '../components/PostCard.jsx';

export default function Profile() {
  const { id } = useParams(); // id pengguna dari URL: /users/:id
  const { user, notify } = useAuth();
  const [profile, setProfile] = useState(null); // data profil dari server
  const [posts, setPosts] = useState([]); // postingan milik pengguna ini
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Ambil profil + postingannya setiap kali id di URL berubah
  useEffect(() => {
    let active = true; // cegah update state kalau halaman sudah ditinggalkan
    setLoading(true);
    setNotFound(false);
    setProfile(null);

    Promise.all([api.get(`/profile/${id}`), api.get(`/posts?userId=${id}`)])
      .then(([profileData, postData]) => {
        if (!active) return;
        setProfile(profileData.profile);
        setPosts(postData.posts);
      })
      .catch((err) => {
        if (!active) return;
        if (err.status === 404) setNotFound(true);
        else notify('error', err.message);
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Post diperbarui (like / komentar / edit) -> ganti post yang id-nya sama
  const handleUpdated = (updated) => setPosts(posts.map((p) => (p.id === updated.id ? updated : p)));

  // Post dihapus -> buang dari daftar
  const handleDeleted = (postId) => setPosts(posts.filter((p) => p.id !== postId));

  const cardClass = 'mt-0 overflow-hidden bg-white sm:mt-4 sm:rounded-3xl sm:border sm:border-neutral-200';

  if (loading) return <div className={cardClass}><p className="p-8 text-center text-sm text-neutral-400">Memuat profil...</p></div>;

  if (notFound || !profile) {
    return (
      <div className={cardClass}>
        <p className="p-8 text-center text-sm text-neutral-500">Pengguna tidak ditemukan.</p>
        <p className="pb-8 text-center text-sm"><Link to="/" className="text-neutral-900 underline">Kembali ke Beranda</Link></p>
      </div>
    );
  }

  const isMe = Number(profile.id) === Number(user.id);
  const joined = new Date(profile.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <div className={cardClass}>
      {/* Kepala profil */}
      <section className="flex items-start gap-4 border-b border-neutral-200 px-5 py-6">
        <Avatar src={profile.avatar} name={profile.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h1 className="break-words text-xl font-bold text-neutral-900">{profile.name}</h1>
            {/* Tombol edit hanya muncul di profil sendiri */}
            {isMe && (
              <Link to="/profile/edit" className="shrink-0 rounded-full border border-neutral-200 px-4 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                Edit profil
              </Link>
            )}
          </div>
          {profile.bio ? (
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-neutral-700">{profile.bio}</p>
          ) : (
            <p className="mt-1 text-sm text-neutral-400">{isMe ? 'Kamu belum menulis bio.' : 'Belum ada bio.'}</p>
          )}
          <p className="mt-3 text-xs text-neutral-500">
            <span className="font-semibold text-neutral-900">{posts.length}</span> postingan · Bergabung {joined}
          </p>
        </div>
      </section>

      {/* Daftar postingan pengguna ini */}
      {posts.length === 0 && (
        <p className="p-8 text-center text-sm text-neutral-400">{isMe ? 'Kamu belum memposting apa pun.' : 'Belum ada postingan.'}</p>
      )}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onUpdated={handleUpdated} onDeleted={handleDeleted} />
      ))}
    </div>
  );
}