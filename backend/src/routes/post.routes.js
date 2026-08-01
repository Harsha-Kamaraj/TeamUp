import { Router } from 'express';

import * as postController from '../controllers/post.controller.js';
import * as interestController from '../controllers/interest.controller.js';
import * as bookmarkController from '../controllers/bookmark.controller.js';
import validate from '../middleware/validate.js';
import { protect, optionalAuth, requireVerified } from '../middleware/auth.middleware.js';
import { createPostSchema, updatePostSchema } from '../validators/post.validators.js';
import { expressInterestSchema } from '../validators/interest.validators.js';

const router = Router();

// ── Public (read-only browsing) ───────────────────────────────────────────
router.get('/', postController.listPosts); // feed

// "/me" must be declared before "/:id" so it isn't treated as an id.
router.get('/me', protect, postController.getMyPosts); // authenticated

// optionalAuth so the response can note "have I expressed interest?".
router.get('/:id', optionalAuth, postController.getPostById);

// ── Authenticated (create / manage own) ───────────────────────────────────
// `requireVerified` gates anything that publishes content or emails another
// user, so an unconfirmed address can't be used to spam the platform.
// Deleting your own post stays ungated — you can always remove your content.
router.post('/', protect, requireVerified, validate(createPostSchema), postController.createPost);
router.patch('/:id', protect, requireVerified, validate(updatePostSchema), postController.updatePost);
router.delete('/:id', protect, postController.deletePost);

// ── Interest workflow ─────────────────────────────────────────────────────
// Expressing interest emails the post author — verify first.
router.post('/:id/interest', protect, requireVerified, validate(expressInterestSchema), interestController.expressInterest);
router.delete('/:id/interest', protect, interestController.withdrawInterest);
router.get('/:id/interests', protect, interestController.getPostInterests); // author only

// ── Team management ───────────────────────────────────────────────────────
router.get('/:id/team', interestController.getPostTeam); // public
router.patch('/:postId/interests/:interestId', protect, interestController.respondToInterest); // author

// ── Bookmarks ─────────────────────────────────────────────────────────────
router.post('/:id/bookmark', protect, bookmarkController.addBookmark);
router.delete('/:id/bookmark', protect, bookmarkController.removeBookmark);

export default router;
