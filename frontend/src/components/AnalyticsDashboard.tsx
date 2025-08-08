'use client';

import { useState, useEffect } from 'react';
import { StreamAnalytics } from '../types';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  Heart, 
  Gift, 
  DollarSign, 
  Clock,
  TrendingUp,
  Eye
} from 'lucide-react';

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  analytics: StreamAnalytics | null;
  onRefresh: () => void;
}

export default function AnalyticsDashboard({ 
  isOpen, 
  onClose, 
  analytics, 
  onRefresh 
}: AnalyticsDashboardProps) {
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Auto-refresh every 30 seconds when dashboard is open
      const interval = setInterval(onRefresh, 30000);
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [isOpen, onRefresh]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getViewerTrend = () => {
    if (!analytics || analytics.viewerHistory.length < 2) return 0;
    
    const recent = analytics.viewerHistory.slice(-10);
    const earlier = analytics.viewerHistory.slice(-20, -10);
    
    if (earlier.length === 0) return 0;
    
    const recentAvg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, m) => sum + m.value, 0) / earlier.length;
    
    return recentAvg - earlierAvg;
  };

  const getChatTrend = () => {
    if (!analytics || analytics.chatActivity.length < 2) return 0;
    
    const recent = analytics.chatActivity.slice(-10);
    const earlier = analytics.chatActivity.slice(-20, -10);
    
    if (earlier.length === 0) return 0;
    
    const recentSum = recent.reduce((sum, m) => sum + m.value, 0);
    const earlierSum = earlier.reduce((sum, m) => sum + m.value, 0);
    
    return recentSum - earlierSum;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-6 h-6 text-primary-400" />
              <h2 className="text-xl font-bold text-white">Stream Analytics</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-2xl"
            >
              ×
            </button>
          </div>

          {analytics ? (
            <>
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {/* Current Viewers */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Live Viewers</p>
                      <p className="text-white text-2xl font-bold">{analytics.currentViewers}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-200" />
                  </div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className={`w-4 h-4 mr-1 ${
                      getViewerTrend() >= 0 ? 'text-green-300' : 'text-red-300'
                    }`} />
                    <span className={`text-sm ${
                      getViewerTrend() >= 0 ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {getViewerTrend() >= 0 ? '+' : ''}{Math.round(getViewerTrend())}
                    </span>
                  </div>
                </div>

                {/* Total Views */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Total Views</p>
                      <p className="text-white text-2xl font-bold">{analytics.totalViewers}</p>
                    </div>
                    <Eye className="w-8 h-8 text-green-200" />
                  </div>
                  <p className="text-green-100 text-sm mt-2">
                    Peak: {analytics.peakViewers}
                  </p>
                </div>

                {/* Messages */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Messages</p>
                      <p className="text-white text-2xl font-bold">{analytics.totalMessages}</p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-purple-200" />
                  </div>
                  <div className="flex items-center mt-2">
                    <Heart className="w-4 h-4 text-purple-200 mr-1" />
                    <span className="text-purple-100 text-sm">
                      {analytics.totalReactions} reactions
                    </span>
                  </div>
                </div>

                {/* Revenue */}
                <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100 text-sm">Revenue</p>
                      <p className="text-white text-2xl font-bold">
                        {formatCurrency(analytics.totalRevenue)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-yellow-200" />
                  </div>
                  <div className="flex items-center mt-2">
                    <Gift className="w-4 h-4 text-yellow-200 mr-1" />
                    <span className="text-yellow-100 text-sm">
                      {analytics.totalGifts} gifts
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Engagement Stats
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Average View Time</span>
                      <span className="text-white font-medium">
                        {formatTime(analytics.averageViewTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Messages per Viewer</span>
                      <span className="text-white font-medium">
                        {analytics.totalViewers > 0 
                          ? (analytics.totalMessages / analytics.totalViewers).toFixed(1)
                          : '0'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Reactions per Message</span>
                      <span className="text-white font-medium">
                        {analytics.totalMessages > 0 
                          ? (analytics.totalReactions / analytics.totalMessages).toFixed(1)
                          : '0'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4 flex items-center">
                    <Gift className="w-5 h-5 mr-2" />
                    Gift Stats
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Average Gift Value</span>
                      <span className="text-white font-medium">
                        {analytics.totalGifts > 0 
                          ? formatCurrency(analytics.totalGiftValue / analytics.totalGifts)
                          : '$0.00'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Gifts per Viewer</span>
                      <span className="text-white font-medium">
                        {analytics.totalViewers > 0 
                          ? (analytics.totalGifts / analytics.totalViewers).toFixed(2)
                          : '0'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Revenue per Viewer</span>
                      <span className="text-white font-medium">
                        {analytics.totalViewers > 0 
                          ? formatCurrency(analytics.totalRevenue / analytics.totalViewers)
                          : '$0.00'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simple Activity Charts */}
              <div className="space-y-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-white font-medium mb-4">Recent Viewer Activity</h3>
                  <div className="h-20 flex items-end space-x-1">
                    {analytics.viewerHistory.slice(-20).map((point, index) => (
                      <div
                        key={index}
                        className="bg-blue-500 rounded-t flex-1 transition-all hover:bg-blue-400"
                        style={{
                          height: `${Math.max(8, (point.value / Math.max(...analytics.viewerHistory.map(p => p.value)) * 80))}%`
                        }}
                        title={`${point.value} viewers at ${new Date(point.timestamp).toLocaleTimeString()}`}
                      />
                    ))}
                  </div>
                </div>

                {analytics.chatActivity.length > 0 && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-white font-medium mb-4">Chat Activity</h3>
                    <div className="h-20 flex items-end space-x-1">
                      {analytics.chatActivity.slice(-20).map((point, index) => (
                        <div
                          key={index}
                          className="bg-purple-500 rounded-t flex-1 transition-all hover:bg-purple-400"
                          style={{
                            height: `${Math.max(8, (point.value / Math.max(...analytics.chatActivity.map(p => p.value)) * 80))}%`
                          }}
                          title={`${point.value} messages at ${new Date(point.timestamp).toLocaleTimeString()}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Loading analytics...</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-600 flex justify-between items-center">
            <p className="text-gray-400 text-sm">
              Last updated: {analytics ? new Date().toLocaleTimeString() : 'Never'}
            </p>
            <button
              onClick={onRefresh}
              className="btn-secondary px-4 py-2 text-sm"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}