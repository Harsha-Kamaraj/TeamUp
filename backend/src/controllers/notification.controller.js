import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * GET /notifications
 * Recent notifications (newest first) + the current unread count.
 */
export const getMyNotifications = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('actor', 'name avatar'),
    Notification.countDocuments({ user: req.user.id, read: false }),
  ]);

  res.json(new ApiResponse(200, { notifications, unreadCount }, 'Notifications'));
});

/** PATCH /notifications/:id/read — mark one notification read. */
export const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { read: true },
    { returnDocument: 'after' }
  );
  if (!notification) throw ApiError.notFound('Notification not found');
  res.json(new ApiResponse(200, { notification }, 'Marked as read'));
});

/** PATCH /notifications/read-all — mark all read. */
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
  res.json(new ApiResponse(200, null, 'All notifications marked as read'));
});
