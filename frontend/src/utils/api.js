// File ini: fungsi bantu untuk memanggil backend
async function request(path, { method = 'GET', body } = {}) {
  // Opsi dasar: kirim cookie sesi + header anti CSRF
  const options = {
    method,
    credentials: 'include',
    cache: 'no-store',
    headers: { 'X-Requested-With': 'ConnectSpace' },
  };

  if (body instanceof FormData) {
    // FormData (ada file) -> biarkan browser mengatur Content-Type sendiri
    options.body = body;
  } else if (body) {
    // Data biasa -> kirim sebagai JSON
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const res = await fetch('/api' + path, options);
  const data = await res.json().catch(() => ({})); // kalau bukan JSON, pakai objek kosong

  // Status bukan 2xx -> lempar error agar bisa ditangkap dengan try/catch
  if (!res.ok) {
    const error = new Error(data.message || 'Terjadi kesalahan.');
    error.status = res.status;
    error.errors = data.errors || {}; // error per field (untuk form)
    throw error;
  }
  return data;
}

// Jalan pintas: api.get, api.post, api.put, api.del
export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),
};
