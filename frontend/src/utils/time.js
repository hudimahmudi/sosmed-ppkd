// File ini: mengubah waktu dari database menjadi teks yang mudah dibaca
export function timeAgo(value) {
  const date = new Date(value);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'baru saja';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} hari lalu`;
  // Lebih dari seminggu -> tampilkan tanggal
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Waktu lengkap (dipakai sebagai tooltip saat kursor diarahkan)
export function fullTime(value) {
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
