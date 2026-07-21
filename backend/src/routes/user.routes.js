import { Router } from 'express';

import * as userController from '../controllers/user.controller.js';
import validate from '../middleware/validate.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadAvatar } from '../middleware/upload.js';
import { updateProfileSchema } from '../validators/user.validators.js';

const router = Router();

// ── Authenticated: manage the current user's own profile ──────────────────
router.patch('/me', protect, validate(updateProfileSchema), userController.updateMyProfile);
router.post('/me/avatar', protect, uploadAvatar, userController.uploadMyAvatar);
router.delete('/me/avatar', protect, userController.removeMyAvatar);

// ── Public: view a profile (email/last-login hidden in the controller) ────
router.get('/:id', userController.getProfileById);

export default router;
