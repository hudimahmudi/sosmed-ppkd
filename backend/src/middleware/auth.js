// File ini: penjaga rute (auth guard & guest guard)
import db from '../config/db.js';

// AUTH GUARD: hanya pengguna yang sudah login boleh lewat
export async function requireAuth(req, res, next) {
  // Belum ada sesi -> tolak
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Silakan login terlebih dahulu.' });
  }
  // Pastikan user di sesi masih ada di database
  const [rows] = await db.execute(
    'SELECT id, name, email, avatar, bio FROM users WHERE id = ?',
    [req.session.userId]
  );
  if (rows.length === 0) {
    return req.session.destroy(() =>
      res.status(401).json({ message: 'Sesi tidak valid, silakan login ulang.' })
    );
  }
  req.user = rows[0]; // simpan data user agar bisa dipakai controller
  next(); // lanjut ke controller
}

// GUEST GUARD: hanya tamu (belum login) yang boleh lewat
export function guestOnly(req, res, next) {
  if (req.session.userId) {
    return res.status(403).json({ message: 'Kamu sudah login.' });
  }
  next();
}

// Proteksi CSRF sederhana: request POST/PUT/DELETE wajib membawa header khusus.
// Form dari website lain tidak bisa menambahkan header ini.
export function csrfLite(req, res, next) {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) return next();
  if (req.get('X-Requested-With') !== 'ConnectSpace') {
    return res.status(403).json({ message: 'Permintaan ditolak (CSRF).' });
  }
  next();
}

// Cegah browser menyimpan cache respon API (supaya tombol Back aman setelah logout)
export function noCache(req, res, next) {
  res.set('Cache-Control', 'no-store');
  next();
}
