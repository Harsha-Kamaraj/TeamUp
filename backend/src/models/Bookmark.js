import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * Bookmark = a user saved a post for later. The unique (user, post) index
 * guarantees a post can only be saved once per user.
 */
const bookmarkSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  },
  { timestamps: true }
);

bookmarkSchema.index({ user: 1, post: 1 }, { unique: true });
bookmarkSchema.index({ user: 1, createdAt: -1 });

const Bookmark = model('Bookmark', bookmarkSchema);

export default Bookmark;
