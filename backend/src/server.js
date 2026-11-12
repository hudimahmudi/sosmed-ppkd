// File ini: titik awal backend (jalankan dengan npm run dev)
import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import './config/db.js'; // memicu pembuatan database & tabel
import { uploadDir } from './middleware/upload.js';
import { csrfLite, noCache } from './middleware/auth.js';
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import postRoutes from './routes/post.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Izinkan frontend (alamat Vite) mengirim cookie sesi
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));

// Baca body JSON dari request
app.use(express.json());

// Pengaturan sesi (disimpan di cookie httpOnly)
app.use(
  session({
    name: 'connectspace.sid',
    secret: process.env.SESSION_SECRET || 'rahasia-dev',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // cookie tidak bisa dibaca JavaScript (anti XSS curi sesi)
      sameSite: 'lax', // cookie tidak dikirim dari website lain
      maxAge: 1000 * 60 * 60 * 24, // 1 hari
    },
  })
);

// Tampilkan file gambar upload
app.use(
  '/uploads',
  express.static(uploadDir, {
    setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff'),
  })
);

// Semua URL /api lewat proteksi CSRF dan no-cache dulu
app.use('/api', noCache, csrfLite);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/posts', postRoutes);

// Penangkap error umum (supaya server tidak crash dan pesan tetap rapi)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Terjadi kesalahan di server.' });
});

app.listen(PORT, () => console.log(`Backend jalan di http://localhost:${PORT}`));
