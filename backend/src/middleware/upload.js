import multer from 'multer';
import ApiError from '../utils/ApiError.js';

/**
 * In-memory file upload (the buffer is streamed straight to Cloudinary, so we
 * never write to disk — important on ephemeral hosts like Render).
 * Restricts to images and caps size at 2 MB.
 */
const storage = multer.memoryStorage();

function imageFilter(_req, file, cb) {
  if (file.mimetype.startsWith('image/')) return cb(null, true);
  cb(new ApiError(400, 'Only image files are allowed'));
}

export const uploadAvatar = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
}).single('avatar');

function pdfFilter(_req, file, cb) {
  if (file.mimetype === 'application/pdf') return cb(null, true);
  cb(new ApiError(400, 'Only PDF files are allowed'));
}

/** Resume upload — a single PDF, up to 5 MB, in the "resume" field. */
export const uploadResume = multer({
  storage,
  fileFilter: pdfFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single('resume');
