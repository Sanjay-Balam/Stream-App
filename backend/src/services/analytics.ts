import { StreamAnalytics, AnalyticsMetric } from '../models/StreamAnalytics';
import mongoose from 'mongoose';

export class AnalyticsService {
  private static instance: AnalyticsService;
  private streamMetrics: Map<string, {
    currentViewers: Set<string>;
    sessionStartTimes: Map<string, Date>;
    hourlyMetrics: Map<string, {
      viewers: number;
      messages: number;
      gifts: number;
    }>;
  }> = new Map();

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private getStreamMetrics(streamId: string) {
    if (!this.streamMetrics.has(streamId)) {
      this.streamMetrics.set(streamId, {
        currentViewers: new Set(),
        sessionStartTimes: new Map(),
        hourlyMetrics: new Map()
      });
    }
    return this.streamMetrics.get(streamId)!;
  }

  private getHourKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}`;
  }

  private getTodayKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  }

  public async viewerJoined(streamId: string, streamerId: string, userId: string) {
    try {
      const metrics = this.getStreamMetrics(streamId);
      const hourKey = this.getHourKey();
      
      // Track viewer
      metrics.currentViewers.add(userId);
      metrics.sessionStartTimes.set(userId, new Date());
      
      // Update hourly metrics
      if (!metrics.hourlyMetrics.has(hourKey)) {
        metrics.hourlyMetrics.set(hourKey, { viewers: 0, messages: 0, gifts: 0 });
      }
      metrics.hourlyMetrics.get(hourKey)!.viewers = metrics.currentViewers.size;

      // Update analytics document
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      await StreamAnalytics.findOneAndUpdate(
        { streamId: new mongoose.Types.ObjectId(streamId), date: today },
        {
          $inc: { totalViewers: 1 },
          $setOnInsert: {
            streamerId,
            date: today,
            uniqueViewers: 0,
            peakViewers: 0,
            averageViewTime: 0,
            viewerRetention: 0,
            totalMessages: 0,
            totalReactions: 0,
            totalPollVotes: 0,
            totalGifts: 0,
            totalRevenue: 0,
            totalGiftValue: 0,
            viewerHistory: [],
            chatActivity: [],
            giftActivity: [],
            viewersByCountry: [],
            viewersByPlatform: []
          }
        },
        { upsert: true, new: true }
      );

      // Update peak viewers
      await this.updatePeakViewers(streamId, metrics.currentViewers.size);
      
      // Add to viewer history
      await this.addViewerHistoryPoint(streamId, metrics.currentViewers.size);
      
    } catch (error) {
      console.error('Error tracking viewer join:', error);
    }
  }

  public async viewerLeft(streamId: string, userId: string) {
    try {
      const metrics = this.getStreamMetrics(streamId);
      const hourKey = this.getHourKey();
      
      // Calculate session time
      const sessionStart = metrics.sessionStartTimes.get(userId);
      if (sessionStart) {
        const sessionDuration = Date.now() - sessionStart.getTime();
        metrics.sessionStartTimes.delete(userId);
        
        // Update average view time
        await this.updateAverageViewTime(streamId, sessionDuration);
      }
      
      // Remove viewer
      metrics.currentViewers.delete(userId);
      
      // Update hourly metrics
      if (metrics.hourlyMetrics.has(hourKey)) {
        metrics.hourlyMetrics.get(hourKey)!.viewers = metrics.currentViewers.size;
      }

      // Add to viewer history
      await this.addViewerHistoryPoint(streamId, metrics.currentViewers.size);
      
    } catch (error) {
      console.error('Error tracking viewer leave:', error);
    }
  }

  public async messagePosted(streamId: string) {
    try {
      const metrics = this.getStreamMetrics(streamId);
      const hourKey = this.getHourKey();
      
      // Update hourly metrics
      if (!metrics.hourlyMetrics.has(hourKey)) {
        metrics.hourlyMetrics.set(hourKey, { viewers: 0, messages: 0, gifts: 0 });
      }
      metrics.hourlyMetrics.get(hourKey)!.messages += 1;

      // Update analytics document
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      await StreamAnalytics.findOneAndUpdate(
        { streamId: new mongoose.Types.ObjectId(streamId), date: today },
        { $inc: { totalMessages: 1 } }
      );

      // Add to chat activity history
      await this.addChatActivityPoint(streamId);
      
    } catch (error) {
      console.error('Error tracking message:', error);
    }
  }

  public async reactionAdded(streamId: string) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      await StreamAnalytics.findOneAndUpdate(
        { streamId: new mongoose.Types.ObjectId(streamId), date: today },
        { $inc: { totalReactions: 1 } }
      );
    } catch (error) {
      console.error('Error tracking reaction:', error);
    }
  }

  public async pollVoteRecorded(streamId: string) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      await StreamAnalytics.findOneAndUpdate(
        { streamId: new mongoose.Types.ObjectId(streamId), date: today },
        { $inc: { totalPollVotes: 1 } }
      );
    } catch (error) {
      console.error('Error tracking poll vote:', error);
    }
  }

  public async giftSent(streamId: string, value: number) {
    try {
      const metrics = this.getStreamMetrics(streamId);
      const hourKey = this.getHourKey();
      
      // Update hourly metrics
      if (!metrics.hourlyMetrics.has(hourKey)) {
        metrics.hourlyMetrics.set(hourKey, { viewers: 0, messages: 0, gifts: 0 });
      }
      metrics.hourlyMetrics.get(hourKey)!.gifts += 1;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      await StreamAnalytics.findOneAndUpdate(
        { streamId: new mongoose.Types.ObjectId(streamId), date: today },
        { 
          $inc: { 
            totalGifts: 1,
            totalGiftValue: value,
            totalRevenue: value 
          } 
        }
      );

      // Add to gift activity history
      await this.addGiftActivityPoint(streamId, value);
      
    } catch (error) {
      console.error('Error tracking gift:', error);
    }
  }

  private async updatePeakViewers(streamId: string, currentViewers: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await StreamAnalytics.findOneAndUpdate(
      { 
        streamId: new mongoose.Types.ObjectId(streamId), 
        date: today,
        peakViewers: { $lt: currentViewers }
      },
      { $set: { peakViewers: currentViewers } }
    );
  }

  private async updateAverageViewTime(streamId: string, sessionDuration: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const analytics = await StreamAnalytics.findOne({
      streamId: new mongoose.Types.ObjectId(streamId),
      date: today
    });

    if (analytics) {
      const newAverage = ((analytics.averageViewTime * analytics.totalViewers) + sessionDuration) / (analytics.totalViewers + 1);
      analytics.averageViewTime = newAverage;
      await analytics.save();
    }
  }

  private async addViewerHistoryPoint(streamId: string, viewers: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const point: AnalyticsMetric = {
      timestamp: new Date(),
      value: viewers
    };

    await StreamAnalytics.findOneAndUpdate(
      { streamId: new mongoose.Types.ObjectId(streamId), date: today },
      { 
        $push: { 
          viewerHistory: {
            $each: [point],
            $slice: -288 // Keep last 24 hours (5-minute intervals)
          }
        }
      }
    );
  }

  private async addChatActivityPoint(streamId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const point: AnalyticsMetric = {
      timestamp: new Date(),
      value: 1
    };

    await StreamAnalytics.findOneAndUpdate(
      { streamId: new mongoose.Types.ObjectId(streamId), date: today },
      { 
        $push: { 
          chatActivity: {
            $each: [point],
            $slice: -288
          }
        }
      }
    );
  }

  private async addGiftActivityPoint(streamId: string, value: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const point: AnalyticsMetric = {
      timestamp: new Date(),
      value: value
    };

    await StreamAnalytics.findOneAndUpdate(
      { streamId: new mongoose.Types.ObjectId(streamId), date: today },
      { 
        $push: { 
          giftActivity: {
            $each: [point],
            $slice: -288
          }
        }
      }
    );
  }

  public async getLiveAnalytics(streamId: string) {
    const metrics = this.getStreamMetrics(streamId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const analytics = await StreamAnalytics.findOne({
      streamId: new mongoose.Types.ObjectId(streamId),
      date: today
    });

    return {
      currentViewers: metrics.currentViewers.size,
      totalViewers: analytics?.totalViewers || 0,
      peakViewers: analytics?.peakViewers || 0,
      totalMessages: analytics?.totalMessages || 0,
      totalReactions: analytics?.totalReactions || 0,
      totalGifts: analytics?.totalGifts || 0,
      totalRevenue: analytics?.totalRevenue || 0,
      totalGiftValue: analytics?.totalGiftValue || 0,
      averageViewTime: analytics?.averageViewTime || 0,
      viewerHistory: analytics?.viewerHistory || [],
      chatActivity: analytics?.chatActivity || [],
      giftActivity: analytics?.giftActivity || []
    };
  }
}