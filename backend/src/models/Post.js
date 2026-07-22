import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// Exported so validators (and, conceptually, the frontend) stay in sync.
export const POST_TYPES = [
  'hackathon',
  'research',
  'startup',
  'competition',
  'open-source',
  'club',
  'project',
  // "other" lets students post any event we don't list (e.g. a DJ Nite, a
  // fest, a study group). The free-text label lives in `customType`.
  'other',
];
export const POST_MODES = ['remote', 'offline', 'hybrid'];
export const POST_STATUSES = ['open', 'closed'];

/**
 * Post = an "opportunity" a student creates to find teammates
 * (hackathon, research, startup, competition, open-source, club, project).
 */
const postSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // fast "my posts" lookups
    },
    type: {
      type: String,
      enum: POST_TYPES,
      required: [true, 'Opportunity type is required'],
    },
    // Free-text label shown when type === 'other' (e.g. "DJ Nite").
    customType: { type: String, trim: true, maxlength: 40, default: '' },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [120, 'Title must be at most 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [5000, 'Description is too long'],
    },
    requiredSkills: { type: [String], default: [] },
    membersNeeded: {
      type: Number,
      min: [1, 'At least 1 member is needed'],
      max: [50, 'That is a lot of members'],
      default: 1,
    },
    deadline: { type: Date },
    mode: { type: String, enum: POST_MODES, default: 'remote' },
    location: { type: String, trim: true, maxlength: 120, default: '' },
    tags: { type: [String], default: [] },
    status: { type: String, enum: POST_STATUSES, default: 'open' },
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

// Keep customType meaningful only for the "other" type.
postSchema.pre('save', function normalizeCustomType() {
  if (this.type !== 'other') this.customType = '';
});

// Common access patterns: newest-first feeds, filtered by status/type/mode.
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ status: 1, type: 1, createdAt: -1 });
// Multikey indexes for array-field filters (skill / tag).
postSchema.index({ requiredSkills: 1 });
postSchema.index({ tags: 1 });

const Post = model('Post', postSchema);

export default Post;
