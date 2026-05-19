import { Router } from 'express';
import multer from 'multer';
import { uploadImage, deleteImage } from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP and GIF are allowed.'));
    }
  },
});

const router = Router();

router.post('/', authenticate, upload.single('image'), uploadImage);
router.delete('/:publicId', authenticate, deleteImage);

export default router;
