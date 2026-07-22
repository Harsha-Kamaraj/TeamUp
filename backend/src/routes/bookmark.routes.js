import { Router } from 'express';

import * as bookmarkController from '../controllers/bookmark.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', protect, bookmarkController.getMyBookmarks);

export default router;
