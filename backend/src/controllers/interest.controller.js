import Interest from '../models/Interest.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendInterestEmail } from '../services/email.service.js';

const INTERESTED_USER_FIELDS = 'name avatar college department year skills';

/**
 * POST /posts/:id/interest
 * Express interest in an opportunity. Notifies the author by email.
 */
export const expressInterest = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw ApiError.notFound('Opportunity not found');

  if (post.author.toString() === req.user.id) {
    throw ApiError.badRequest('You cannot express interest in your own opportunity');
  }
  if (post.status === 'closed') {
    throw ApiError.badRequest('This opportunity is closed');
  }
  if (await Interest.exists({ post: post.id, fromUser: req.user.id })) {
    throw ApiError.conflict('You have already expressed interest in this opportunity');
  }

  const interest = await Interest.create({
    post: post.id,
    fromUser: req.user.id,
    toUser: post.author,
    message: req.body.message,
  });

  // Notify the author (real email if SMTP is configured, else console in dev).
  const author = await User.findById(post.author);
  if (author) {
    await sendInterestEmail(author, req.user, post, req.body.message).catch(() => {
      // Never fail the request just because the email couldn't be sent.
    });
  }

  res.status(201).json(new ApiResponse(201, { interest }, 'Interest sent'));
});

/**
 * DELETE /posts/:id/interest
 * Withdraw a previously expressed interest.
 */
export const withdrawInterest = asyncHandler(async (req, res) => {
  const deleted = await Interest.findOneAndDelete({
    post: req.params.id,
    fromUser: req.user.id,
  });
  if (!deleted) throw ApiError.notFound('You have not expressed interest in this opportunity');
  res.json(new ApiResponse(200, null, 'Interest withdrawn'));
});

/**
 * GET /posts/:id/interests
 * List everyone who expressed interest in a post (author only).
 */
export const getPostInterests = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) throw ApiError.notFound('Opportunity not found');
  if (post.author.toString() !== req.user.id) {
    throw ApiError.forbidden('Only the author can see who is interested');
  }

  const interests = await Interest.find({ post: post.id })
    .sort({ createdAt: -1 })
    .populate('fromUser', INTERESTED_USER_FIELDS);

  res.json(new ApiResponse(200, { interests }, 'Interested students'));
});

/**
 * GET /interests/mine
 * The opportunities the current user has expressed interest in.
 */
export const getMyInterests = asyncHandler(async (req, res) => {
  const interests = await Interest.find({ fromUser: req.user.id })
    .sort({ createdAt: -1 })
    .populate({
      path: 'post',
      populate: { path: 'author', select: 'name avatar college department' },
    });

  // Drop interests whose post was deleted.
  const valid = interests.filter((i) => i.post);
  res.json(new ApiResponse(200, { interests: valid }, 'Your interests'));
});
