/**
 * MongoDB connection via Mongoose.
 *
 * Exposes `connectDatabase()` which the server calls on startup. We keep
 * connection concerns (retries, event logging, graceful shutdown) here so
 * the rest of the app never touches the driver directly.
 */
import mongoose from 'mongoose';
import env from './env.js';
import logger from '../utils/logger.js';

// Fail queries fast instead of buffering forever when disconnected.
mongoose.set('strictQuery', true);

/**
 * Connect to MongoDB. Returns the mongoose connection on success.
 *
 * Behavior on failure:
 *   - production  → rethrow so the process manager (Render) restarts us.
 *   - development → log a clear warning and keep running, so you can still
 *                   hit /health while setting up MongoDB Atlas.
 */
export async function connectDatabase() {
  if (!env.mongoUri) {
    const message =
      'MONGODB_URI is not set — skipping database connection. ' +
      'Set it in backend/.env to enable data features.';
    if (env.isProduction) throw new Error(message);
    logger.warn(message);
    return null;
  }

  try {
    const connection = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    logger.info(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    if (env.isProduction) throw error;
    logger.warn('Continuing without a database (development mode).');
    return null;
  }
}

// Surface connection lifecycle events so problems are visible in the logs.
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected.');
});
mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected.');
});

/** Cleanly close the connection during shutdown. */
export async function disconnectDatabase() {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed.');
}
