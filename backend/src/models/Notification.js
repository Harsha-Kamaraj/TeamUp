import mongoose from 'mongoose';

const { Schema, model } = mongoose;

export const NOTIFICATION_TYPES = ['interest', 'message', 'system'];

/**
 * Notification = an alert for a user (someone interested in your post, a new
 * message, a system message). `text` and `link` are denormalized so the client
 * can render + navigate without extra lookups; `actor` is populated for avatars.
 */
const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // recipient
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User' }, // who triggered it
    post: { type: Schema.Types.ObjectId, ref: 'Post' },
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation' },
    text: { type: String, required: true },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false },
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

notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = model('Notification', notificationSchema);

export default Notification;
