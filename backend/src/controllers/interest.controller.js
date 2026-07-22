import Interest from '../models/Interest.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendInterestEmail } from '../services/email.service.js';
import { notifyInterest, notifyAccepted } from '../services/notification.service.js';

const INTERESTED_USER_FIELDS = 'name avatar college department year skills';

// membersNeeded counts the author, so teammate slots = membersNeeded - 1.
const teammateSlots = (post) => Math.max(0, post.membersNeeded - 1);

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

  // In-app notification (real-time) for the author.
  await notifyInterest({ authorId: post.author, fromUser: req.user, post }).catch(() => {});

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

/**
 * PATCH /posts/:postId/interests/:interestId   { status: 'accepted' | 'rejected' }
 * Author accepts/rejects an interested student. Accepting fills a team slot and
 * auto-closes the post when the team is full.
 */
export const respondToInterest = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['accepted', 'rejected'].includes(status)) {
    throw ApiError.badRequest('Status must be "accepted" or "rejected"');
  }

  const post = await Post.findById(req.params.postId);
  if (!post) throw ApiError.notFound('Opportunity not found');
  if (post.author.toString() !== req.user.id) {
    throw ApiError.forbidden('Only the author can manage requests');
  }

  const interest = await Interest.findOne({ _id: req.params.interestId, post: post.id });
  if (!interest) throw ApiError.notFound('Request not found');

  // Capacity check only matters when moving *into* accepted.
  if (status === 'accepted' && interest.status !== 'accepted') {
    const acceptedCount = await Interest.countDocuments({ post: post.id, status: 'accepted' });
    if (acceptedCount >= teammateSlots(post)) {
      throw ApiError.badRequest('Your team is already full');
    }
  }

  const wasAccepted = interest.status === 'accepted';
  interest.status = status;
  await interest.save();

  if (status === 'accepted' && !wasAccepted) {
    // Auto-close the post once the team is full.
    const acceptedCount = await Interest.countDocuments({ post: post.id, status: 'accepted' });
    if (acceptedCount >= teammateSlots(post) && post.status === 'open') {
      post.status = 'closed';
      await post.save();
    }
    await notifyAccepted({ userId: interest.fromUser, actor: req.user, post }).catch(() => {});
  }

  await interest.populate('fromUser', INTERESTED_USER_FIELDS);
  res.json(new ApiResponse(200, { interest }, `Request ${status}`));
});

/**
 * GET /posts/:id/team   (public)
 * The current team (author + accepted students), the count vs. needed, and
 * which required skills are still missing.
 */
export const getPostTeam = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate('author', 'name avatar skills');
  if (!post) throw ApiError.notFound('Opportunity not found');

  const accepted = await Interest.find({ post: post.id, status: 'accepted' }).populate(
    'fromUser',
    'name avatar skills'
  );

  const members = [
    { id: post.author.id, name: post.author.name, avatar: post.author.avatar, skills: post.author.skills ?? [], isAuthor: true },
    ...accepted
      .filter((i) => i.fromUser)
      .map((i) => ({ id: i.fromUser.id, name: i.fromUser.name, avatar: i.fromUser.avatar, skills: i.fromUser.skills ?? [], isAuthor: false })),
  ];

  // Skills covered by any current member (case-insensitive).
  const covered = new Set(members.flatMap((m) => m.skills.map((s) => s.toLowerCase())));
  const missingSkills = (post.requiredSkills ?? []).filter((s) => !covered.has(s.toLowerCase()));

  res.json(
    new ApiResponse(
      200,
      { members, count: members.length, needed: post.membersNeeded, isFull: members.length >= post.membersNeeded, missingSkills },
      'Team'
    )
  );
});
