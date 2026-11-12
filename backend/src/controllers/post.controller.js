// File ini: feed, posting, edit, hapus post, like (toggle), dan komentar
import db from '../config/db.js';
import { getImageValue, discardUpload } from '../utils/image.js';

// Ubah baris komentar dari database menjadi bentuk yang rapi untuk frontend
function formatComment(row) {
  return {
    id: row.id,
    comment: row.comment,
    image: row.image,
    createdAt: row.created_at,
    author: { id: row.user_id, name: row.author_name, avatar: row.author_avatar },
  };
}

// GET /api/posts -> semua postingan, yang terbaru di paling atas
export async function listPosts(req, res) {
  // Ambil post + data penulis + jumlah like + apakah saya sudah like
  const [posts] = await db.execute(
    `SELECT p.id, p.content, p.image, p.created_at, p.updated_at,
            u.id AS author_id, u.name AS author_name, u.avatar AS author_avatar,
            (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
            EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) AS liked_by_me
     FROM posts p
     JOIN users u ON u.id = p.user_id
     ORDER BY p.created_at DESC, p.id DESC`,
    [req.user.id]
  );

  // Ambil semua komentar dari post-post tersebut (sekali query saja)
  let comments = [];
  if (posts.length > 0) {
    const ids = posts.map((p) => p.id);
    const [rows] = await db.query(
      `SELECT c.id, c.post_id, c.user_id, c.comment, c.image, c.created_at,
              u.name AS author_name, u.avatar AS author_avatar
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.post_id IN (?)
       ORDER BY c.created_at ASC, c.id ASC`,
      [ids]
    );
    comments = rows;
  }

  // Gabungkan: setiap post membawa daftar komentarnya
  const result = posts.map((p) => ({
    id: p.id,
    content: p.content,
    image: p.image,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    author: { id: p.author_id, name: p.author_name, avatar: p.author_avatar },
    likeCount: Number(p.like_count),
    likedByMe: Boolean(p.liked_by_me),
    comments: comments.filter((c) => c.post_id === p.id).map(formatComment),
  }));

  res.json({ posts: result });
}

// POST /api/posts -> buat status baru
export async function createPost(req, res) {
  const content = String(req.body.content ?? '').trim();
  const image = getImageValue(req);

  // Error URL gambar
  if (image.error) {
    return res.status(422).json({ message: image.error, errors: { imageUrl: image.error } });
  }
  // Minimal teks atau gambar harus ada
  if (!content && !image.value) {
    discardUpload(req);
    return res.status(422).json({ message: 'Tulis sesuatu atau tambahkan gambar dulu.' });
  }

  // Simpan post (prepared statement)
  const [result] = await db.execute(
    'INSERT INTO posts (user_id, content, image) VALUES (?, ?, ?)',
    [req.user.id, content || null, image.value]
  );

  // Kirim post baru supaya langsung tampil di frontend
  const [rows] = await db.execute('SELECT id, content, image, created_at FROM posts WHERE id = ?', [
    result.insertId,
  ]);
  res.status(201).json({
    post: {
      id: rows[0].id,
      content: rows[0].content,
      image: rows[0].image,
      createdAt: rows[0].created_at,
      updatedAt: null,
      author: { id: req.user.id, name: req.user.name, avatar: req.user.avatar },
      likeCount: 0,
      likedByMe: false,
      comments: [],
    },
  });
}

// PUT /api/posts/:id -> edit post (hanya pemilik)
export async function updatePost(req, res) {
  // Ambil post lama dari database
  const [rows] = await db.execute('SELECT user_id, image FROM posts WHERE id = ?', [req.params.id]);
  if (rows.length === 0) {
    discardUpload(req);
    return res.status(404).json({ message: 'Postingan tidak ditemukan.' });
  }
  // CEK KEPEMILIKAN DI SERVER
  if (Number(rows[0].user_id) !== Number(req.user.id)) {
    discardUpload(req);
    return res.status(403).json({ message: 'Kamu tidak boleh mengedit postingan orang lain.' });
  }

  const content = String(req.body.content ?? '').trim();
  const newImage = getImageValue(req); // gambar baru (upload / URL), kalau ada

  // URL gambar tidak valid -> tolak
  if (newImage.error) {
    return res.status(422).json({ message: newImage.error, errors: { imageUrl: newImage.error } });
  }

  // Tentukan gambar akhir: pakai yang lama, kecuali dihapus atau diganti
  let image = rows[0].image;
  if (String(req.body.removeImage) === 'true') image = null; // gambar dihapus
  if (newImage.value) image = newImage.value; // gambar diganti

  // Minimal teks atau gambar harus ada
  if (!content && !image) {
    discardUpload(req);
    return res.status(422).json({ message: 'Tulis sesuatu atau tambahkan gambar dulu.' });
  }

  // Simpan perubahan + catat waktu edit di updated_at
  await db.execute('UPDATE posts SET content = ?, image = ?, updated_at = NOW() WHERE id = ?', [
    content || null,
    image,
    req.params.id,
  ]);

  // Kirim data terbaru ke frontend
  const [updated] = await db.execute('SELECT content, image, updated_at FROM posts WHERE id = ?', [
    req.params.id,
  ]);
  res.json({
    post: { content: updated[0].content, image: updated[0].image, updatedAt: updated[0].updated_at },
  });
}

// DELETE /api/posts/:id -> hanya pemilik post
export async function deletePost(req, res) {
  const [rows] = await db.execute('SELECT user_id FROM posts WHERE id = ?', [req.params.id]);
  if (rows.length === 0) {
    return res.status(404).json({ message: 'Postingan tidak ditemukan.' });
  }
  // CEK KEPEMILIKAN DI SERVER (bukan cuma menyembunyikan tombol)
  if (Number(rows[0].user_id) !== Number(req.user.id)) {
    return res.status(403).json({ message: 'Kamu tidak boleh menghapus postingan orang lain.' });
  }
  // Hapus post. Like & komentar ikut terhapus (ON DELETE CASCADE)
  await db.execute('DELETE FROM posts WHERE id = ?', [req.params.id]);
  res.json({ message: 'Postingan dihapus.' });
}

// POST /api/posts/:id/like -> toggle like / unlike
export async function toggleLike(req, res) {
  const postId = req.params.id;

  // Pastikan post ada
  const [posts] = await db.execute('SELECT id FROM posts WHERE id = ?', [postId]);
  if (posts.length === 0) {
    return res.status(404).json({ message: 'Postingan tidak ditemukan.' });
  }

  // INSERT IGNORE: kalau sudah ada like (UNIQUE user_id+post_id), tidak error dan tidak menambah
  const [inserted] = await db.execute('INSERT IGNORE INTO likes (user_id, post_id) VALUES (?, ?)', [
    req.user.id,
    postId,
  ]);

  let liked = true;
  if (inserted.affectedRows === 0) {
    // Like sudah ada -> berarti user klik ulang -> batalkan (unlike)
    await db.execute('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [req.user.id, postId]);
    liked = false;
  }

  // Hitung ulang jumlah like dari database
  const [count] = await db.execute('SELECT COUNT(*) AS total FROM likes WHERE post_id = ?', [postId]);
  res.json({ liked, likeCount: Number(count[0].total) });
}

// POST /api/posts/:id/comments -> kirim komentar (teks dan/atau gambar)
export async function addComment(req, res) {
  const text = String(req.body.comment ?? '').trim();
  const image = getImageValue(req);

  if (image.error) {
    return res.status(422).json({ message: image.error, errors: { imageUrl: image.error } });
  }
  // Komentar kosong ditolak
  if (!text && !image.value) {
    discardUpload(req);
    return res.status(422).json({ message: 'Komentar tidak boleh kosong.' });
  }

  // Pastikan post ada
  const [posts] = await db.execute('SELECT id FROM posts WHERE id = ?', [req.params.id]);
  if (posts.length === 0) {
    discardUpload(req);
    return res.status(404).json({ message: 'Postingan tidak ditemukan.' });
  }

  // Simpan komentar
  const [result] = await db.execute(
    'INSERT INTO comments (post_id, user_id, comment, image) VALUES (?, ?, ?, ?)',
    [req.params.id, req.user.id, text || null, image.value]
  );

  // Ambil komentar yang baru dibuat lengkap dengan data pengirim
  const [rows] = await db.execute(
    `SELECT c.id, c.user_id, c.comment, c.image, c.created_at,
            u.name AS author_name, u.avatar AS author_avatar
     FROM comments c JOIN users u ON u.id = c.user_id
     WHERE c.id = ?`,
    [result.insertId]
  );
  res.status(201).json({ comment: formatComment(rows[0]) });
}