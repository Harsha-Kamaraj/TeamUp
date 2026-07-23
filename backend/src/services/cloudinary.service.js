/**
 * Image upload service.
 *
 * Uses Cloudinary when its credentials are configured (ideal for production).
 * When they're absent — e.g. local development — it transparently falls back to
 * saving the image on local disk under backend/uploads and serving it via the
 * /uploads static route. That way avatar upload works out of the box with zero
 * setup, and you can flip on Cloudinary later just by setting CLOUDINARY_* env.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { v2 as cloudinary } from 'cloudinary';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

let configured = false;

function ensureCloudinary() {
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

/** Guess a file extension from magic bytes (local fallback only). */
function extFromBuffer(buffer) {
  if (buffer.length >= 4 && buffer.toString('ascii', 0, 4) === '%PDF') return 'pdf';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50) return 'png';
  if (buffer.length >= 4 && buffer.toString('ascii', 0, 4) === 'GIF8') return 'gif';
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  )
    return 'webp';
  return 'png';
}

/** Save the buffer to backend/uploads and return a publicly-servable URL. */
function saveToDisk(buffer, publicId) {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  const base = (publicId || `img_${Date.now()}`).replace(/[^a-z0-9_-]/gi, '_');
  // Remove any previous file for this base (possibly a different extension) so
  // re-uploads replace the old image instead of leaving orphans.
  for (const f of fs.readdirSync(UPLOADS_DIR)) {
    if (f.startsWith(`${base}.`)) fs.unlinkSync(path.join(UPLOADS_DIR, f));
  }

  const filename = `${base}.${extFromBuffer(buffer)}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);

  // Cache-bust with ?v= so the browser reloads the replaced image immediately.
  return { url: `${env.serverUrl}/uploads/${filename}?v=${Date.now()}`, publicId: `local:${filename}` };
}

/**
 * Upload an image buffer.
 * @param {Buffer} buffer   the file bytes (from multer memory storage)
 * @param {object} options  { folder, publicId }
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export function uploadImage(buffer, { folder = 'squadly/avatars', publicId, resourceType = 'image' } = {}) {
  if (!env.cloudinary.isConfigured) {
    return Promise.resolve(saveToDisk(buffer, publicId));
  }

  ensureCloudinary();
  const isImage = resourceType === 'image';

  return new Promise((resolve, reject) => {
    const options = {
      folder,
      public_id: publicId,
      resource_type: isImage ? 'image' : 'raw',
      overwrite: true,
    };
    if (isImage) {
      // Normalize avatars: square, face-focused, reasonable size.
      options.transformation = [
        { width: 512, height: 512, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ];
    } else {
      options.format = 'pdf';
    }

    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(new ApiError(502, 'Upload failed. Please try again.'));
      resolve({ url: result.secure_url, publicId: result.public_id });
    });
    stream.end(buffer);
  });
}

/** Delete an uploaded file by its public_id. Best-effort — never throws. */
export async function deleteImage(publicId, { resourceType = 'image' } = {}) {
  if (!publicId) return;

  // Local-disk fallback files are tagged with a "local:" prefix.
  if (publicId.startsWith('local:')) {
    try {
      fs.unlinkSync(path.join(UPLOADS_DIR, publicId.slice('local:'.length)));
    } catch {
      // Already gone — ignore.
    }
    return;
  }

  if (!env.cloudinary.isConfigured) return;
  try {
    ensureCloudinary();
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType === 'image' ? 'image' : 'raw',
    });
  } catch {
    // Ignore deletion failures (e.g. already gone).
  }
}
