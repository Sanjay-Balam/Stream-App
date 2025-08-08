'use client';

import { useState, useEffect } from 'react';
import { GiftType } from '../types';
import { X, Gift, Sparkles, DollarSign, Send, Eye, EyeOff } from 'lucide-react';

interface GiftSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSendGift: (giftData: {
    giftId: string;
    amount: number;
    recipientId: string;
    message?: string;
    isAnonymous: boolean;
  }) => void;
  recipientId: string;
  recipientUsername: string;
  giftTypes: GiftType[];
}

export default function GiftSelector({ 
  isOpen, 
  onClose, 
  onSendGift, 
  recipientId, 
  recipientUsername, 
  giftTypes 
}: GiftSelectorProps) {
  const [selectedGift, setSelectedGift] = useState<GiftType | null>(null);
  const [amount, setAmount] = useState(1);
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [sending, setSending] = useState(false);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'text-gray-400 border-gray-500';
      case 'rare':
        return 'text-blue-400 border-blue-500';
      case 'epic':
        return 'text-purple-400 border-purple-500';
      case 'legendary':
        return 'text-yellow-400 border-yellow-500';
      default:
        return 'text-gray-400 border-gray-500';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-500 bg-opacity-10';
      case 'rare':
        return 'bg-blue-500 bg-opacity-10';
      case 'epic':
        return 'bg-purple-500 bg-opacity-10';
      case 'legendary':
        return 'bg-yellow-500 bg-opacity-10';
      default:
        return 'bg-gray-500 bg-opacity-10';
    }
  };

  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  const calculateTotal = () => {
    if (!selectedGift) return 0;
    return selectedGift.price * amount;
  };

  const handleSend = async () => {
    if (!selectedGift || sending) return;

    setSending(true);
    try {
      onSendGift({
        giftId: selectedGift.id,
        amount,
        recipientId,
        message: message.trim() || undefined,
        isAnonymous
      });
      
      // Reset form
      setSelectedGift(null);
      setAmount(1);
      setMessage('');
      setIsAnonymous(false);
      onClose();
    } finally {
      setSending(false);
    }
  };

  const groupedGifts = giftTypes.reduce((acc, gift) => {
    if (!acc[gift.rarity]) {
      acc[gift.rarity] = [];
    }
    acc[gift.rarity].push(gift);
    return acc;
  }, {} as Record<string, GiftType[]>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Gift className="w-6 h-6 text-primary-400" />
              <h2 className="text-xl font-bold text-white">Send Gift</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-gray-300 text-sm">
              Sending to: <span className="text-primary-400 font-medium">{recipientUsername}</span>
            </p>
          </div>

          {/* Gift Selection */}
          <div className="mb-6">
            <h3 className="text-white font-medium mb-3">Choose a Gift</h3>
            <div className="space-y-4">
              {Object.entries(groupedGifts).map(([rarity, gifts]) => (
                <div key={rarity}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className={`w-4 h-4 ${getRarityColor(rarity).split(' ')[0]}`} />
                    <span className={`text-sm font-medium capitalize ${getRarityColor(rarity).split(' ')[0]}`}>
                      {rarity}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {gifts.map((gift) => (
                      <button
                        key={gift.id}
                        onClick={() => setSelectedGift(gift)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedGift?.id === gift.id
                            ? getRarityColor(gift.rarity)
                            : 'border-gray-600 hover:border-gray-500'
                        } ${getRarityBg(gift.rarity)}`}
                      >
                        <div className="text-2xl mb-1">{gift.emoji}</div>
                        <div className="text-xs text-white font-medium">{gift.name}</div>
                        <div className="text-xs text-gray-400">{formatPrice(gift.price)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedGift && (
            <div className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quantity (1-100)
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setAmount(Math.max(1, amount - 1))}
                    className="w-8 h-8 rounded bg-gray-600 hover:bg-gray-500 text-white flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-16 text-center bg-gray-700 border border-gray-600 text-white rounded px-2 py-1"
                    min={1}
                    max={100}
                  />
                  <button
                    onClick={() => setAmount(Math.min(100, amount + 1))}
                    className="w-8 h-8 rounded bg-gray-600 hover:bg-gray-500 text-white flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm resize-none"
                  rows={2}
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">{message.length}/200</p>
              </div>

              {/* Anonymous Option */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500 focus:ring-2"
                />
                <div className="flex items-center space-x-2">
                  {isAnonymous ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-300">Send anonymously</span>
                </div>
              </label>

              {/* Total & Send */}
              <div className="bg-gray-700 rounded-lg p-4 mt-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="text-2xl">{selectedGift.emoji}</div>
                    <div>
                      <div className="text-white font-medium">
                        {selectedGift.name} × {amount}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {formatPrice(selectedGift.price)} each
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 text-primary-400 font-bold">
                      <DollarSign className="w-4 h-4" />
                      <span>{formatPrice(calculateTotal())}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span>{sending ? 'Sending...' : 'Send Gift'}</span>
                </button>
              </div>
            </div>
          )}

          {!selectedGift && (
            <p className="text-gray-400 text-center py-8">
              Select a gift to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}