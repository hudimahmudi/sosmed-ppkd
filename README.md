# ConnectSpace – MVP Aplikasi Media Sosial Internal

Aplikasi mirip Threads. Frontend: React + Vite + Tailwind CSS. Backend: Express + MySQL.

## Struktur folder
```
connectspace/
├── backend/
│   ├── uploads/                 <- hasil upload gambar (di luar src)
│   └── src/
│       ├── server.js            <- titik awal Express
│       ├── config/db.js         <- koneksi MySQL + buat 4 tabel
│       ├── middleware/          <- auth.js (guard, CSRF), upload.js (multer)
│       ├── routes/              <- daftar URL
│       ├── controllers/         <- logika (auth, profile, post)
│       └── utils/image.js       <- validasi gambar upload/URL
└── frontend/
    └── src/
        ├── main.jsx, App.jsx    <- awal React + daftar rute
        ├── context/AuthContext.jsx
        ├── components/          <- Navbar, PostCard, PostForm, CommentSection, dll
        ├── pages/               <- Login, Register, Home, EditProfile, ChangePassword
        └── utils/               <- api.js, time.js
```

## Cara menjalankan (butuh Node.js 20+ dan MySQL aktif)
1. Backend
   ```
   cd backend
   npm install
   cp .env.example .env     # lalu isi DB_USER / DB_PASSWORD sesuai MySQL kamu
   npm run dev
   ```
   Database `connectspace` dan 4 tabel dibuat otomatis saat server pertama jalan.
2. Frontend (terminal baru)
   ```
   cd frontend
   npm install
   npm run dev
   ```
3. Buka http://localhost:5173

## Rute API
| Method | URL | Akses |
| --- | --- | --- |
| POST | /api/auth/register | Tamu |
| POST | /api/auth/login | Tamu |
| POST | /api/auth/logout | Login |
| GET | /api/auth/me | Login |
| PUT | /api/profile | Login |
| PUT | /api/profile/password | Login |
| GET / POST | /api/posts | Login |
| DELETE | /api/posts/:id | Login + pemilik |
| POST | /api/posts/:id/like | Login |
| POST | /api/posts/:id/comments | Login |

## Pemetaan ke rubrik PRD
1. Database 4 tabel, FK ON DELETE CASCADE, UNIQUE(user_id, post_id) -> `backend/src/config/db.js`
2. Registrasi + auto-login -> `auth.controller.js` (fungsi `register` memanggil `startSession`)
3. Auth guard / guest guard / logout -> `middleware/auth.js`, `ProtectedRoute.jsx`, `GuestRoute.jsx`
4. Profil + ubah password (cek password lama) -> `profile.controller.js`
5. Posting & hapus oleh pemilik (cek di server) -> `post.controller.js`
6. Like toggle & komentar bergambar -> `toggleLike`, `addComment`
7. Keamanan: prepared statement (`db.execute`), bcrypt, upload divalidasi, regenerate sesi, header anti-CSRF

## Skenario uji cepat
- Daftar akun baru -> langsung masuk Beranda tanpa form login.
- Buka http://localhost:5173/ setelah logout -> diarahkan ke Login dengan peringatan.
- Klik like dua kali -> like bertambah lalu berkurang.
- Login dengan akun kedua -> tombol Hapus tidak muncul di postingan akun pertama.
