import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { User as UserType } from '../types';

export interface UserDocument extends Omit<UserType, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateStreamKey(): string;
}

const userSchema = new Schema<UserDocument>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  role: {
    type: String,
    enum: ['viewer', 'streamer', 'moderator', 'admin'],
    default: 'viewer'
  },
  isLive: {
    type: Boolean,
    default: false
  },
  followers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  streamKey: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateStreamKey = function(): string {
  const streamKey = `sk_${this._id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  this.streamKey = streamKey;
  return streamKey;
};

userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ streamKey: 1 });

export const User = mongoose.model<UserDocument>('User', userSchema);