'use client';

import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuthStore } from '../stores/auth';
import { ChatMessage } from '../types';
import { Send, Users } from 'lucide-react';

interface ChatProps {
  streamId: string;
  wsUrl: string;
}

export default function Chat({ streamId, wsUrl }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [viewers, setViewers] = useState(0);
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
          };
          setMessages(prev => [...prev, newMessage]);
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

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col bg-gray-800">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">Stream Chat</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Users className="w-4 h-4" />
            <span>{viewers} viewers</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Be the first to say something!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">
                  {formatTime(message.timestamp)}
                </span>
                <span className="font-medium text-primary-400 text-sm">
                  {message.username}
                </span>
              </div>
              <p className="text-white text-sm break-words">
                {message.message}
              </p>
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
    </div>
  );
}