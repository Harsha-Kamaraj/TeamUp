import Post from '../models/Post.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// Author fields to include when returning a post (for display).
const AUTHOR_FIELDS = 'name avatar college department';

/**
 * POST /posts
 * Create a new opportunity owned by the current user.
 */
export const createPost = asyncHandler(async (req, res) => {
  const post = await Post.create({ ...req.body, author: req.user.id });
  await post.populate('author', AUTHOR_FIELDS);
  res.status(201).json(new ApiResponse(201, { post }, 'Opportunity created'));
});

/**
 * GET /posts/me
 * List the current user's posts, newest first.
 */
export const getMyPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({ author: req.user.id })
    .sort({ createdAt: -1 })
    .populate('author', AUTHOR_FIELDS);
  res.json(new ApiResponse(200, { posts }, 'Your opportunities'));
});

/**
 * GET /posts/:id
 * Fetch a single opportunity by id.
 */
export const getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate('author', AUTHOR_FIELDS);
  if (!post) throw ApiError.notFound('Opportunity not found');
  res.json(new ApiResponse(200, { post }, 'Opportunity loaded'));
});

// Load a post and ensure the current user owns it (for edit/delete).
async function loadOwnedPost(req) {
  const post = await Post.findById(req.params.id);
  if (!post) throw ApiError.notFound('Opportunity not found');
  if (post.author.toString() !== req.user.id) {
    throw ApiError.forbidden('You can only modify your own opportunities');
  }
  return post;
}

/**
 * PATCH /posts/:id
 * Update an opportunity (author only).
 */
export const updatePost = asyncHandler(async (req, res) => {
  const post = await loadOwnedPost(req);
  Object.assign(post, req.body);
  await post.save();
  await post.populate('author', AUTHOR_FIELDS);
  res.json(new ApiResponse(200, { post }, 'Opportunity updated'));
});

/**
 * DELETE /posts/:id
 * Delete an opportunity (author only).
 */
export const deletePost = asyncHandler(async (req, res) => {
  const post = await loadOwnedPost(req);
  await post.deleteOne();
  res.json(new ApiResponse(200, { id: post.id }, 'Opportunity deleted'));
});
