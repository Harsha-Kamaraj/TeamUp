import { Router } from 'express';

import * as postController from '../controllers/post.controller.js';
import validate from '../middleware/validate.js';
import { protect } from '../middleware/auth.middleware.js';
import { createPostSchema, updatePostSchema } from '../validators/post.validators.js';

const router = Router();

// ── Public (read-only browsing) ───────────────────────────────────────────
router.get('/', postController.listPosts); // feed

// "/me" must be declared before "/:id" so it isn't treated as an id.
router.get('/me', protect, postController.getMyPosts); // authenticated

router.get('/:id', postController.getPostById); // public single view

// ── Authenticated (create / manage own) ───────────────────────────────────
router.post('/', protect, validate(createPostSchema), postController.createPost);
router.patch('/:id', protect, validate(updatePostSchema), postController.updatePost);
router.delete('/:id', protect, postController.deletePost);

export default router;
