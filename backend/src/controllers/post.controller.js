// File ini: feed, posting, edit, hapus post, like (toggle), dan komentar
import db from '../config/db.js';
import { getImageValue, discardUpload } from '../utils/image.js';

// Fitur 1: batas panjang teks postingan (harus sama dengan di frontend)
const MAX_POST_LENGTH = 500;

// Hitung jumlah karakter. Array.from menghitung emoji sebagai 1 karakter.
// Enter dari browser bisa terkirim sebagai \r\n (2 karakter), jadi disamakan jadi \n dulu
// supaya hitungan server sama dengan hitungan di layar.
function countChars(text) {
  return Array.from(text.replace(/\r\n/g, '\n')).length;
}

// Fitur 5: periksa data lokasi dari frontend. Hasil: { value } kalau valid / kosong, { error } kalau tidak.
function parseLocation(body) {
  const name = String(body.locationName ?? '').trim();
  const latRaw = String(body.latitude ?? '').trim();
  const lngRaw = String(body.longitude ?? '').trim();

  // Ketiganya kosong = user memang tidak menambahkan lokasi (boleh)
  if (!name && !latRaw && !lngRaw) return { value: null };

  // Kalau salah satu ada, ketiganya harus ada
  if (!name || !latRaw || !lngRaw) return { error: 'Data lokasi tidak lengkap.' };

  const latitude = Number(latRaw);
  const longitude = Number(lngRaw);
  const validLat = Number.isFinite(latitude) && latitude >= -90 && latitude <= 90;
  const validLng = Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
  if (!validLat || !validLng) return { error: 'Koordinat lokasi tidak valid.' };
  if (name.length > 120) return { error: 'Nama lokasi maksimal 120 karakter.' };

  // Dibulatkan 2 desimal (sekitar 1 km) supaya posisi persis user tidak tersimpan
  const round2 = (n) => Math.round(n * 100) / 100;
  return { value: { name, latitude: round2(latitude), longitude: round2(longitude) } };
}

// Ubah kolom lokasi dari database menjadi objek untuk frontend (null kalau tidak ada lokasi)
function formatLocation(row) {
  if (!row.location_name) return null;
  return {
    name: row.location_name,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
  };
}

// Ubah baris komentar dari database menjadi bentuk yang rapi untuk frontend
function formatComment(row) {
  return {
    id: row.id,
    parentId: row.parent_id ?? null, // Fitur 2: komentar yang dibalas (null = komentar biasa)
    comment: row.comment,
    image: row.image,
    createdAt: row.created_at,
    author: { id: row.user_id, name: row.author_name, avatar: row.author_avatar },
    likeCount: Number(row.like_count ?? 0), // Fitur 3: jumlah like komentar
    likedByMe: Boolean(row.liked_by_me ?? false), // Fitur 3: apakah saya sudah like
  };
}

// Ambil post + komentarnya. authorId diisi kalau hanya ingin post milik satu user (halaman profil)
async function fetchPosts(viewerId, authorId = null) {
  const where = authorId ? 'WHERE p.user_id = ?' : '';
  const params = authorId ? [viewerId, authorId] : [viewerId];

  // Ambil post + data penulis + jumlah like + apakah saya sudah like
  const [posts] = await db.execute(
    `SELECT p.id, p.content, p.image, p.created_at, p.updated_at,
            p.location_name, p.latitude, p.longitude,
            u.id AS author_id, u.name AS author_name, u.avatar AS author_avatar,
            (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
            EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) AS liked_by_me
     FROM posts p
     JOIN users u ON u.id = p.user_id
     ${where}
     ORDER BY p.created_at DESC, p.id DESC`,
    params
  );

  // Ambil semua komentar dari post-post tersebut (sekali query saja)
  let comments = [];
  if (posts.length > 0) {
    const ids = posts.map((p) => p.id);
    const [rows] = await db.query(
      `SELECT c.id, c.post_id, c.user_id, c.parent_id, c.comment, c.image, c.created_at,
              u.name AS author_name, u.avatar AS author_avatar,
              (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) AS like_count,
              EXISTS(SELECT 1 FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = ?) AS liked_by_me
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.post_id IN (?)
       ORDER BY c.created_at ASC, c.id ASC`,
      [viewerId, ids]
    );
    comments = rows;
  }

  // Gabungkan: setiap post membawa daftar komentarnya
  return posts.map((p) => ({
    id: p.id,
    content: p.content,
    image: p.image,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    location: formatLocation(p),
    author: { id: p.author_id, name: p.author_name, avatar: p.author_avatar },
    likeCount: Number(p.like_count),
    likedByMe: Boolean(p.liked_by_me),
    comments: comments.filter((c) => c.post_id === p.id).map(formatComment),
  }));
}

// GET /api/posts -> semua postingan, yang terbaru di paling atas
// GET /api/posts?userId=5 -> hanya postingan milik user 5 (dipakai halaman profil)
export async function listPosts(req, res) {
  let authorId = null;
  if (req.query.userId !== undefined) {
    authorId = Number(req.query.userId);
    if (!Number.isInteger(authorId) || authorId <= 0) {
      return res.status(400).json({ message: 'ID pengguna tidak valid.' });
    }
  }
  res.json({ posts: await fetchPosts(req.user.id, authorId) });
}

// POST /api/posts -> buat status baru
export async function createPost(req, res) {
  const content = String(req.body.content ?? '').trim();
  const image = getImageValue(req);

  // Error URL gambar
  if (image.error) {
    return res.status(422).json({ message: image.error, errors: { imageUrl: image.error } });
  }

  // Fitur 1: teks maksimal 500 karakter (dicek lagi di server walau tombol di frontend sudah disable)
  if (countChars(content) > MAX_POST_LENGTH) {
    discardUpload(req);
    const message = `Postingan maksimal ${MAX_POST_LENGTH} karakter.`;
    return res.status(422).json({ message, errors: { content: message } });
  }

  // Fitur 5: validasi lokasi (opsional, tapi kalau diisi harus valid)
  const location = parseLocation(req.body);
  if (location.error) {
    discardUpload(req);
    return res.status(422).json({ message: location.error, errors: { location: location.error } });
  }

  // Minimal teks atau gambar harus ada
  if (!content && !image.value) {
    discardUpload(req);
    return res.status(422).json({ message: 'Tulis sesuatu atau tambahkan gambar dulu.' });
  }

  // Simpan post (prepared statement)
  const loc = location.value;
  const [result] = await db.execute(
    `INSERT INTO posts (user_id, content, image, location_name, latitude, longitude)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.user.id, content || null, image.value, loc?.name ?? null, loc?.latitude ?? null, loc?.longitude ?? null]
  );

  // Kirim post baru supaya langsung tampil di frontend
  const [rows] = await db.execute(
    'SELECT id, content, image, created_at, location_name, latitude, longitude FROM posts WHERE id = ?',
    [result.insertId]
  );
  res.status(201).json({
    post: {
      id: rows[0].id,
      content: rows[0].content,
      image: rows[0].image,
      createdAt: rows[0].created_at,
      updatedAt: null,
      location: formatLocation(rows[0]),
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

  // Fitur 1: batas 500 karakter juga berlaku saat edit (supaya tidak bisa dilewati lewat edit)
  if (countChars(content) > MAX_POST_LENGTH) {
    discardUpload(req);
    const message = `Postingan maksimal ${MAX_POST_LENGTH} karakter.`;
    return res.status(422).json({ message, errors: { content: message } });
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

// POST /api/posts/comments/:commentId/like -> toggle like / unlike pada komentar (Fitur 3)
export async function toggleCommentLike(req, res) {
  const commentId = req.params.commentId;

  // Pastikan komentar ada
  const [comments] = await db.execute('SELECT id FROM comments WHERE id = ?', [commentId]);
  if (comments.length === 0) {
    return res.status(404).json({ message: 'Komentar tidak ditemukan.' });
  }

  // Cara kerjanya sama dengan like postingan: INSERT IGNORE, kalau sudah ada -> hapus (unlike)
  const [inserted] = await db.execute(
    'INSERT IGNORE INTO comment_likes (user_id, comment_id) VALUES (?, ?)',
    [req.user.id, commentId]
  );

  let liked = true;
  if (inserted.affectedRows === 0) {
    await db.execute('DELETE FROM comment_likes WHERE user_id = ? AND comment_id = ?', [
      req.user.id,
      commentId,
    ]);
    liked = false;
  }

  const [count] = await db.execute('SELECT COUNT(*) AS total FROM comment_likes WHERE comment_id = ?', [
    commentId,
  ]);
  res.json({ liked, likeCount: Number(count[0].total) });
}

// POST /api/posts/:id/comments -> kirim komentar (teks dan/atau gambar)
// Kalau body membawa parentId, komentar ini adalah BALASAN untuk komentar tersebut (Fitur 2)
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

  // Fitur 2: kalau ini balasan, komentar induknya harus ada DAN berada di post yang sama
  let parentId = null;
  const rawParent = String(req.body.parentId ?? '').trim();
  if (rawParent) {
    const [parents] = await db.execute('SELECT id FROM comments WHERE id = ? AND post_id = ?', [
      rawParent,
      req.params.id,
    ]);
    if (parents.length === 0) {
      discardUpload(req);
      return res.status(422).json({ message: 'Komentar yang dibalas tidak ditemukan.' });
    }
    parentId = parents[0].id;
  }

  // Simpan komentar
  const [result] = await db.execute(
    'INSERT INTO comments (post_id, user_id, parent_id, comment, image) VALUES (?, ?, ?, ?, ?)',
    [req.params.id, req.user.id, parentId, text || null, image.value]
  );

  // Ambil komentar yang baru dibuat lengkap dengan data pengirim
  const [rows] = await db.execute(
    `SELECT c.id, c.user_id, c.parent_id, c.comment, c.image, c.created_at,
            u.name AS author_name, u.avatar AS author_avatar
     FROM comments c JOIN users u ON u.id = c.user_id
     WHERE c.id = ?`,
    [result.insertId]
  );
  res.status(201).json({ comment: formatComment(rows[0]) });
}