'use client';

import { useState } from 'react';
import { X, Plus, Trash2, BarChart3, Clock, CheckSquare } from 'lucide-react';

interface CreatePollProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePoll: (pollData: {
    question: string;
    options: string[];
    allowMultipleVotes: boolean;
    duration?: number;
  }) => void;
}

export default function CreatePoll({ isOpen, onClose, onCreatePoll }: CreatePollProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
  const [hasDuration, setHasDuration] = useState(false);
  const [duration, setDuration] = useState(300); // 5 minutes default
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) return;
    
    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) return;

    setIsSubmitting(true);
    
    try {
      onCreatePoll({
        question: question.trim(),
        options: validOptions.map(opt => opt.trim()),
        allowMultipleVotes,
        duration: hasDuration ? duration : undefined
      });
      
      // Reset form
      setQuestion('');
      setOptions(['', '']);
      setAllowMultipleVotes(false);
      setHasDuration(false);
      setDuration(300);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = question.trim() && options.filter(opt => opt.trim()).length >= 2;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-6 h-6 text-primary-400" />
              <h2 className="text-xl font-bold text-white">Create Poll</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Question */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Poll Question
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What's your question?"
              className="input w-full"
              maxLength={200}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {question.length}/200 characters
            </p>
          </div>

          {/* Options */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Poll Options (2-6 options)
            </label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="input flex-1 text-sm"
                    maxLength={100}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {options.length < 6 && (
              <button
                type="button"
                onClick={addOption}
                className="flex items-center space-x-1 text-primary-400 hover:text-primary-300 text-sm mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Option</span>
              </button>
            )}
          </div>

          {/* Settings */}
          <div className="mb-6 space-y-4">
            <h3 className="text-sm font-medium text-gray-300">Poll Settings</h3>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={allowMultipleVotes}
                onChange={(e) => setAllowMultipleVotes(e.target.checked)}
                className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500 focus:ring-2"
              />
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">Allow multiple selections</span>
              </div>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={hasDuration}
                onChange={(e) => setHasDuration(e.target.checked)}
                className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500 focus:ring-2"
              />
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">Set duration</span>
              </div>
            </label>

            {hasDuration && (
              <div className="ml-7">
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 p-2"
                >
                  <option value={60}>1 minute</option>
                  <option value={300}>5 minutes</option>
                  <option value={600}>10 minutes</option>
                  <option value={900}>15 minutes</option>
                  <option value={1800}>30 minutes</option>
                  <option value={3600}>1 hour</option>
                </select>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Poll'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}