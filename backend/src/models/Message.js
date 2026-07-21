import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * Message = one chat message within a conversation.
 * `readBy` holds the users who have read it (for read receipts + unread counts).
 */
const messageSchema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 4000 },
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
        return ret;
      },
    },
  }
);

// Fetch a conversation's messages in chronological order, fast.
messageSchema.index({ conversation: 1, createdAt: 1 });

const Message = model('Message', messageSchema);

export default Message;
