'use client';

import { useState, useEffect } from 'react';
import { Poll as PollType } from '../types';
import { useAuthStore } from '../stores/auth';
import { Check, Clock, Users, BarChart3 } from 'lucide-react';

interface PollProps {
  poll: PollType;
  onVote: (pollId: string, optionIds: string[]) => void;
  onEndPoll?: (pollId: string) => void;
  canEndPoll?: boolean;
}

export default function PollComponent({ poll, onVote, onEndPoll, canEndPoll }: PollProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Check if user has already voted
    if (user && poll.options.some(option => option.voters.includes(user.id))) {
      setHasVoted(true);
      const userVotes = poll.options
        .filter(option => option.voters.includes(user.id))
        .map(option => option.id);
      setSelectedOptions(userVotes);
    }
  }, [poll, user]);

  useEffect(() => {
    if (!poll.expiresAt) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(poll.expiresAt!).getTime();
      const difference = expiry - now;

      if (difference > 0) {
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setTimeRemaining(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [poll.expiresAt]);

  const handleOptionSelect = (optionId: string) => {
    if (!poll.isActive || hasVoted) return;

    if (poll.allowMultipleVotes) {
      setSelectedOptions(prev => 
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleSubmitVote = () => {
    if (selectedOptions.length === 0 || !isAuthenticated) return;

    onVote(poll.id, selectedOptions);
    setHasVoted(true);
  };

  const getVotePercentage = (option: typeof poll.options[0]) => {
    if (poll.totalVotes === 0) return 0;
    return (option.votes / poll.totalVotes) * 100;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-gray-700 rounded-lg p-4 mb-4 border-l-4 border-primary-500">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-primary-400" />
          <span className="text-primary-400 font-medium text-sm">Poll</span>
          {poll.isActive ? (
            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">Active</span>
          ) : (
            <span className="bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded-full">Ended</span>
          )}
        </div>
        
        <div className="flex items-center space-x-3 text-xs text-gray-400">
          {timeRemaining && (
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{timeRemaining}</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Users className="w-3 h-3" />
            <span>{poll.totalVotes} votes</span>
          </div>
          <span>{formatTime(poll.createdAt)}</span>
        </div>
      </div>

      <h3 className="text-white font-medium mb-3">{poll.question}</h3>

      <div className="space-y-2">
        {poll.options.map((option) => {
          const percentage = getVotePercentage(option);
          const isSelected = selectedOptions.includes(option.id);
          const showResults = poll.showResults || !poll.isActive;
          const userVoted = user && option.voters.includes(user.id);

          return (
            <div key={option.id} className="relative">
              {showResults && (
                <div
                  className="absolute inset-0 bg-primary-600 bg-opacity-20 rounded transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              )}
              
              <div
                className={`relative flex items-center justify-between p-3 rounded border transition-colors cursor-pointer ${
                  poll.isActive && !hasVoted
                    ? isSelected
                      ? 'border-primary-500 bg-primary-600 bg-opacity-20'
                      : 'border-gray-600 hover:border-gray-500'
                    : 'border-gray-600 cursor-default'
                } ${userVoted ? 'bg-green-600 bg-opacity-10' : ''}`}
                onClick={() => handleOptionSelect(option.id)}
              >
                <div className="flex items-center space-x-2">
                  {poll.allowMultipleVotes ? (
                    <div className={`w-4 h-4 border rounded ${
                      isSelected ? 'bg-primary-500 border-primary-500' : 'border-gray-500'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  ) : (
                    <div className={`w-4 h-4 border rounded-full ${
                      isSelected ? 'bg-primary-500 border-primary-500' : 'border-gray-500'
                    }`}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />}
                    </div>
                  )}
                  
                  <span className="text-white text-sm">{option.text}</span>
                  {userVoted && <Check className="w-4 h-4 text-green-400" />}
                </div>

                {showResults && (
                  <div className="flex items-center space-x-2 text-sm text-gray-300">
                    <span>{option.votes}</span>
                    <span className="text-primary-400">{percentage.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {poll.allowMultipleVotes && (
        <p className="text-xs text-gray-400 mt-2">
          Multiple selections allowed
        </p>
      )}

      <div className="flex justify-between items-center mt-4">
        {poll.isActive && !hasVoted && isAuthenticated && (
          <button
            onClick={handleSubmitVote}
            disabled={selectedOptions.length === 0}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Vote
          </button>
        )}

        {poll.isActive && canEndPoll && onEndPoll && (
          <button
            onClick={() => onEndPoll(poll.id)}
            className="btn-secondary px-3 py-1 text-sm ml-auto"
          >
            End Poll
          </button>
        )}

        {!isAuthenticated && poll.isActive && (
          <p className="text-gray-400 text-sm">Sign in to vote</p>
        )}
      </div>
    </div>
  );
}