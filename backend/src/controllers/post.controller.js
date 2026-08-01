import mongoose from 'mongoose';

import Post, { POST_TYPES, POST_MODES } from '../models/Post.js';
import Interest from '../models/Interest.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import escapeRegex from '../utils/escapeRegex.js';

// Author fields to include when returning a post (for display).
// `year` is included so feed cards can show "College · 3rd Year" under the lead.
const AUTHOR_FIELDS = 'name avatar college department year';

/**
 * GET /posts   (public)
 * Paginated feed of open opportunities, newest first, with optional filters.
 *
 * Query params:
 *   page, limit           — pagination (limit max 50)
 *   search                — matches title / description / skills / tags
 *   type                  — one of the POST_TYPES (category)
 *   mode                  — remote | offline | hybrid
 *   skill, tag            — exact (case-insensitive) match within arrays
 *   author                — that student's open opportunities
 */
export const listPosts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));

  const filter = { status: 'open' };

  // Lets a profile page (or a person search) show one student's postings.
  if (req.query.author && mongoose.isValidObjectId(req.query.author)) {
    filter.author = req.query.author;
  }

  // Structured filters (whitelisted against the enums).
  if (req.query.type && POST_TYPES.includes(req.query.type)) filter.type = req.query.type;
  if (req.query.mode && POST_MODES.includes(req.query.mode)) filter.mode = req.query.mode;
  if (req.query.skill) filter.requiredSkills = new RegExp(`^${escapeRegex(req.query.skill.trim())}$`, 'i');
  if (req.query.tag) filter.tags = new RegExp(`^${escapeRegex(req.query.tag.trim())}$`, 'i');

  // Free-text search across the most relevant fields.
  const search = req.query.search?.trim();
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: rx }, { description: rx }, { tags: rx }, { requiredSkills: rx }];
  }

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', AUTHOR_FIELDS),
    Post.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;
  res.json(
    new ApiResponse(
      200,
      { posts, pagination: { page, limit, total, totalPages, hasMore: page < totalPages } },
      'Opportunities'
    )
  );
});

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
 * GET /posts/:id   (optionally authenticated)
 * Fetch a single opportunity. Adds `interestCount`, and for a logged-in
 * viewer, `hasExpressedInterest` (so the UI shows the right button state).
 */
export const getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate('author', AUTHOR_FIELDS);
  if (!post) throw ApiError.notFound('Opportunity not found');

  const interestCount = await Interest.countDocuments({ post: post.id });
  let hasExpressedInterest = false;
  if (req.user) {
    hasExpressedInterest = Boolean(await Interest.exists({ post: post.id, fromUser: req.user.id }));
  }

  res.json(
    new ApiResponse(200, { post: { ...post.toJSON(), interestCount, hasExpressedInterest } }, 'Opportunity loaded')
  );
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
