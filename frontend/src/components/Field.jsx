// File ini: satu kolom input form + pesan error di bawahnya
export default function Field({ label, error, textarea = false, ...props }) {
  // Border merah kalau ada error
  const border = error ? 'border-red-500' : 'border-neutral-200 focus:border-neutral-400';
  const inputClass = `w-full rounded-xl border bg-neutral-50 px-4 py-3 text-sm outline-none ${border}`;

  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</label>
      {/* textarea untuk bio, input untuk yang lain */}
      {textarea ? <textarea className={inputClass} rows={3} {...props} /> : <input className={inputClass} {...props} />}
      {/* Pesan error per field */}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
