import mongoose, { Schema, Document } from 'mongoose';

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[]; // userIds who voted for this option
}

export interface PollDocument extends Document {
  streamId: mongoose.Types.ObjectId;
  creatorId: string;
  creatorUsername: string;
  question: string;
  options: PollOption[];
  isActive: boolean;
  allowMultipleVotes: boolean;
  showResults: boolean;
  totalVotes: number;
  createdAt: Date;
  expiresAt?: Date;
}

const pollOptionSchema = new Schema({
  id: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true,
    maxlength: 100
  },
  votes: {
    type: Number,
    default: 0
  },
  voters: [{
    type: String
  }]
}, { _id: false });

const pollSchema = new Schema<PollDocument>({
  streamId: {
    type: Schema.Types.ObjectId,
    ref: 'Stream',
    required: true
  },
  creatorId: {
    type: String,
    required: true
  },
  creatorUsername: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true,
    maxlength: 200
  },
  options: [pollOptionSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  allowMultipleVotes: {
    type: Boolean,
    default: false
  },
  showResults: {
    type: Boolean,
    default: true
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: false
});

pollSchema.index({ streamId: 1, createdAt: -1 });
pollSchema.index({ isActive: 1 });
pollSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Poll = mongoose.model<PollDocument>('Poll', pollSchema);