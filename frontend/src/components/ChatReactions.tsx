'use client';

import { useState } from 'react';
import { ChatReaction } from '../types';
import { useAuthStore } from '../stores/auth';

interface ChatReactionsProps {
  messageId: string;
  reactions: ChatReaction[];
  onReaction: (messageId: string, emoji: string, action: 'add' | 'remove') => void;
  canReact: boolean;
}

const AVAILABLE_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '💯', '👏'];

export default function ChatReactions({ messageId, reactions, onReaction, canReact }: ChatReactionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { user } = useAuthStore();

  const getReactionByEmoji = (emoji: string) => 
    reactions?.find(r => r.emoji === emoji);

  const hasUserReacted = (emoji: string) => 
    reactions?.find(r => r.emoji === emoji)?.users.some(u => u.userId === user?.id);

  const handleEmojiClick = (emoji: string) => {
    if (!canReact) return;

    const userReacted = hasUserReacted(emoji);
    onReaction(messageId, emoji, userReacted ? 'remove' : 'add');
    setShowEmojiPicker(false);
  };

  const getTooltipText = (reaction: ChatReaction) => {
    const usernames = reaction.users.map(u => u.username).slice(0, 5);
    const remainingCount = reaction.count - usernames.length;
    
    let tooltip = usernames.join(', ');
    if (remainingCount > 0) {
      tooltip += ` and ${remainingCount} more`;
    }
    
    return tooltip;
  };

  return (
    <div className="flex items-center space-x-1 mt-1">
      {/* Existing reactions */}
      {reactions && reactions.length > 0 && (
        <div className="flex items-center space-x-1">
          {reactions.map((reaction) => (
            <button
              key={reaction.emoji}
              onClick={() => handleEmojiClick(reaction.emoji)}
              disabled={!canReact}
              className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${
                hasUserReacted(reaction.emoji)
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
              } ${!canReact ? 'cursor-default' : 'cursor-pointer'}`}
              title={getTooltipText(reaction)}
            >
              <span>{reaction.emoji}</span>
              <span className="text-xs">{reaction.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Add reaction button */}
      {canReact && (
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-6 h-6 rounded-full bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white transition-colors flex items-center justify-center text-xs"
            title="Add reaction"
          >
            +
          </button>

          {/* Emoji picker dropdown */}
          {showEmojiPicker && (
            <div className="absolute bottom-8 left-0 z-10 bg-gray-700 rounded-lg shadow-lg p-2 border border-gray-600">
              <div className="grid grid-cols-5 gap-1">
                {AVAILABLE_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className="w-8 h-8 rounded hover:bg-gray-600 transition-colors flex items-center justify-center text-lg"
                    title={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}