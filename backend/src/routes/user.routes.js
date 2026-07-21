import { Router } from 'express';

import * as userController from '../controllers/user.controller.js';
import validate from '../middleware/validate.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadAvatar } from '../middleware/upload.js';
import { updateProfileSchema } from '../validators/user.validators.js';

const router = Router();

// Everything here requires a logged-in user.
router.use(protect);

// Current user's profile management.
router.patch('/me', validate(updateProfileSchema), userController.updateMyProfile);
router.post('/me/avatar', uploadAvatar, userController.uploadMyAvatar);
router.delete('/me/avatar', userController.removeMyAvatar);

// View another user's public profile. Keep last so it doesn't shadow /me.
router.get('/:id', userController.getProfileById);

export default router;
