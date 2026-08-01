import { Router } from 'express';

import * as userController from '../controllers/user.controller.js';
import validate from '../middleware/validate.js';
import { protect } from '../middleware/auth.middleware.js';
import { uploadAvatar, uploadResume } from '../middleware/upload.js';
import { updateProfileSchema } from '../validators/user.validators.js';

const router = Router();

// ── Authenticated: manage the current user's own profile ──────────────────
router.patch('/me', protect, validate(updateProfileSchema), userController.updateMyProfile);
router.post('/me/avatar', protect, uploadAvatar, userController.uploadMyAvatar);
router.delete('/me/avatar', protect, userController.removeMyAvatar);
router.post('/me/resume', protect, uploadResume, userController.uploadMyResume);
router.delete('/me/resume', protect, userController.removeMyResume);

// ── Public: find students, then view a profile ────────────────────────────
// "/" must come before "/:id" so a search isn't read as an id.
router.get('/', userController.searchUsers);
router.get('/:id', userController.getProfileById);

export default router;
