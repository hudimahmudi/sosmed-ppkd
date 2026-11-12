// File ini: fungsi bantu untuk gambar (hasil upload ATAU input URL)
import fs from 'fs';

// Cek apakah URL valid dan memakai http/https
function isValidImageUrl(value) {
  try {
    const url = new URL(value);
    const protocolOk = url.protocol === 'http:' || url.protocol === 'https:';
    return protocolOk && value.length <= 255;
  } catch {
    return false; // new URL() error = bukan URL
  }
}

// Ambil nilai gambar dari request: prioritas file upload, lalu URL
export function getImageValue(req) {
  // 1) Ada file upload -> simpan path-nya
  if (req.file) return { value: `/uploads/${req.file.filename}` };

  // 2) Tidak ada file -> cek input URL
  const url = String(req.body?.imageUrl ?? '').trim();
  if (!url) return { value: null }; // tidak ada gambar sama sekali
  if (!isValidImageUrl(url)) {
    return { value: null, error: 'URL gambar harus diawali http:// atau https://' };
  }
  return { value: url };
}

// Hapus file yang sudah terlanjur diupload kalau validasi akhirnya gagal
export function discardUpload(req) {
  if (req.file) fs.unlink(req.file.path, () => {});
}
