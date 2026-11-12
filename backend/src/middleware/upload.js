// File ini: aturan upload gambar yang aman (pakai multer)
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Folder upload ada DI LUAR folder src (jadi bukan tempat kode dijalankan)
export const uploadDir = path.join(__dirname, '../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });

// Hanya tipe MIME ini yang boleh, ekstensi file ditentukan dari MIME (bukan dari nama asli)
const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// Simpan ke disk dengan nama acak (nama asli dibuang)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const randomName = crypto.randomBytes(16).toString('hex');
    cb(null, randomName + MIME_TO_EXT[file.mimetype]);
  },
});

// Filter: cek MIME DAN ekstensi nama file
function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (MIME_TO_EXT[file.mimetype] && ALLOWED_EXT.includes(ext)) {
    cb(null, true); // lolos
  } else {
    cb(new Error('Format gambar harus jpg, jpeg, png, gif, atau webp.'));
  }
}

// Batas ukuran 2 MB dan hanya 1 file
const upload = multer({ storage, fileFilter, limits: { fileSize: 2 * 1024 * 1024, files: 1 } });

// Middleware yang dipakai di route: terima 1 file dari field bernama "image"
export function uploadImage(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) {
      // Ubah error multer menjadi pesan yang mudah dibaca
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'Ukuran gambar maksimal 2 MB.' : err.message;
      return res.status(400).json({ message, errors: { image: message } });
    }
    next();
  });
}
