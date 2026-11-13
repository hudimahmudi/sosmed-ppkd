// File ini: aturan batas panjang teks (harus sama dengan MAX_POST_LENGTH di backend)
export const MAX_POST_LENGTH = 500;

// Hitung karakter. Array.from menghitung emoji sebagai 1 karakter (bukan 2),
// dan hitungannya sama dengan yang dipakai server.
export function countChars(text) {
  return Array.from(text).length;
}