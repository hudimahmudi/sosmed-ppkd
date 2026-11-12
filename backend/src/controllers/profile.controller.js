// File ini: ubah profil dan ubah password
import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { getImageValue, discardUpload } from '../utils/image.js';

// PUT /api/profile
export async function updateProfile(req, res) {
  const name = String(req.body.name ?? '').trim();
  const bio = String(req.body.bio ?? '').trim();

  // Validasi input
  const errors = {};
  if (!name) errors.name = 'Nama pengguna wajib diisi.';
  else if (name.length > 100) errors.name = 'Nama maksimal 100 karakter.';
  if (bio.length > 160) errors.bio = 'Bio maksimal 160 karakter.';

  // Ambil foto profil baru (upload atau URL)
  const image = getImageValue(req);
  if (image.error) errors.imageUrl = image.error;

  if (Object.keys(errors).length > 0) {
    discardUpload(req); // buang file upload kalau validasi gagal
    return res.status(422).json({ message: 'Data belum valid.', errors });
  }

  // Kalau tidak ada foto baru, pakai foto lama
  const avatar = image.value ?? req.user.avatar;

  // Simpan perubahan (prepared statement)
  await db.execute('UPDATE users SET name = ?, bio = ?, avatar = ? WHERE id = ?', [
    name,
    bio || null,
    avatar,
    req.user.id,
  ]);

  // Kirim data user terbaru
  const [rows] = await db.execute('SELECT id, name, email, avatar, bio FROM users WHERE id = ?', [
    req.user.id,
  ]);
  res.json({ user: rows[0] });
}

// PUT /api/profile/password
export async function changePassword(req, res) {
  const oldPassword = String(req.body.oldPassword ?? '');
  const newPassword = String(req.body.newPassword ?? '');
  const newPasswordConfirm = String(req.body.newPasswordConfirm ?? '');

  // Ambil hash password saat ini dari database
  const [rows] = await db.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);

  const errors = {};
  // WAJIB verifikasi password lama dulu
  if (!(await bcrypt.compare(oldPassword, rows[0].password))) {
    errors.oldPassword = 'Password lama salah.';
  }
  if (newPassword.length < 6) errors.newPassword = 'Password baru minimal 6 karakter.';
  if (newPassword !== newPasswordConfirm) {
    errors.newPasswordConfirm = 'Konfirmasi password baru tidak cocok.';
  }
  if (Object.keys(errors).length > 0) {
    return res.status(422).json({ message: 'Password gagal diubah.', errors });
  }

  // Hash password baru lalu simpan
  const hash = await bcrypt.hash(newPassword, 10);
  await db.execute('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);

  res.json({ message: 'Password berhasil diubah.' });
}
