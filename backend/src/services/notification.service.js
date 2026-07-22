/**
 * Notification service — creates notifications and pushes them in real time
 * over Socket.IO (via the socket registry, to avoid an import cycle).
 */
import Notification from '../models/Notification.js';
import { emitToUser } from '../sockets/registry.js';

function push(userId, notification) {
  emitToUser(userId, 'notification:new', notification.toJSON());
}

/** Generic create + push. */
export async function createNotification(data) {
  const notification = await Notification.create(data);
  push(data.user, notification);
  return notification;
}

/** Someone expressed interest in one of the user's posts. */
export async function notifyInterest({ authorId, fromUser, post }) {
  return createNotification({
    user: authorId,
    type: 'interest',
    actor: fromUser.id,
    post: post.id,
    text: `${fromUser.name} is interested in "${post.title}"`,
    link: `/posts/${post.id}`,
  });
}

/**
 * New message notification — deduped to ONE unread notification per
 * conversation (updated to the latest sender), so a burst of messages doesn't
 * flood the bell.
 */
export async function notifyMessage({ recipientId, sender, conversationId }) {
  const notification = await Notification.findOneAndUpdate(
    { user: recipientId, type: 'message', conversation: conversationId, read: false },
    {
      $set: {
        actor: sender.id,
        text: `New message from ${sender.name}`,
        link: `/chat/${conversationId}`,
      },
      $setOnInsert: { user: recipientId, type: 'message', conversation: conversationId },
    },
    { upsert: true, returnDocument: 'after' }
  );
  push(recipientId, notification);
  return notification;
}

/** Mark message notifications for a conversation as read (when the user opens it). */
export async function markConversationNotificationsRead({ userId, conversationId }) {
  await Notification.updateMany(
    { user: userId, type: 'message', conversation: conversationId, read: false },
    { $set: { read: true } }
  );
}

/** A one-off system/welcome notification. */
export async function notifySystem({ userId, text, link = '' }) {
  return createNotification({ user: userId, type: 'system', text, link });
}

/** Tell a student they were accepted onto a post's team. */
export async function notifyAccepted({ userId, actor, post }) {
  return createNotification({
    user: userId,
    type: 'team',
    actor: actor?.id,
    post: post.id,
    text: `You've been accepted to "${post.title}" 🎉`,
    link: `/posts/${post.id}`,
  });
}
