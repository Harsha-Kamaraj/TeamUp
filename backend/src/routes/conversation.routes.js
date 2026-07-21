import { Router } from 'express';

import * as conversationController from '../controllers/conversation.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// All conversation routes require a logged-in user.
router.use(protect);

router.get('/', conversationController.getMyConversations);
router.post('/', conversationController.startConversation);
router.get('/:id/messages', conversationController.getMessages);

export default router;
