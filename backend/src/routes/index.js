import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import postRoutes from './post.routes.js';
import interestRoutes from './interest.routes.js';
import conversationRoutes from './conversation.routes.js';
import dashboardRoutes from './dashboard.routes.js';

/**
 * API router — the single mount point for every feature area.
 * Future phases register their routers here, e.g.:
 *   router.use('/posts', postRoutes);     // Phase 6
 *   router.use('/chats', chatRoutes);     // Phase 10
 */
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/interests', interestRoutes);
router.use('/conversations', conversationRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
