import mongoose, { Schema, Document } from 'mongoose';
import { Stream as StreamType } from '../types';

export interface StreamDocument extends Omit<StreamType, '_id'>, Document {}

const streamSchema = new Schema<StreamDocument>({
  streamerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
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
  }
}, {
  timestamps: true
});

streamSchema.index({ streamerId: 1 });
streamSchema.index({ isLive: 1 });
streamSchema.index({ category: 1 });
streamSchema.index({ createdAt: -1 });
streamSchema.index({ viewerCount: -1 });
streamSchema.index({ streamKey: 1 }, { unique: true });

export const Stream = mongoose.model<StreamDocument>('Stream', streamSchema);