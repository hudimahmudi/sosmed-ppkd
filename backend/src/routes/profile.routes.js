// File ini: daftar URL untuk profil
import { Router } from 'express';
import { updateProfile, changePassword } from '../controllers/profile.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';

const router = Router();

router.use(requireAuth); // semua rute profil wajib login

router.put('/', uploadImage, updateProfile); // ubah nama, bio, foto
router.put('/password', changePassword); // ubah password

export default router;
