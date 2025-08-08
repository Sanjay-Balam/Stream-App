export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  role: 'viewer' | 'streamer' | 'moderator' | 'admin';
  isLive: boolean;
  followers?: string[];
  following?: string[];
}

export interface Stream {
  _id: string;
  streamerId: {
    _id: string;
    username: string;
    displayName: string;
    avatar?: string;
    bio?: string;
    followers?: string[];
  };
  title: string;
  description?: string;
  category: string;
  tags: string[];
  isLive: boolean;
  viewerCount: number;
  thumbnail?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
  isGuestStream?: boolean;
}

export interface ChatReaction {
  emoji: string;
  count: number;
  users: Array<{
    userId: string;
    username: string;
  }>;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
  reactions?: ChatReaction[];
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  allowMultipleVotes: boolean;
  showResults: boolean;
  totalVotes: number;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface GiftType {
  id: string;
  name: string;
  emoji: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  animation?: string;
}

export interface Gift {
  id: string;
  giftType: GiftType;
  amount: number;
  totalValue: number;
  senderUsername: string;
  recipientUsername: string;
  message?: string;
  isAnonymous: boolean;
  timestamp: string;
}

export interface AnalyticsMetric {
  timestamp: string;
  value: number;
}

export interface StreamAnalytics {
  currentViewers: number;
  totalViewers: number;
  peakViewers: number;
  totalMessages: number;
  totalReactions: number;
  totalGifts: number;
  totalRevenue: number;
  totalGiftValue: number;
  averageViewTime: number;
  viewerHistory: AnalyticsMetric[];
  chatActivity: AnalyticsMetric[];
  giftActivity: AnalyticsMetric[];
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export const STREAM_CATEGORIES = [
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
] as const;

export type StreamCategory = typeof STREAM_CATEGORIES[number];