import { Router } from 'express';
import mongoose from 'mongoose';
import env from '../config/env.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';

const router = Router();

// Human-readable Mongoose connection states.
const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

/**
 * GET /health
 * Lightweight readiness probe. Used to confirm the API is up and to see
 * whether the database is connected. Handy for uptime monitors and Render.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const data = {
      status: 'ok',
      environment: env.nodeEnv,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      database: DB_STATES[mongoose.connection.readyState] ?? 'unknown',
    };
    res.status(200).json(new ApiResponse(200, data, 'TeamUp API is healthy'));
  })
);

export default router;
