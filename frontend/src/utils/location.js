// File ini: mengambil lokasi pengguna (GPS browser) lalu mengubahnya menjadi nama tempat

// Pesan error yang ramah untuk tiap kode error dari browser
const GEO_ERRORS = {
  1: 'Izin lokasi ditolak. Aktifkan izin lokasi di browser untuk menambahkan lokasi.',
  2: 'Lokasi tidak tersedia saat ini. Coba lagi.',
  3: 'Mengambil lokasi terlalu lama. Coba lagi.',
};

// Minta koordinat ke browser (browser akan menampilkan popup izin)
function getCoords() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      return reject(new Error('Browser kamu tidak mendukung fitur lokasi.'));
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(new Error(GEO_ERRORS[err.code] || 'Gagal mengambil lokasi.')),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  });
}

// Ubah koordinat menjadi nama kota/provinsi lewat OpenStreetMap Nominatim (gratis, tanpa API key)
async function lookupPlaceName(latitude, longitude) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000); // batalkan kalau lebih dari 6 detik
  try {
    const url =
      'https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&accept-language=id' +
      `&lat=${latitude}&lon=${longitude}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error('lookup gagal');
    const data = await res.json();

    const a = data.address || {};
    const city = a.city || a.town || a.village || a.municipality || a.county || a.state_district || data.name;
    // Buang duplikat (misal kota dan provinsi sama-sama "Jakarta")
    const parts = [city, a.state].filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i);
    return parts.join(', ').slice(0, 120) || null;
  } finally {
    clearTimeout(timer);
  }
}

// Fungsi utama: hasilnya { name, latitude, longitude }
export async function getCurrentLocation() {
  const coords = await getCoords();

  // Dibulatkan 2 desimal (sekitar 1 km): cukup untuk nama kota dan lebih menjaga privasi
  const latitude = Number(coords.latitude.toFixed(2));
  const longitude = Number(coords.longitude.toFixed(2));

  let name = null;
  try {
    name = await lookupPlaceName(latitude, longitude);
  } catch {
    // Gagal mencari nama (offline / diblokir) -> pakai koordinat saja sebagai cadangan
  }
  return { name: name || `${latitude}, ${longitude}`, latitude, longitude };
}