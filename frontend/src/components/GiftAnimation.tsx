'use client';

import { useEffect, useState } from 'react';
import { Gift } from '../types';
import { Sparkles } from 'lucide-react';

interface GiftAnimationProps {
  gift: Gift;
  onComplete: () => void;
}

export default function GiftAnimation({ gift, onComplete }: GiftAnimationProps) {
  const [stage, setStage] = useState<'enter' | 'display' | 'exit'>('enter');

  useEffect(() => {
    const timer1 = setTimeout(() => setStage('display'), 500);
    const timer2 = setTimeout(() => setStage('exit'), 3000);
    const timer3 = setTimeout(onComplete, 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  const getRarityEffect = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'from-yellow-500 to-orange-500 shadow-yellow-500/50';
      case 'epic':
        return 'from-purple-500 to-pink-500 shadow-purple-500/50';
      case 'rare':
        return 'from-blue-500 to-indigo-500 shadow-blue-500/50';
      default:
        return 'from-gray-400 to-gray-500 shadow-gray-400/50';
    }
  };

  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  const getAnimationClass = () => {
    switch (stage) {
      case 'enter':
        return 'animate-bounce scale-0 opacity-0';
      case 'display':
        return 'scale-100 opacity-100 transition-all duration-500';
      case 'exit':
        return 'scale-110 opacity-0 translate-y-4 transition-all duration-1000';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className={`${getAnimationClass()}`}>
        <div className={`
          bg-gradient-to-r ${getRarityEffect(gift.giftType.rarity)} 
          p-6 rounded-2xl shadow-2xl 
          border-2 border-white border-opacity-20
          backdrop-blur-sm
          max-w-sm mx-4
          ${gift.giftType.rarity === 'legendary' ? 'animate-pulse' : ''}
        `}>
          {/* Sparkle effects for rare+ gifts */}
          {['rare', 'epic', 'legendary'].includes(gift.giftType.rarity) && (
            <div className="absolute -inset-2 overflow-hidden rounded-2xl">
              {[...Array(8)].map((_, i) => (
                <Sparkles
                  key={i}
                  className={`absolute w-4 h-4 text-white opacity-70 animate-ping`}
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${i * 200}ms`,
                    animationDuration: '1s'
                  }}
                />
              ))}
            </div>
          )}

          <div className="relative text-center">
            {/* Gift Emoji */}
            <div className="text-6xl mb-3 animate-bounce">
              {gift.giftType.emoji}
            </div>

            {/* Gift Info */}
            <div className="text-white mb-2">
              <div className="text-xl font-bold">
                {gift.amount > 1 ? `${gift.amount}x ` : ''}{gift.giftType.name}
              </div>
              <div className="text-sm opacity-90">
                {formatPrice(gift.totalValue)} gift!
              </div>
            </div>

            {/* Sender/Recipient */}
            <div className="text-white text-sm mb-2">
              <div className="opacity-90">
                From: <span className="font-medium">{gift.senderUsername}</span>
              </div>
              <div className="opacity-90">
                To: <span className="font-medium">{gift.recipientUsername}</span>
              </div>
            </div>

            {/* Message */}
            {gift.message && (
              <div className="bg-black bg-opacity-20 rounded-lg p-2 text-white text-sm italic">
                "{gift.message}"
              </div>
            )}

            {/* Rarity Badge */}
            <div className={`
              inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
              ${gift.giftType.rarity === 'legendary' ? 'bg-yellow-500 text-black' :
                gift.giftType.rarity === 'epic' ? 'bg-purple-500 text-white' :
                gift.giftType.rarity === 'rare' ? 'bg-blue-500 text-white' :
                'bg-gray-500 text-white'
              }
            `}>
              {gift.giftType.rarity}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}