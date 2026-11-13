// File ini: penghitung karakter "123/500" (merah kalau melebihi batas)
export default function CharCounter({ count, max }) {
  const over = count > max;
  const nearLimit = count > max * 0.9;
  const color = over ? 'font-semibold text-red-600' : nearLimit ? 'text-amber-600' : 'text-neutral-400';

  return (
    <span aria-live="polite" className={`text-xs tabular-nums ${color}`}>
      {count}/{max}
    </span>
  );
}