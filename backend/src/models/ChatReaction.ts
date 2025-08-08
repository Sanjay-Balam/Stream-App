import mongoose, { Schema, Document } from 'mongoose';

export interface ChatReactionDocument extends Document {
  messageId: mongoose.Types.ObjectId;
  streamId: mongoose.Types.ObjectId;
  userId: string;
  username: string;
  emoji: string;
  timestamp: Date;
}

const chatReactionSchema = new Schema<ChatReactionDocument>({
  messageId: {
    type: Schema.Types.ObjectId,
    ref: 'ChatMessage',
    required: true
  },
  streamId: {
    type: Schema.Types.ObjectId,
    ref: 'Stream',
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
  emoji: {
    type: String,
    required: true,
    enum: ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '💯', '👏']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

chatReactionSchema.index({ messageId: 1, userId: 1 }, { unique: true });
chatReactionSchema.index({ streamId: 1, timestamp: -1 });

export const ChatReaction = mongoose.model<ChatReactionDocument>('ChatReaction', chatReactionSchema);