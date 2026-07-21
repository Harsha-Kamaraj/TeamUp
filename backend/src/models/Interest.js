import mongoose from 'mongoose';

const { Schema, model } = mongoose;

export const INTEREST_STATUSES = ['pending', 'accepted', 'rejected'];

/**
 * Interest = a student expressing "I'm interested" in an opportunity.
 *
 *   fromUser  — the interested student
 *   toUser    — the post's author (denormalized for easy "who's interested in
 *               my posts" queries and notifications)
 *   status    — pending by default; accept/reject lands in Phase 14 (Team Mgmt)
 *
 * A unique (post, fromUser) index guarantees one interest per user per post.
 */
const interestSchema = new Schema(
  {
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    fromUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    toUser: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, trim: true, maxlength: 500, default: '' },
    status: { type: String, enum: INTEREST_STATUSES, default: 'pending' },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// One interest per (post, user).
interestSchema.index({ post: 1, fromUser: 1 }, { unique: true });

const Interest = model('Interest', interestSchema);

export default Interest;
