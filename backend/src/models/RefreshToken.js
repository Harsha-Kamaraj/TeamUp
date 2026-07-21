import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * One document per active refresh token (i.e. per logged-in device/session).
 *
 * We store only the SHA-256 HASH of the token, never the raw value. On
 * refresh we hash the incoming cookie token and look it up here.
 *
 * The TTL index on `expiresAt` tells MongoDB to delete each document the
 * moment it expires — sessions clean themselves up automatically.
 */
const refreshTokenSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // fast "revoke all sessions for this user" queries
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    // Lightweight audit info (handy for a future "active sessions" screen).
    createdByIp: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

// TTL index: expire the document at the exact time stored in `expiresAt`.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = model('RefreshToken', refreshTokenSchema);

export default RefreshToken;
