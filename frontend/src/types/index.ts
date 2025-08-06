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

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
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