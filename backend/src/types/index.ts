export interface User {
  _id: string;
  username: string;
  email: string;
  password: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  role: 'viewer' | 'streamer' | 'moderator' | 'admin';
  isLive: boolean;
  followers: string[];
  following: string[];
  streamKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Stream {
  _id: string;
  streamerId: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  _id: string;
  streamId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  isDeleted: boolean;
  isModerated: boolean;
}

export interface Donation {
  _id: string;
  streamId: string;
  streamerId: string;
  donorId?: string;
  donorName: string;
  amount: number;
  currency: string;
  message?: string;
  stripePaymentId: string;
  timestamp: Date;
}

export interface Subscription {
  _id: string;
  userId: string;
  streamerId: string;
  tier: 'basic' | 'premium' | 'vip';
  amount: number;
  stripeSubscriptionId: string;
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
}

export interface WebRTCPeer {
  userId: string;
  peerId: string;
  streamId: string;
  isStreamer: boolean;
  socketId: string;
}