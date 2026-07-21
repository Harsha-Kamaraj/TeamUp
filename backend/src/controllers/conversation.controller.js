import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { assertMembership } from '../services/chat.service.js';

// Reshape a conversation for the client: expose the *other* participant.
function shape(conversation, meId, unreadCount = 0) {
  const other = conversation.participants.find((p) => p._id.toString() !== meId.toString());
  return {
    id: conversation._id.toString(),
    other: other
      ? { id: other._id.toString(), name: other.name, avatar: other.avatar }
      : null,
    post: conversation.post,
    lastMessage: conversation.lastMessage?.at ? conversation.lastMessage : null,
    unreadCount,
    updatedAt: conversation.updatedAt,
  };
}

/**
 * GET /conversations
 * The current user's conversations, most-recently-active first, each with the
 * other participant, a last-message preview, and an unread count.
 */
export const getMyConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user.id })
    .sort({ updatedAt: -1 })
    .populate('participants', 'name avatar');

  const ids = conversations.map((c) => c._id);
  const unreadAgg = await Message.aggregate([
    { $match: { conversation: { $in: ids }, sender: { $ne: req.user._id }, readBy: { $ne: req.user._id } } },
    { $group: { _id: '$conversation', count: { $sum: 1 } } },
  ]);
  const unreadMap = Object.fromEntries(unreadAgg.map((u) => [u._id.toString(), u.count]));

  const data = conversations.map((c) => shape(c, req.user.id, unreadMap[c._id.toString()] ?? 0));
  res.json(new ApiResponse(200, { conversations: data }, 'Your conversations'));
});

/**
 * POST /conversations   { userId, postId? }
 * Start (or return the existing) conversation with another user.
 */
export const startConversation = asyncHandler(async (req, res) => {
  const { userId, postId } = req.body;

  if (!mongoose.isValidObjectId(userId)) throw ApiError.badRequest('Invalid user id');
  if (userId === req.user.id) throw ApiError.badRequest('You cannot message yourself');

  const other = await User.findById(userId).select('name avatar');
  if (!other) throw ApiError.notFound('User not found');

  const conversation = await Conversation.findOrCreateBetween(req.user.id, userId, postId);
  await conversation.populate('participants', 'name avatar');

  res.status(201).json(new ApiResponse(201, { conversation: shape(conversation, req.user.id) }, 'Conversation ready'));
});

/**
 * GET /conversations/:id/messages?before=<ISO>&limit=
 * Paginated messages (oldest→newest within the page). `before` pages older.
 */
export const getMessages = asyncHandler(async (req, res) => {
  await assertMembership(req.params.id, req.user.id);

  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 30));
  const filter = { conversation: req.params.id };
  if (req.query.before) {
    const before = new Date(req.query.before);
    if (!Number.isNaN(before.getTime())) filter.createdAt = { $lt: before };
  }

  const found = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .populate('sender', 'name avatar');

  const hasMore = found.length > limit;
  if (hasMore) found.pop();
  found.reverse(); // return oldest → newest

  res.json(new ApiResponse(200, { messages: found, hasMore }, 'Messages'));
});
