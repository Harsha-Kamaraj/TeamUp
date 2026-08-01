/**
 * Attachment cleanup.
 *
 * Messages are removed automatically by a MongoDB TTL index, but MongoDB has no
 * idea Cloudinary exists — so without this, every shared file would stay in
 * Cloudinary forever while its message vanished. On a free tier that quietly
 * fills the quota with files nobody can reach.
 *
 * This sweeps slightly BEFORE the TTL fires: while the message document (and
 * therefore the Cloudinary public_id) is still around to act on.
 */
import Message, { MESSAGE_RETENTION_DAYS } from '../models/Message.js';
import { deleteImage } from './cloudinary.service.js';
import logger from '../utils/logger.js';

// Run a day early so we always win the race against the TTL sweeper.
const CLEANUP_AFTER_DAYS = MESSAGE_RETENTION_DAYS - 1;
const SWEEP_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours

/** Delete Cloudinary files for messages about to expire. Safe to call anytime. */
export async function sweepExpiredAttachments() {
  const cutoff = new Date(Date.now() - CLEANUP_AFTER_DAYS * 24 * 60 * 60 * 1000);

  const stale = await Message.find({
    createdAt: { $lt: cutoff },
    'attachment.publicId': { $exists: true, $ne: null },
  })
    .select('attachment')
    .limit(500); // bounded so one sweep can't stall the event loop

  if (stale.length === 0) return { removed: 0 };

  let removed = 0;
  for (const message of stale) {
    const isImage = message.attachment?.mime?.startsWith('image/');
    // Best-effort: deleteImage never throws.
    await deleteImage(message.attachment.publicId, {
      resourceType: isImage ? 'image' : 'raw',
    });
    // Clear the reference so a retry doesn't try to delete it twice.
    message.attachment = undefined;
    await message.save({ validateBeforeSave: false });
    removed += 1;
  }

  logger.info(`Attachment cleanup: removed ${removed} expired file(s) from Cloudinary`);
  return { removed };
}

/** Start the periodic sweep. Returns a stop function. */
export function startAttachmentCleanup() {
  // Kick off shortly after boot rather than immediately, so startup stays fast.
  const first = setTimeout(() => {
    sweepExpiredAttachments().catch((e) => logger.error(`Attachment cleanup failed: ${e.message}`));
  }, 60 * 1000);

  const timer = setInterval(() => {
    sweepExpiredAttachments().catch((e) => logger.error(`Attachment cleanup failed: ${e.message}`));
  }, SWEEP_INTERVAL_MS);

  // Don't hold the process open on shutdown.
  first.unref();
  timer.unref();

  return () => {
    clearTimeout(first);
    clearInterval(timer);
  };
}
