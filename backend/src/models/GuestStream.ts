import mongoose, { Schema, Document } from 'mongoose';

export interface GuestStreamDocument extends Document {
  guestId: string;
  title: string;
  description?: string;
  category: string;
  tags: string[];
  isLive: boolean;
  viewerCount: number;
  streamKey: string;
  thumbnail?: string;
  startedAt?: Date;
  endedAt?: Date;
  expiresAt: Date;
  guestDisplayName: string;
  createdAt: Date;
  updatedAt: Date;
}

const guestStreamSchema = new Schema<GuestStreamDocument>({
  guestId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500,
    default: ''
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Gaming',
      'Just Chatting',
      'Music',
      'Art',
      'Technology',
      'Education',
      'Sports',
      'Cooking',
      'IRL',
      'Other'
    ]
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 25
  }],
  isLive: {
    type: Boolean,
    default: false
  },
  viewerCount: {
    type: Number,
    default: 0,
    min: 0
  },
  streamKey: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: null
  },
  startedAt: {
    type: Date,
    default: null
  },
  endedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
  },
  guestDisplayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  }
}, {
  timestamps: true
});

guestStreamSchema.index({ guestId: 1 }, { unique: true });
guestStreamSchema.index({ isLive: 1 });
guestStreamSchema.index({ category: 1 });
guestStreamSchema.index({ createdAt: -1 });
guestStreamSchema.index({ viewerCount: -1 });
guestStreamSchema.index({ streamKey: 1 }, { unique: true });
guestStreamSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const GuestStream = mongoose.model<GuestStreamDocument>('GuestStream', guestStreamSchema);