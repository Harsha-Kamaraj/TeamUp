import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * Conversation = a 1-on-1 direct message thread between two users.
 *
 * `pairKey` (sorted participant ids joined) has a unique index, guaranteeing
 * exactly one conversation per pair of users — so "message this person"
 * always resolves to the same thread.
 */
const conversationSchema = new Schema(
  {
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      required: true,
      validate: [(v) => v.length === 2, 'A conversation must have exactly 2 participants'],
      index: true,
    },
    pairKey: { type: String, required: true, unique: true },
    // Optional: the opportunity that sparked the conversation (context).
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

/** Get (or create) the single conversation between two users. */
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
