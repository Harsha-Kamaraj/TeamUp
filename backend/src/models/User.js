import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import env from '../config/env.js';
import { generateToken } from '../utils/crypto.utils.js';

const { Schema, model } = mongoose;

// Cost factor for bcrypt. 12 is a good balance of security vs. speed in 2024+.
const BCRYPT_SALT_ROUNDS = 12;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name must be at most 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // creates a unique index
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned unless explicitly `.select('+password')`
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    avatar: {
      type: String,
      default: '', // Cloudinary URL is wired up in a later phase
    },

    // ── Email verification ──────────────────────────────────────────────
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },

    // ── Password reset ──────────────────────────────────────────────────
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    // Set whenever the password changes; used to reject access tokens that
    // were issued before the change.
    passwordChangedAt: { type: Date, select: false },
    lastLoginAt: { type: Date },

    // NOTE: Rich student-profile fields (college, department, year, skills,
    // bio, links, availability, badges…) are added in Phase 5.
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        // Defense in depth — strip anything sensitive if it ever loads.
        delete ret.password;
        delete ret.emailVerificationTokenHash;
        delete ret.emailVerificationExpires;
        delete ret.passwordResetTokenHash;
        delete ret.passwordResetExpires;
        delete ret.passwordChangedAt;
        return ret;
      },
    },
  }
);

// ── Hooks ─────────────────────────────────────────────────────────────────
// Hash the password whenever it is set/changed (never store plaintext).
// Modern Mongoose awaits async hooks — no `next` callback needed.
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, BCRYPT_SALT_ROUNDS);
  // Backdate by 1s so a token issued right after save isn't wrongly seen as
  // "issued before the password change" due to millisecond timing.
  this.passwordChangedAt = new Date(Date.now() - 1000);
});

// ── Instance methods ────────────────────────────────────────────────────
/** Compare a plaintext candidate against the stored hash. */
userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

/** True if the password changed after the given JWT "issued at" (seconds). */
userSchema.methods.passwordChangedAfter = function passwordChangedAfter(iatSeconds) {
  if (!this.passwordChangedAt) return false;
  const changedAtSeconds = Math.floor(this.passwordChangedAt.getTime() / 1000);
  return changedAtSeconds > iatSeconds;
};

/**
 * Create an email-verification token. Stores the HASH + expiry on the user
 * and returns the RAW token to embed in the emailed link.
 */
userSchema.methods.createEmailVerificationToken = function createEmailVerificationToken() {
  const { raw, hash } = generateToken();
  this.emailVerificationTokenHash = hash;
  this.emailVerificationExpires = new Date(
    Date.now() + env.auth.emailTokenExpiresMinutes * 60 * 1000
  );
  return raw;
};

/** Same pattern as above, for password resets. */
userSchema.methods.createPasswordResetToken = function createPasswordResetToken() {
  const { raw, hash } = generateToken();
  this.passwordResetTokenHash = hash;
  this.passwordResetExpires = new Date(
    Date.now() + env.auth.emailTokenExpiresMinutes * 60 * 1000
  );
  return raw;
};

const User = model('User', userSchema);

export default User;
