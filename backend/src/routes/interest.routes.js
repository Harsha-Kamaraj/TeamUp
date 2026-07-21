import { Router } from 'express';

import * as interestController from '../controllers/interest.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Opportunities the current user has expressed interest in.
router.get('/mine', protect, interestController.getMyInterests);

export default router;
