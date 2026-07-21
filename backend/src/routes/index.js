import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';

/**
 * API router — the single mount point for every feature area.
 * Future phases register their routers here, e.g.:
 *   router.use('/posts', postRoutes);     // Phase 6
 *   router.use('/chats', chatRoutes);     // Phase 10
 */
const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

export default router;
