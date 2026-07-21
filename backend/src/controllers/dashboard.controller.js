import Post from '../models/Post.js';
import Interest from '../models/Interest.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * GET /dashboard/stats
 * Aggregated numbers + recent activity for the current user's dashboard home.
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const me = req.user.id;

  const [postsCount, openPostsCount, interestsReceived, interestsSent, recent] = await Promise.all([
    Post.countDocuments({ author: me }),
    Post.countDocuments({ author: me, status: 'open' }),
    Interest.countDocuments({ toUser: me }),
    Interest.countDocuments({ fromUser: me }),
    Interest.find({ toUser: me })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('fromUser', 'name avatar')
      .populate('post', 'title'),
  ]);

  // A post/user may have been deleted — keep only complete entries.
  const recentInterests = recent
    .filter((i) => i.post && i.fromUser)
    .map((i) => ({
      id: i.id,
      fromUser: i.fromUser,
      post: i.post,
      message: i.message,
      createdAt: i.createdAt,
    }));

  res.json(
    new ApiResponse(
      200,
      { stats: { postsCount, openPostsCount, interestsReceived, interestsSent }, recentInterests },
      'Dashboard stats'
    )
  );
});
