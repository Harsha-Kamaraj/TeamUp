/**
 * Chat service — shared conversation/message logic used by both the REST
 * controllers and the Socket.IO handlers, so behavior stays consistent.
 */
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import ApiError from '../utils/ApiError.js';

/** Load a conversation and assert the user is a participant. */
export async function assertMembership(conversationId, userId) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw ApiError.notFound('Conversation not found');
  const isMember = conversation.participants.some((p) => p.toString() === userId.toString());
  if (!isMember) throw ApiError.forbidden('You are not part of this conversation');
  return conversation;
}

/** Persist a new message, update the conversation preview, return it populated. */
export async function createMessage({ conversationId, senderId, text, attachment }) {
  const conversation = await assertMembership(conversationId, senderId);

  const trimmed = (text || '').trim();
  if (!trimmed && !attachment?.url) throw ApiError.badRequest('Message cannot be empty');
  if (trimmed.length > 4000) throw ApiError.badRequest('Message is too long');

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    text: trimmed,
    ...(attachment?.url && { attachment }),
    readBy: [senderId], // the sender has implicitly "read" their own message
  });

  // A file-only message still needs a readable preview in the sidebar.
  const preview = trimmed || `📎 ${attachment?.name ?? 'Attachment'}`;
  conversation.lastMessage = { text: preview.slice(0, 200), sender: senderId, at: message.createdAt };
  await conversation.save();

  await message.populate('sender', 'name avatar');

  const recipientIds = conversation.participants
    .map((p) => p.toString())
    .filter((id) => id !== senderId.toString());

  return { message, conversation, recipientIds };
}

/** Mark all of the other party's messages in a conversation as read by `userId`. */
export async function markConversationRead({ conversationId, userId }) {
  const conversation = await assertMembership(conversationId, userId);

  await Message.updateMany(
    { conversation: conversationId, sender: { $ne: userId }, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId } }
  );

  const otherIds = conversation.participants
    .map((p) => p.toString())
    .filter((id) => id !== userId.toString());

  return { conversation, otherIds };
}

// Keep the palette small and predictable — an open emoji field invites abuse
// and makes the reaction row unreadable.
export const ALLOWED_REACTIONS = ['👍', '❤️', '😂', '🎉', '🔥', '👀'];

/**
 * Toggle one person's reaction on a message.
 * Re-sending the same emoji removes it; a different emoji replaces theirs, so
 * each person contributes at most one reaction per message.
 */
export async function toggleReaction({ messageId, userId, emoji }) {
  if (!ALLOWED_REACTIONS.includes(emoji)) throw ApiError.badRequest('Unsupported reaction');

  const message = await Message.findById(messageId);
  if (!message) throw ApiError.notFound('Message not found');
  await assertMembership(message.conversation, userId);

  const uid = userId.toString();
  const existing = message.reactions.find((r) => r.user.toString() === uid);

  if (existing?.emoji === emoji) {
    message.reactions = message.reactions.filter((r) => r.user.toString() !== uid);
  } else if (existing) {
    existing.emoji = emoji;
  } else {
    message.reactions.push({ emoji, user: userId });
  }

  await message.save();

  const participantIds = (await Conversation.findById(message.conversation)).participants.map((p) =>
    p.toString()
  );

  return {
    conversationId: message.conversation.toString(),
    messageId: message.id,
    reactions: message.toJSON().reactions,
    participantIds,
  };
}
