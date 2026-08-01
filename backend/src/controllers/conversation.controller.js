import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Interest from '../models/Interest.js';
import { notifySystem } from '../services/notification.service.js';
import { uploadImage } from '../services/cloudinary.service.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { assertMembership } from '../services/chat.service.js';

const brief = (u) => ({ id: u._id.toString(), name: u.name, avatar: u.avatar });

/**
 * Reshape a conversation for the client.
 *
 * Direct threads expose the *other* participant as `other`. Group chats have no
 * single "other", so they carry `name` and the full `members` list instead —
 * the client switches on `isGroup`.
 */
function shape(conversation, meId, unreadCount = 0) {
  const others = conversation.participants.filter((p) => p._id.toString() !== meId.toString());
  return {
    id: conversation._id.toString(),
    isGroup: !!conversation.isGroup,
    name: conversation.name || '',
    owner: conversation.owner?.toString() ?? null,
    other: conversation.isGroup ? null : (others[0] ? brief(others[0]) : null),
    members: conversation.isGroup ? conversation.participants.map(brief) : [],
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
 * POST /conversations/team   { postId, name? }
 * Create (or return) the group chat for a post's team.
 *
 * Only the post author can create it — they're the lead. Members are the
 * author plus everyone whose interest was accepted. Re-calling this syncs
 * newly-accepted members into the existing group, so the lead can just press
 * the button again after the team grows.
 */
export const createTeamConversation = asyncHandler(async (req, res) => {
  const { postId, name } = req.body;
  if (!mongoose.isValidObjectId(postId)) throw ApiError.badRequest('Invalid post id');

  const post = await Post.findById(postId).populate('author', 'name avatar');
  if (!post) throw ApiError.notFound('Opportunity not found');
  if (post.author.id !== req.user.id) {
    throw ApiError.forbidden('Only the team lead can create the team chat');
  }

  const accepted = await Interest.find({ post: post.id, status: 'accepted' }).select('fromUser');
  const memberIds = [
    post.author.id,
    ...accepted.map((i) => i.fromUser?.toString()).filter(Boolean),
  ];
  const unique = [...new Set(memberIds)];

  if (unique.length < 2) {
    throw ApiError.badRequest('Accept at least one teammate before starting the team chat');
  }

  // Default to the lead's name, matching how students refer to their squad.
  const groupName = (name?.trim() || `${post.author.name}'s team`).slice(0, 80);

  let conversation = await Conversation.findOne({ post: post.id, isGroup: true });
  if (conversation) {
    // Add anyone accepted since the group was made; never remove.
    const existing = new Set(conversation.participants.map((p) => p.toString()));
    const added = unique.filter((id) => !existing.has(id));
    if (added.length) conversation.participants.push(...added);
    if (name?.trim()) conversation.name = groupName;
    if (added.length || name?.trim()) await conversation.save();
  } else {
    conversation = await Conversation.create({
      participants: unique,
      // Groups get a real pairKey rather than leaving it unset. The unique
      // index on pairKey may pre-date this feature and be non-sparse, in which
      // case every group without one indexes as `null` and the second group
      // ever created collides. A per-post key sidesteps that on any existing
      // database, and doubles as the "one group chat per post" guarantee.
      pairKey: `group:${post.id}`,
      isGroup: true,
      name: groupName,
      owner: post.author.id,
      post: post.id,
    });

    await Promise.all(
      unique
        .filter((id) => id !== req.user.id)
        .map((id) =>
          notifySystem({
            userId: id,
            text: `You were added to "${groupName}" 💬`,
            link: `/chat/${conversation.id}`,
          }).catch(() => {})
        )
    );
  }

  await conversation.populate('participants', 'name avatar');
  res
    .status(201)
    .json(new ApiResponse(201, { conversation: shape(conversation, req.user.id) }, 'Team chat ready'));
});

/**
 * POST /conversations/:id/attachment   (multipart/form-data, field "file")
 *
 * Uploads a chat file and returns its metadata. The client then sends a normal
 * socket message carrying that metadata — binary doesn't belong on the socket,
 * and this way delivery/ordering logic stays in one place.
 */
export const uploadAttachment = asyncHandler(async (req, res) => {
  await assertMembership(req.params.id, req.user.id);
  if (!req.file) throw ApiError.badRequest('No file provided');

  const isImage = req.file.mimetype.startsWith('image/');
  const { url, publicId } = await uploadImage(req.file.buffer, {
    folder: 'squadly/chat',
    // Unique per upload so two files with the same name never collide.
    publicId: `chat_${req.params.id}_${Date.now()}`,
    resourceType: isImage ? 'image' : 'raw',
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        attachment: {
          url,
          publicId,
          name: req.file.originalname?.slice(0, 200) ?? 'file',
          mime: req.file.mimetype,
          size: req.file.size,
        },
      },
      'File uploaded'
    )
  );
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
