import Bookmark from '../models/Bookmark.js';
import Post from '../models/Post.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * POST /posts/:id/bookmark
 * Save a post. Idempotent (upsert), so double-saving is harmless.
 */
export const addBookmark = asyncHandler(async (req, res) => {
  const exists = await Post.exists({ _id: req.params.id });
  if (!exists) throw ApiError.notFound('Opportunity not found');

  await Bookmark.updateOne(
    { user: req.user.id, post: req.params.id },
    { $setOnInsert: { user: req.user.id, post: req.params.id } },
    { upsert: true }
  );

  res.status(201).json(new ApiResponse(201, null, 'Saved'));
});

/**
 * DELETE /posts/:id/bookmark
 * Remove a saved post. No error if it wasn't saved.
 */
export const removeBookmark = asyncHandler(async (req, res) => {
  await Bookmark.deleteOne({ user: req.user.id, post: req.params.id });
  res.json(new ApiResponse(200, null, 'Removed'));
});

/**
 * GET /bookmarks
 * The current user's saved opportunities (most recently saved first).
 */
export const getMyBookmarks = asyncHandler(async (req, res) => {
  const bookmarks = await Bookmark.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'post',
      populate: { path: 'author', select: 'name avatar college department' },
    });

  // A saved post may have been deleted — keep only live ones.
  const posts = bookmarks.filter((b) => b.post).map((b) => b.post);
  res.json(new ApiResponse(200, { posts }, 'Saved opportunities'));
});
