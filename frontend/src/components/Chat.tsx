'use client';

import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuthStore } from '../stores/auth';
import { ChatMessage, Poll, Gift, GiftType, StreamAnalytics } from '../types';
import { Send, Users, BarChart3, Gift as GiftIcon, TrendingUp } from 'lucide-react';
import ChatReactions from './ChatReactions';
import PollComponent from './Poll';
import CreatePoll from './CreatePoll';
import GiftSelector from './GiftSelector';
import GiftAnimation from './GiftAnimation';
import AnalyticsDashboard from './AnalyticsDashboard';

interface ChatProps {
  streamId: string;
  wsUrl: string;
  isStreamer?: boolean;
  streamerId?: string;
}

export default function Chat({ streamId, wsUrl, isStreamer = false, streamerId }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [viewers, setViewers] = useState(0);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [showGiftSelector, setShowGiftSelector] = useState(false);
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false);
  const [giftTypes, setGiftTypes] = useState<GiftType[]>([]);
  const [giftAnimations, setGiftAnimations] = useState<Gift[]>([]);
  const [analytics, setAnalytics] = useState<StreamAnalytics | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useAuthStore();

  const { isConnected, sendMessage } = useWebSocket({
    url: wsUrl,
    onMessage: (message) => {
      switch (message.type) {
        case 'chat_message':
          const newMessage: ChatMessage = {
            id: message.id,
            userId: message.userId,
            username: message.username,
            message: message.message,
            timestamp: message.timestamp,
            reactions: []
          };
          setMessages(prev => [...prev, newMessage]);
          break;
          
        case 'chat_reaction_update':
          setMessages(prev => 
            prev.map(msg => 
              msg.id === message.messageId 
                ? { ...msg, reactions: message.reactions }
                : msg
            )
          );
          break;
          
        case 'poll_created':
        case 'poll_updated':
          setActivePoll(message.poll);
          break;
          
        case 'poll_ended':
          setActivePoll(message.poll);
          // Auto-hide ended poll after 30 seconds
          setTimeout(() => {
            setActivePoll(prev => prev?.id === message.poll.id ? null : prev);
          }, 30000);
          break;
          
        case 'gift_types':
          setGiftTypes(message.giftTypes);
          break;
          
        case 'analytics_data':
          setAnalytics(message.analytics);
          break;
          
        case 'gift_sent':
          // Add gift animation
          setGiftAnimations(prev => [...prev, message.gift]);
          
          // Add gift message to chat
          const giftMessage: ChatMessage = {
            id: `gift_${message.gift.id}`,
            userId: 'system',
            username: 'System',
            message: `${message.gift.senderUsername} sent ${message.gift.amount > 1 ? `${message.gift.amount}x ` : ''}${message.gift.giftType.name} ${message.gift.giftType.emoji} to ${message.gift.recipientUsername}${message.gift.message ? ` - "${message.gift.message}"` : ''}`,
            timestamp: message.gift.timestamp,
            reactions: []
          };
          setMessages(prev => [...prev, giftMessage]);
          break;
          
        case 'user_joined':
        case 'user_left':
          setViewers(message.viewerCount || 0);
          break;
          
        case 'joined_stream':
          setViewers(message.viewerCount || 0);
          break;
      }
    },
    onOpen: () => {
      if (isAuthenticated && user) {
        sendMessage({
          type: 'authenticate',
          token: localStorage.getItem('accessToken')
        });
      }
      
      // Request gift types
      sendMessage({
        type: 'get_gift_types'
      });
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isConnected && isAuthenticated && user) {
      sendMessage({
        type: 'authenticate',
        token: localStorage.getItem('accessToken')
      });
      
      setTimeout(() => {
        sendMessage({
          type: 'join_stream',
          streamId
        });
      }, 100);
    }
  }, [isConnected, isAuthenticated, user, streamId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !isConnected || !isAuthenticated) {
      return;
    }

    sendMessage({
      type: 'chat_message',
      text: inputMessage.trim()
    });

    setInputMessage('');
  };

  const handleReaction = (messageId: string, emoji: string, action: 'add' | 'remove') => {
    if (!isConnected || !isAuthenticated) return;

    sendMessage({
      type: 'chat_reaction',
      messageId,
      emoji,
      action
    });
  };

  const handleCreatePoll = (pollData: {
    question: string;
    options: string[];
    allowMultipleVotes: boolean;
    duration?: number;
  }) => {
    if (!isConnected || !isStreamer) return;

    sendMessage({
      type: 'create_poll',
      ...pollData
    });
    setShowCreatePoll(false);
  };

  const handleVotePoll = (pollId: string, optionIds: string[]) => {
    if (!isConnected || !isAuthenticated) return;

    sendMessage({
      type: 'vote_poll',
      pollId,
      optionIds
    });
  };

  const handleEndPoll = (pollId: string) => {
    if (!isConnected || !isStreamer) return;

    sendMessage({
      type: 'end_poll',
      pollId
    });
  };

  const handleSendGift = (giftData: {
    giftId: string;
    amount: number;
    recipientId: string;
    message?: string;
    isAnonymous: boolean;
  }) => {
    if (!isConnected || !isAuthenticated) return;

    sendMessage({
      type: 'send_gift',
      ...giftData,
      giftMessage: giftData.message
    });
    setShowGiftSelector(false);
  };

  const removeGiftAnimation = (giftId: string) => {
    setGiftAnimations(prev => prev.filter(g => g.id !== giftId));
  };

  const handleGetAnalytics = () => {
    if (!isConnected || !isStreamer) return;

    sendMessage({
      type: 'get_analytics'
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col bg-gray-800">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">Stream Chat</h3>
          <div className="flex items-center space-x-4">
            {isStreamer && (
              <>
                <button
                  onClick={() => setShowCreatePoll(true)}
                  className="flex items-center space-x-1 text-primary-400 hover:text-primary-300 transition-colors"
                  title="Create Poll"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm">Poll</span>
                </button>
                
                <button
                  onClick={() => {
                    handleGetAnalytics();
                    setShowAnalyticsDashboard(true);
                  }}
                  className="flex items-center space-x-1 text-green-400 hover:text-green-300 transition-colors"
                  title="View Analytics"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Stats</span>
                </button>
              </>
            )}
            
            {!isStreamer && streamerId && isAuthenticated && (
              <button
                onClick={() => setShowGiftSelector(true)}
                className="flex items-center space-x-1 text-yellow-400 hover:text-yellow-300 transition-colors"
                title="Send Gift"
              >
                <GiftIcon className="w-4 h-4" />
                <span className="text-sm">Gift</span>
              </button>
            )}
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Users className="w-4 h-4" />
              <span>{viewers} viewers</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Active Poll */}
        {activePoll && (
          <PollComponent
            poll={activePoll}
            onVote={handleVotePoll}
            onEndPoll={handleEndPoll}
            canEndPoll={isStreamer}
          />
        )}

        {/* Chat Messages */}
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Be the first to say something!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex flex-col space-y-1 ${
                message.userId === 'system' 
                  ? 'bg-gradient-to-r from-yellow-500/10 to-transparent p-3 rounded-lg border-l-4 border-yellow-500' 
                  : ''
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">
                  {formatTime(message.timestamp)}
                </span>
                <span className={`font-medium text-sm ${
                  message.userId === 'system' 
                    ? 'text-yellow-400' 
                    : 'text-primary-400'
                }`}>
                  {message.username}
                </span>
              </div>
              <p className="text-white text-sm break-words">
                {message.message}
              </p>
              {message.userId !== 'system' && (
                <ChatReactions
                  messageId={message.id}
                  reactions={message.reactions || []}
                  onReaction={handleReaction}
                  canReact={isAuthenticated && isConnected}
                />
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {isAuthenticated ? (
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 input text-sm"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || !isConnected}
              className="btn-primary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {isConnected ? 'Connected' : 'Connecting...'}
          </div>
        </form>
      ) : (
        <div className="p-4 border-t border-gray-700 text-center">
          <p className="text-gray-400 text-sm mb-2">Sign in to chat</p>
          <a href="/login" className="btn-primary text-sm">
            Sign In
          </a>
        </div>
      )}

      {/* Create Poll Modal */}
      <CreatePoll
        isOpen={showCreatePoll}
        onClose={() => setShowCreatePoll(false)}
        onCreatePoll={handleCreatePoll}
      />

      {/* Gift Selector Modal */}
      {streamerId && (
        <GiftSelector
          isOpen={showGiftSelector}
          onClose={() => setShowGiftSelector(false)}
          onSendGift={handleSendGift}
          recipientId={streamerId}
          recipientUsername="Streamer"
          giftTypes={giftTypes}
        />
      )}

      {/* Analytics Dashboard */}
      <AnalyticsDashboard
        isOpen={showAnalyticsDashboard}
        onClose={() => setShowAnalyticsDashboard(false)}
        analytics={analytics}
        onRefresh={handleGetAnalytics}
      />

      {/* Gift Animations */}
      {giftAnimations.map((gift) => (
        <GiftAnimation
          key={gift.id}
          gift={gift}
          onComplete={() => removeGiftAnimation(gift.id)}
        />
      ))}
    </div>
  );
}