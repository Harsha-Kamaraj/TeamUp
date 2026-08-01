import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * Conversation — either a 1-on-1 direct thread or a team group chat.
 *
 * Direct threads carry a `pairKey` (sorted participant ids joined) with a
 * unique index, guaranteeing exactly one conversation per pair of users, so
 * "message this person" always resolves to the same thread. Group chats have
 * no pairKey — the index is sparse, so any number of them can coexist.
 */
const conversationSchema = new Schema(
  {
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      required: true,
      validate: [
        function atLeastTwo(v) {
          // Direct threads are strictly pairs; groups just need a couple of
          // people to start and grow as the team fills up.
          return this.isGroup ? v.length >= 2 : v.length === 2;
        },
        'A conversation needs at least 2 participants',
      ],
      index: true,
    },

    // Direct threads use "<idA>_<idB>" (sorted); groups use "group:<postId>".
    // Both are always set, so this stays unique regardless of whether the
    // deployed index happens to be sparse.
    pairKey: { type: String, unique: true, sparse: true },

    isGroup: { type: Boolean, default: false },
    // Group display name, e.g. "Ada's team".
    name: { type: String, trim: true, maxlength: 80, default: '' },
    // The team lead — the post author who created the group.
    owner: { type: Schema.Types.ObjectId, ref: 'User' },

    // Optional: the opportunity that sparked the conversation (context).
    // Required in practice for groups — that's the team it belongs to.
    post: { type: Schema.Types.ObjectId, ref: 'Post' },

    // Denormalized preview for the conversation list.
    lastMessage: {
      text: { type: String },
      sender: { type: Schema.Types.ObjectId, ref: 'User' },
      at: { type: Date },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.pairKey;
        return ret;
      },
    },
  }
);

// One group chat per post.
conversationSchema.index({ post: 1, isGroup: 1 }, { unique: true, sparse: true });

/** Get (or create) the single direct conversation between two users. */
conversationSchema.statics.findOrCreateBetween = async function findOrCreateBetween(a, b, postId) {
  const ids = [a.toString(), b.toString()].sort();
  const pairKey = ids.join('_');

  const existing = await this.findOne({ pairKey });
  if (existing) return existing;

  try {
    return await this.create({ participants: ids, pairKey, post: postId });
  } catch (err) {
    // Race: another request created it first — fetch and return that one.
    if (err.code === 11000) return this.findOne({ pairKey });
    throw err;
  }
};

const Conversation = model('Conversation', conversationSchema);

export default Conversation;
