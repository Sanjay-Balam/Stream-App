import mongoose, { Schema, Document } from 'mongoose';
import { ChatMessage as ChatMessageType } from '../types';

export interface ChatMessageDocument extends Omit<ChatMessageType, '_id'>, Document {}

const chatMessageSchema = new Schema<ChatMessageDocument>({
  streamId: {
    type: Schema.Types.ObjectId,
    ref: 'Stream',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  isModerated: {
    type: Boolean,
    default: false
  },
  reactions: [{
    emoji: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: false
});

chatMessageSchema.index({ streamId: 1, timestamp: -1 });
chatMessageSchema.index({ userId: 1 });

export const ChatMessage = mongoose.model<ChatMessageDocument>('ChatMessage', chatMessageSchema);