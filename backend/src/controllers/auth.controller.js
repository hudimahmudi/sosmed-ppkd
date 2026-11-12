// File ini: registrasi, login, logout, dan cek sesi
import bcrypt from 'bcryptjs';
import db from '../config/db.js';

// Pola email sederhana
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Ambil data user yang aman ditampilkan (tanpa password)
async function getPublicUser(id) {
  const [rows] = await db.execute(
    'SELECT id, name, email, avatar, bio, created_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0];
}

// Buat sesi baru. regenerate() = ganti ID sesi (cegah session fixation)
function startSession(req, userId) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = userId; // tanda bahwa user sudah login
      resolve();
    });
  });
}

// POST /api/auth/register
export async function register(req, res) {
  // Ambil & bersihkan input dari body
  const name = String(req.body.name ?? '').trim();
  const email = String(req.body.email ?? '').trim().toLowerCase();
  const password = String(req.body.password ?? '');
  const passwordConfirm = String(req.body.passwordConfirm ?? '');

  // Kumpulkan error per field
  const errors = {};
  if (!name) errors.name = 'Nama lengkap wajib diisi.';
  else if (name.length > 100) errors.name = 'Nama maksimal 100 karakter.';

  if (!EMAIL_REGEX.test(email) || email.length > 150) {
    errors.email = 'Format email tidak valid.';
  } else {
    // Cek email sudah dipakai atau belum
    const [exist] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (exist.length > 0) errors.email = 'Email sudah terdaftar.';
  }

  if (password.length < 6) errors.password = 'Password minimal 6 karakter.';
  if (password !== passwordConfirm) errors.passwordConfirm = 'Konfirmasi password tidak cocok.';

  // Ada error -> berhenti, data TIDAK disimpan
  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ message: 'Data belum valid.', errors });
  }

  // Hash password (bcrypt) sebelum disimpan
  const hash = await bcrypt.hash(password, 10);

  // Simpan user baru (prepared statement)
  const [result] = await db.execute(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    [name, email, hash]
  );

  // AUTO-LOGIN: langsung buat sesi, tidak lewat halaman login
  await startSession(req, result.insertId);

  res.status(201).json({ user: await getPublicUser(result.insertId) });
}

// POST /api/auth/login
export async function login(req, res) {
  const email = String(req.body.email ?? '').trim().toLowerCase();
  const password = String(req.body.password ?? '');

  // Cari user berdasarkan email
  const [rows] = await db.execute('SELECT id, password FROM users WHERE email = ?', [email]);
  const user = rows[0];

  // Bandingkan password dengan hash. Pesan error SAMA untuk email salah / password salah
  const passwordOk = user ? await bcrypt.compare(password, user.password) : false;
  if (!passwordOk) {
    return res.status(401).json({ message: 'Email atau password salah.' });
  }

  // Login berhasil -> buat sesi baru
  await startSession(req, user.id);
  res.json({ user: await getPublicUser(user.id) });
}

// POST /api/auth/logout
export function logout(req, res) {
  // Hancurkan seluruh sesi di server
  req.session.destroy(() => {
    res.clearCookie('connectspace.sid'); // hapus cookie sesi di browser
    res.json({ message: 'Berhasil logout.' });
  });
}

// GET /api/auth/me -> dipakai frontend untuk tahu siapa yang sedang login
export async function me(req, res) {
  res.json({ user: req.user }); // req.user diisi oleh middleware requireAuth
}
