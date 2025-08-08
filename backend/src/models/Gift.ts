import mongoose, { Schema, Document } from 'mongoose';

export interface GiftType {
  id: string;
  name: string;
  emoji: string;
  price: number; // in cents
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  animation?: string;
}

export interface GiftDocument extends Document {
  streamId: mongoose.Types.ObjectId;
  senderId: string;
  senderUsername: string;
  recipientId: string;
  recipientUsername: string;
  giftType: GiftType;
  amount: number;
  totalValue: number; // price * amount
  message?: string;
  isAnonymous: boolean;
  timestamp: Date;
}

const giftTypeSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  emoji: { type: String, required: true },
  price: { type: Number, required: true },
  rarity: { 
    type: String, 
    required: true,
    enum: ['common', 'rare', 'epic', 'legendary']
  },
  animation: { type: String }
}, { _id: false });

const giftSchema = new Schema<GiftDocument>({
  streamId: {
    type: Schema.Types.ObjectId,
    ref: 'Stream',
    required: true
  },
  senderId: {
    type: String,
    required: true
  },
  senderUsername: {
    type: String,
    required: true
  },
  recipientId: {
    type: String,
    required: true
  },
  recipientUsername: {
    type: String,
    required: true
  },
  giftType: {
    type: giftTypeSchema,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  totalValue: {
    type: Number,
    required: true
  },
  message: {
    type: String,
    maxlength: 200
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

giftSchema.index({ streamId: 1, timestamp: -1 });
giftSchema.index({ recipientId: 1, timestamp: -1 });
giftSchema.index({ senderId: 1, timestamp: -1 });

export const Gift = mongoose.model<GiftDocument>('Gift', giftSchema);

// Predefined gift types
export const GIFT_TYPES: GiftType[] = [
  // Common gifts (10-50 cents)
  { id: 'heart', name: 'Heart', emoji: '❤️', price: 10, rarity: 'common' },
  { id: 'thumbs_up', name: 'Thumbs Up', emoji: '👍', price: 15, rarity: 'common' },
  { id: 'clap', name: 'Clap', emoji: '👏', price: 20, rarity: 'common' },
  { id: 'fire', name: 'Fire', emoji: '🔥', price: 25, rarity: 'common' },
  { id: 'star', name: 'Star', emoji: '⭐', price: 30, rarity: 'common' },
  
  // Rare gifts (50 cents - $2)
  { id: 'diamond', name: 'Diamond', emoji: '💎', price: 100, rarity: 'rare' },
  { id: 'crown', name: 'Crown', emoji: '👑', price: 150, rarity: 'rare' },
  { id: 'rocket', name: 'Rocket', emoji: '🚀', price: 200, rarity: 'rare' },
  
  // Epic gifts ($2-$5)
  { id: 'trophy', name: 'Trophy', emoji: '🏆', price: 300, rarity: 'epic' },
  { id: 'champagne', name: 'Champagne', emoji: '🍾', price: 400, rarity: 'epic' },
  { id: 'unicorn', name: 'Unicorn', emoji: '🦄', price: 500, rarity: 'epic' },
  
  // Legendary gifts ($5+)
  { id: 'rainbow', name: 'Rainbow', emoji: '🌈', price: 1000, rarity: 'legendary' },
  { id: 'castle', name: 'Castle', emoji: '🏰', price: 2000, rarity: 'legendary' },
  { id: 'spaceship', name: 'Spaceship', emoji: '🛸', price: 5000, rarity: 'legendary' }
];