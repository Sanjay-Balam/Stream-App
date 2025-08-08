import mongoose, { Schema, Document } from 'mongoose';

export interface AnalyticsMetric {
  timestamp: Date;
  value: number;
}

export interface StreamAnalyticsDocument extends Document {
  streamId: mongoose.Types.ObjectId;
  streamerId: string;
  date: Date; // Date of the analytics (YYYY-MM-DD)
  
  // Viewer metrics
  totalViewers: number;
  uniqueViewers: number;
  peakViewers: number;
  averageViewTime: number; // in seconds
  viewerRetention: number; // percentage
  
  // Engagement metrics
  totalMessages: number;
  totalReactions: number;
  totalPollVotes: number;
  totalGifts: number;
  
  // Revenue metrics
  totalRevenue: number; // in cents
  totalGiftValue: number; // in cents
  
  // Time-based metrics (hourly data points)
  viewerHistory: AnalyticsMetric[];
  chatActivity: AnalyticsMetric[];
  giftActivity: AnalyticsMetric[];
  
  // Geographic data
  viewersByCountry: Array<{
    country: string;
    count: number;
  }>;
  
  // Device/Platform data
  viewersByPlatform: Array<{
    platform: string;
    count: number;
  }>;
}

const analyticsMetricSchema = new Schema({
  timestamp: { type: Date, required: true },
  value: { type: Number, required: true }
}, { _id: false });

const streamAnalyticsSchema = new Schema<StreamAnalyticsDocument>({
  streamId: {
    type: Schema.Types.ObjectId,
    ref: 'Stream',
    required: true
  },
  streamerId: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  totalViewers: {
    type: Number,
    default: 0
  },
  uniqueViewers: {
    type: Number,
    default: 0
  },
  peakViewers: {
    type: Number,
    default: 0
  },
  averageViewTime: {
    type: Number,
    default: 0
  },
  viewerRetention: {
    type: Number,
    default: 0
  },
  totalMessages: {
    type: Number,
    default: 0
  },
  totalReactions: {
    type: Number,
    default: 0
  },
  totalPollVotes: {
    type: Number,
    default: 0
  },
  totalGifts: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  totalGiftValue: {
    type: Number,
    default: 0
  },
  viewerHistory: [analyticsMetricSchema],
  chatActivity: [analyticsMetricSchema],
  giftActivity: [analyticsMetricSchema],
  viewersByCountry: [{
    country: { type: String, required: true },
    count: { type: Number, required: true }
  }],
  viewersByPlatform: [{
    platform: { type: String, required: true },
    count: { type: Number, required: true }
  }]
}, {
  timestamps: true
});

streamAnalyticsSchema.index({ streamId: 1, date: 1 }, { unique: true });
streamAnalyticsSchema.index({ streamerId: 1, date: -1 });

export const StreamAnalytics = mongoose.model<StreamAnalyticsDocument>('StreamAnalytics', streamAnalyticsSchema);