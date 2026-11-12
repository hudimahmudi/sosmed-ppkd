// File ini: pilih gambar lewat upload file ATAU tempel URL
import { useState } from 'react';

export default function ImageInput({ file, onFile, url, onUrl, error }) {
  const [useUrl, setUseUrl] = useState(false); // false = mode upload, true = mode URL

  // Ganti mode dan kosongkan pilihan sebelumnya
  function switchMode() {
    onFile(null);
    onUrl('');
    setUseUrl(!useUrl);
  }

  return (
    <div className="text-sm">
      <div className="flex items-center gap-3">
        {useUrl ? (
          // Mode URL: kolom teks
          <input
            type="url"
            value={url}
            onChange={(e) => onUrl(e.target.value)}
            placeholder="https://contoh.com/gambar.jpg"
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 outline-none focus:border-neutral-400"
          />
        ) : (
          // Mode upload: tombol pilih file (input aslinya disembunyikan)
          <label className="cursor-pointer rounded-full border border-neutral-200 px-3 py-1.5 text-neutral-600 hover:bg-neutral-50">
            {file ? file.name.slice(0, 24) : 'Pilih gambar'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => onFile(e.target.files[0] || null)}
            />
          </label>
        )}
        {/* Tombol ganti mode */}
        <button type="button" onClick={switchMode} className="shrink-0 text-neutral-500 underline">
          {useUrl ? 'Upload file' : 'Pakai URL'}
        </button>
      </div>

      {/* Pratinjau gambar yang dipilih */}
      {file && <img src={URL.createObjectURL(file)} alt="Pratinjau" className="mt-3 max-h-48 rounded-xl border border-neutral-200" />}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
