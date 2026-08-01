import mongoose from 'mongoose';

const { Schema, model } = mongoose;

// How long a message is kept before MongoDB removes it automatically.
// Exported so the UI can tell users the retention period without hardcoding it.
export const MESSAGE_RETENTION_DAYS = 30;

/**
 * Message = one chat message within a conversation.
 *
 * `readBy` holds the users who have read it (read receipts + unread counts).
 * A message is either text, an attachment, or both.
 */
const messageSchema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    // Optional when the message carries a file instead.
    text: {
      type: String,
      trim: true,
      maxlength: 4000,
      required: [
        function needsTextWithoutFile() {
          return !this.attachment?.url;
        },
        'Message cannot be empty',
      ],
    },

    // Uploaded file (Cloudinary). Only the URL and metadata live here — the
    // bytes are in Cloudinary, so this costs ~100 bytes in MongoDB.
    attachment: {
      url: { type: String },
      publicId: { type: String },
      name: { type: String, maxlength: 200 },
      mime: { type: String },
      size: { type: Number },
    },

    // One entry per person per emoji. `_id: false` keeps each ~20 bytes.
    reactions: {
      type: [
        {
          _id: false,
          emoji: { type: String, required: true, maxlength: 8 },
          user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        },
      ],
      default: [],
    },

    readBy: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        // Drop the empty attachment sub-object Mongoose materializes.
        if (!ret.attachment?.url) delete ret.attachment;
        return ret;
      },
    },
  }
);

// Fetch a conversation's messages in chronological order, fast.
messageSchema.index({ conversation: 1, createdAt: 1 });

/**
 * TTL index — MongoDB deletes messages this many days after they're created,
 * with no cron job on our side. It sweeps roughly once a minute.
 *
 * NOTE: this permanently removes chat history. Attachments in Cloudinary are
 * NOT removed by it (MongoDB can't reach them), so they're cleaned separately.
 */
messageSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: MESSAGE_RETENTION_DAYS * 24 * 60 * 60, name: 'message_ttl' }
);

const Message = model('Message', messageSchema);

export default Message;
