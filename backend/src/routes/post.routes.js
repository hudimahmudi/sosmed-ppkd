// File ini: daftar URL untuk postingan, like, dan komentar
import { Router } from 'express';
import {
  listPosts,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
} from '../controllers/post.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadImage } from '../middleware/upload.js';

const router = Router();

router.use(requireAuth); // semua rute post wajib login

router.get('/', listPosts); // lihat feed
router.post('/', uploadImage, createPost); // buat post
router.put('/:id', uploadImage, updatePost); // edit post (cek pemilik di controller)
router.delete('/:id', deletePost); // hapus post (cek pemilik di controller)
router.post('/:id/like', toggleLike); // like / unlike
router.post('/:id/comments', uploadImage, addComment); // kirim komentar

export default router;