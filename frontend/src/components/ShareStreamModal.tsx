'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Share, 
  Twitter, 
  Facebook, 
  MessageCircle, 
  Mail,
  QrCode,
  ExternalLink,
  Users,
  Check
} from 'lucide-react';
import { api } from '../lib/api';

interface ShareInfo {
  streamId: string;
  title: string;
  description?: string;
  streamerName: string;
  category: string;
  isLive: boolean;
  viewerCount: number;
  shareCount: number;
  shareUrl: string;
  expiresAt: string;
}

interface ShareStreamModalProps {
  streamId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareStreamModal({ streamId, isOpen, onClose }: ShareStreamModalProps) {
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (isOpen && streamId) {
      fetchShareInfo();
    }
  }, [isOpen, streamId]);

  const fetchShareInfo = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/guest-streams/${streamId}/share-info`);
      if (response.data.success) {
        setShareInfo(response.data.data.shareInfo);
      }
    } catch (error) {
      console.error('Failed to fetch share info:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordShare = async () => {
    try {
      await api.post(`/guest-streams/${streamId}/share`);
      // Update local share count
      if (shareInfo) {
        setShareInfo({ ...shareInfo, shareCount: shareInfo.shareCount + 1 });
      }
    } catch (error) {
      console.error('Failed to record share:', error);
    }
  };

  const copyToClipboard = async () => {
    if (!shareInfo) return;
    
    try {
      await navigator.clipboard.writeText(shareInfo.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      recordShare();
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const shareToSocial = async (platform: string) => {
    if (!shareInfo) return;

    setSharing(true);
    const { title, streamerName, shareUrl, isLive } = shareInfo;
    const status = isLive ? 'LIVE' : 'streaming';
    const text = `Check out ${streamerName}'s ${status} stream: "${title}" on StreamHub!`;
    
    let url = '';
    
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`;
        break;
      case 'email':
        const subject = `Check out ${streamerName}'s stream on StreamHub`;
        const body = `Hi!\n\nI wanted to share this ${status} stream with you:\n\n"${title}" by ${streamerName}\n\nWatch here: ${shareUrl}\n\nEnjoy!`;
        url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        break;
    }

    if (url) {
      window.open(url, '_blank');
      recordShare();
    }
    
    setSharing(false);
  };

  const shareNative = async () => {
    if (!shareInfo || !navigator.share) return;

    const { title, streamerName, shareUrl, isLive } = shareInfo;
    const status = isLive ? 'LIVE' : 'streaming';
    
    try {
      await navigator.share({
        title: `${title} - ${streamerName}`,
        text: `Check out ${streamerName}'s ${status} stream on StreamHub!`,
        url: shareUrl,
      });
      recordShare();
    } catch (error) {
      console.error('Native share failed:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Share Stream</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            </div>
          ) : shareInfo ? (
            <div className="space-y-6">
              {/* Stream Info */}
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  {shareInfo.isLive && (
                    <span className="live-badge text-xs">LIVE</span>
                  )}
                  <span className="text-gray-400 text-sm">{shareInfo.category}</span>
                </div>
                <h3 className="font-semibold text-white mb-1">{shareInfo.title}</h3>
                <p className="text-gray-300 text-sm">by {shareInfo.streamerName}</p>
                
                <div className="flex items-center space-x-4 mt-3 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{shareInfo.viewerCount} viewers</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Share className="w-4 h-4" />
                    <span>{shareInfo.shareCount} shares</span>
                  </div>
                </div>
              </div>

              {/* Copy Link */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stream Link
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={shareInfo.shareUrl}
                    readOnly
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-l-lg px-3 py-2 text-white text-sm"
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`px-4 py-2 border border-l-0 border-gray-600 rounded-r-lg transition-colors ${
                      copied 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Social Sharing */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Share on Social Media
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => shareToSocial('twitter')}
                    disabled={sharing}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Twitter className="w-4 h-4" />
                    <span>Twitter</span>
                  </button>
                  
                  <button
                    onClick={() => shareToSocial('facebook')}
                    disabled={sharing}
                    className="flex items-center space-x-2 bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Facebook className="w-4 h-4" />
                    <span>Facebook</span>
                  </button>
                  
                  <button
                    onClick={() => shareToSocial('whatsapp')}
                    disabled={sharing}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>
                  
                  <button
                    onClick={() => shareToSocial('email')}
                    disabled={sharing}
                    className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </button>
                </div>
              </div>

              {/* Native Share (if supported) */}
              {typeof window !== 'undefined' && 'share' in navigator && (
                <div>
                  <button
                    onClick={shareNative}
                    className="w-full flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Share via Device</span>
                  </button>
                </div>
              )}

              {/* Tips */}
              <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <QrCode className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-yellow-200">
                    <strong>Pro Tip:</strong> Share early to build audience before going live! 
                    Your stream link works even when you're not currently broadcasting.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">Failed to load sharing information</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}