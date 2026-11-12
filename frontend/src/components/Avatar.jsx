// File ini: foto profil bulat (kalau belum punya foto, tampil huruf pertama nama)
const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-20 w-20 text-2xl',
};

export default function Avatar({ src, name = '?', size = 'md' }) {
  const sizeClass = SIZES[size];

  // Ada foto -> tampilkan gambar
  if (src) {
    return <img src={src} alt={name} className={`${sizeClass} shrink-0 rounded-full border border-neutral-200 object-cover`} />;
  }

  // Tidak ada foto -> lingkaran abu-abu + huruf pertama
  return (
    <div className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-neutral-200 font-semibold text-neutral-600`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
