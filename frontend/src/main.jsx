// File ini: titik awal React
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import App from './App.jsx';
import './index.css';

// Tempelkan aplikasi ke <div id="root">
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* BrowserRouter = mengaktifkan perpindahan halaman */}
    <BrowserRouter>
      {/* AuthProvider = menyimpan data user yang login agar bisa dipakai semua halaman */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
