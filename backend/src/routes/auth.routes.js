// File ini: daftar URL untuk autentikasi
import { Router } from 'express';
import { register, login, logout, me } from '../controllers/auth.controller.js';
import { requireAuth, guestOnly } from '../middleware/auth.js';

const router = Router();

router.post('/register', guestOnly, register); // hanya tamu
router.post('/login', guestOnly, login); // hanya tamu
router.post('/logout', requireAuth, logout); // hanya yang sudah login
router.get('/me', requireAuth, me); // cek sesi

export default router;
