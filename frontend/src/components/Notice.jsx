// File ini: kotak notifikasi sukses / gagal
export default function Notice({ notice }) {
  // Tidak ada notifikasi -> tidak menampilkan apa-apa
  if (!notice) return null;

  // Warna hijau untuk sukses, merah untuk error
  const color = notice.type === 'success' ? 'bg-neutral-900 text-white' : 'bg-red-600 text-white';

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div role="status" className={`rounded-full px-5 py-2.5 text-sm font-medium shadow-lg ${color}`}>
        {notice.text}
      </div>
    </div>
  );
}
