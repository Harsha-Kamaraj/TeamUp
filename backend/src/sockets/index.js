import { Server } from 'socket.io';
import env from '../config/env.js';
import logger from '../utils/logger.js';
import { socketAuth } from './socketAuth.js';
import { createMessage, markConversationRead } from '../services/chat.service.js';

// userId -> number of active connections (supports multiple tabs).
const online = new Map();

/**
 * Attach Socket.IO to the HTTP server and wire the real-time chat events.
 *
 * Rooms: each socket joins `user:<id>`. Messages/typing/read-receipts are
 * emitted to the relevant users' personal rooms, so delivery works no matter
 * which conversation a user is currently viewing.
 */
export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.clientUrls, credentials: true },
  });

  io.use(socketAuth);

  io.on('connection', (socket) => {
    const { userId } = socket;
    socket.join(`user:${userId}`);

    // ── Presence ──────────────────────────────────────────────────────────
    const prev = online.get(userId) ?? 0;
    online.set(userId, prev + 1);
    if (prev === 0) socket.broadcast.emit('presence:online', { userId });
    // Tell the newcomer who's already online.
    socket.emit('presence:init', { online: [...online.keys()] });

    // ── Send a message ────────────────────────────────────────────────────
    socket.on('message:send', async ({ conversationId, text }, ack) => {
      try {
        const { message, recipientIds } = await createMessage({
          conversationId,
          senderId: userId,
          text,
        });
        const payload = { conversationId, message: message.toJSON() };
        // Deliver to the sender (tab sync) and every recipient.
        io.to(`user:${userId}`).emit('message:new', payload);
        recipientIds.forEach((rid) => io.to(`user:${rid}`).emit('message:new', payload));
        ack?.({ ok: true, message: message.toJSON() });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    // ── Typing indicator ──────────────────────────────────────────────────
    socket.on('typing', ({ conversationId, toUserId, typing }) => {
      if (toUserId) {
        io.to(`user:${toUserId}`).emit('typing', { conversationId, userId, typing: !!typing });
      }
    });

    // ── Read receipts ─────────────────────────────────────────────────────
    socket.on('conversation:read', async ({ conversationId }, ack) => {
      try {
        const { otherIds } = await markConversationRead({ conversationId, userId });
        otherIds.forEach((oid) =>
          io.to(`user:${oid}`).emit('conversation:read', { conversationId, by: userId })
        );
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    // ── Disconnect ────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const remaining = (online.get(userId) ?? 1) - 1;
      if (remaining <= 0) {
        online.delete(userId);
        socket.broadcast.emit('presence:offline', { userId });
      } else {
        online.set(userId, remaining);
      }
    });
  });

  logger.info('Socket.IO initialized');
  return io;
}
