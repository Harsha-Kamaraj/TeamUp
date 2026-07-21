/**
 * Server entry point.
 *
 * Responsibilities:
 *   1. Connect to the database.
 *   2. Start the HTTP server.
 *   3. Handle graceful shutdown and last-resort crash safety.
 *
 * The HTTP server is created explicitly with `http.createServer` (rather than
 * `app.listen`) so Socket.IO can attach to it for realtime chat.
 */
import http from 'node:http';

import app from './app.js';
import env from './config/env.js';
import logger from './utils/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { initSocket } from './sockets/index.js';

const server = http.createServer(app);

// Attach Socket.IO (realtime chat) to the same HTTP server.
initSocket(server);

async function start() {
  // Try the DB first (won't crash in dev if it's not configured yet).
  await connectDatabase();

  server.listen(env.port, () => {
    logger.info(`TeamUp API running in ${env.nodeEnv} mode`);
    logger.info(`Listening on http://localhost:${env.port}`);
    logger.info(`Health check: http://localhost:${env.port}${env.apiPrefix}/health`);
  });
}

/** Close the HTTP server and DB connection, then exit. */
async function shutdown(signal) {
  logger.warn(`${signal} received — shutting down gracefully...`);
  server.close(async () => {
    await disconnectDatabase().catch(() => {});
    logger.info('HTTP server closed. Bye 👋');
    process.exit(0);
  });

  // Force-exit if graceful shutdown stalls.
  setTimeout(() => {
    logger.error('Could not close connections in time — forcing exit.');
    process.exit(1);
  }, 10000).unref();
}

// OS/termination signals (Ctrl+C locally, SIGTERM on Render).
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Last-resort safety nets so an unexpected error doesn't leave a zombie process.
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled promise rejection: ${reason}`);
});
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught exception: ${error.stack || error.message}`);
  process.exit(1);
});

start().catch((error) => {
  logger.error(`Failed to start server: ${error.stack || error.message}`);
  process.exit(1);
});
