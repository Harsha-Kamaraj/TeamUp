/**
 * Cloudinary image upload service.
 *
 * Configured lazily from env. If Cloudinary credentials are absent, uploads
 * throw a clear 503 (ApiError) instead of crashing — the rest of the app
 * (profiles without a photo) keeps working. Set CLOUDINARY_* in .env to enable.
 */
import { v2 as cloudinary } from 'cloudinary';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

let configured = false;

function ensureConfigured() {
  if (!env.cloudinary.isConfigured) {
    throw new ApiError(503, 'Image upload is not configured on the server.');
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: env.cloudinary.cloudName,
      api_key: env.cloudinary.apiKey,
      api_secret: env.cloudinary.apiSecret,
      secure: true,
    });
    configured = true;
  }
}

/**
 * Upload an image buffer to Cloudinary.
 * @param {Buffer} buffer   the file bytes (from multer memory storage)
 * @param {object} options  { folder, publicId }
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export function uploadImage(buffer, { folder = 'teamup/avatars', publicId } = {}) {
  ensureConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        overwrite: true,
        // Normalize avatars: square, face-focused, reasonable size.
        transformation: [
          { width: 512, height: 512, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error) return reject(new ApiError(502, 'Image upload failed. Please try again.'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

/** Delete an image by its public_id. Best-effort — never throws. */
export async function deleteImage(publicId) {
  if (!publicId || !env.cloudinary.isConfigured) return;
  try {
    ensureConfigured();
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // Ignore deletion failures (e.g. already gone).
  }
}
