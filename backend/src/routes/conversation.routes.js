import { Router } from 'express';

import * as conversationController from '../controllers/conversation.controller.js';
import { protect, requireVerified } from '../middleware/auth.middleware.js';
import { uploadChatFile } from '../middleware/upload.js';

const router = Router();

// All conversation routes require a logged-in user.
router.use(protect);

router.get('/', conversationController.getMyConversations);
// Starting a chat is the only way into a conversation, so gating it here also
// keeps unverified accounts out of the Socket.IO message flow.
router.post('/', requireVerified, conversationController.startConversation);
// Team group chat — lead only. Declared before '/:id/...' routes.
router.post('/team', requireVerified, conversationController.createTeamConversation);
router.get('/:id/messages', conversationController.getMessages);
router.post(
  '/:id/attachment',
  requireVerified,
  uploadChatFile,
  conversationController.uploadAttachment
);

export default router;
