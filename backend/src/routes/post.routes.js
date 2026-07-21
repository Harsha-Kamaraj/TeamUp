import { Router } from 'express';

import * as postController from '../controllers/post.controller.js';
import validate from '../middleware/validate.js';
import { protect } from '../middleware/auth.middleware.js';
import { createPostSchema, updatePostSchema } from '../validators/post.validators.js';

const router = Router();

// All post routes require a logged-in user.
router.use(protect);

router.post('/', validate(createPostSchema), postController.createPost);

// "/me" must be declared before "/:id" so it isn't treated as an id.
router.get('/me', postController.getMyPosts);

router.get('/:id', postController.getPostById);
router.patch('/:id', validate(updatePostSchema), postController.updatePost);
router.delete('/:id', postController.deletePost);

export default router;
