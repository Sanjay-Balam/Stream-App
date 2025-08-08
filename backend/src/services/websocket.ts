import { WebSocketServer, WebSocket } from 'ws';
import { ChatMessage, ChatReaction, Poll, Gift, GIFT_TYPES, Stream } from '../models';
import { GuestStream } from '../models/GuestStream';
import { AnalyticsService } from './analytics';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { JWTPayload } from '../middleware/auth';

interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  username: string;
  streamId?: string;
  isStreamer: boolean;
  isGuest?: boolean;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, ConnectedClient> = new Map();
  private streamViewers: Map<string, Set<string>> = new Map();
  private analytics: AnalyticsService;

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.analytics = AnalyticsService.getInstance();
    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket, request) => {
      console.log('New WebSocket connection');

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
        } catch (error) {
          console.error('WebSocket message error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      ws.on('close', () => {
        this.handleDisconnection(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    console.log(`🚀 WebSocket server running on port ${this.wss.options.port}`);
  }

  private async handleMessage(ws: WebSocket, message: any) {
    switch (message.type) {
      case 'authenticate':
        await this.handleAuthentication(ws, message);
        break;
      
      case 'join_stream':
        await this.handleJoinStream(ws, message);
        break;
      
      case 'join_stream_guest':
        await this.handleJoinStreamAsGuest(ws, message);
        break;
      
      case 'leave_stream':
        await this.handleLeaveStream(ws, message);
        break;
      
      case 'chat_message':
        await this.handleChatMessage(ws, message);
        break;
      
      case 'chat_reaction':
        await this.handleChatReaction(ws, message);
        break;
      
      case 'create_poll':
        await this.handleCreatePoll(ws, message);
        break;
      
      case 'vote_poll':
        await this.handleVotePoll(ws, message);
        break;
      
      case 'end_poll':
        await this.handleEndPoll(ws, message);
        break;
      
      case 'send_gift':
        await this.handleSendGift(ws, message);
        break;
      
      case 'get_gift_types':
        await this.handleGetGiftTypes(ws, message);
        break;
      
      case 'get_analytics':
        await this.handleGetAnalytics(ws, message);
        break;
      
      case 'webrtc_offer':
      case 'webrtc_answer':
      case 'webrtc_ice_candidate':
        await this.handleWebRTCSignaling(ws, message);
        break;
      
      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type'
        }));
    }
  }

  private async handleAuthentication(ws: WebSocket, message: any) {
    try {
      const { token } = message;
      
      if (!token) {
        ws.send(JSON.stringify({
          type: 'auth_error',
          message: 'Token required'
        }));
        return;
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
      
      const clientId = `${decoded.userId}_${Date.now()}`;
      
      this.clients.set(clientId, {
        ws,
        userId: decoded.userId,
        username: decoded.username,
        isStreamer: false
      });

      ws.send(JSON.stringify({
        type: 'authenticated',
        clientId
      }));

    } catch (error) {
      ws.send(JSON.stringify({
        type: 'auth_error',
        message: 'Invalid token'
      }));
    }
  }

  private async handleJoinStream(ws: WebSocket, message: any) {
    try {
      const { streamId } = message;
      const client = this.findClientByWs(ws);
      
      if (!client) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Not authenticated'
        }));
        return;
      }

      // Try to find regular stream first
      let stream = await Stream.findById(streamId).populate('streamerId');
      let isGuestStream = false;
      
      // If not found, try guest stream
      if (!stream) {
        const guestStream = await GuestStream.findById(streamId);
        if (guestStream && guestStream.isLive) {
          stream = {
            _id: guestStream._id,
            isLive: guestStream.isLive,
            streamerId: { _id: guestStream.guestId },
            isGuestStream: true
          } as any;
          isGuestStream = true;
        }
      }
      
      if (!stream || !stream.isLive) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Stream not found or not live'
        }));
        return;
      }

      client.streamId = streamId;
      client.isStreamer = stream.streamerId._id.toString() === client.userId;

      if (!this.streamViewers.has(streamId)) {
        this.streamViewers.set(streamId, new Set());
      }
      
      this.streamViewers.get(streamId)!.add(client.userId);

      // Track analytics
      const streamObj = isGuestStream ? await GuestStream.findById(streamId) : await Stream.findById(streamId).populate('streamerId');
      if (streamObj) {
        const streamerId = isGuestStream ? streamObj.guestId : streamObj.streamerId._id.toString();
        this.analytics.viewerJoined(streamId, streamerId, client.userId);
      }

      // Update viewer count in appropriate model
      if (isGuestStream) {
        await GuestStream.findByIdAndUpdate(streamId, {
          viewerCount: this.streamViewers.get(streamId)!.size
        });
      } else {
        await Stream.findByIdAndUpdate(streamId, {
          viewerCount: this.streamViewers.get(streamId)!.size
        });
      }

      this.broadcastToStream(streamId, {
        type: 'user_joined',
        userId: client.userId,
        username: client.username,
        viewerCount: this.streamViewers.get(streamId)!.size
      });

      ws.send(JSON.stringify({
        type: 'joined_stream',
        streamId,
        isStreamer: client.isStreamer,
        viewerCount: this.streamViewers.get(streamId)!.size
      }));

    } catch (error) {
      console.error('Join stream error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to join stream'
      }));
    }
  }

  private async handleJoinStreamAsGuest(ws: WebSocket, message: any) {
    try {
      const { streamId, guestUsername } = message;
      
      // Try to find regular stream first
      let stream = await Stream.findById(streamId).populate('streamerId');
      let isGuestStream = false;
      
      // If not found, try guest stream
      if (!stream) {
        const guestStream = await GuestStream.findById(streamId);
        if (guestStream && guestStream.isLive) {
          stream = {
            _id: guestStream._id,
            isLive: guestStream.isLive,
            streamerId: { _id: guestStream.guestId },
            isGuestStream: true
          } as any;
          isGuestStream = true;
        }
      }
      
      if (!stream || !stream.isLive) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Stream not found or not live'
        }));
        return;
      }

      // Create guest client
      const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const clientId = `${guestId}_${Date.now()}`;
      
      this.clients.set(clientId, {
        ws,
        userId: guestId,
        username: guestUsername || 'Guest',
        streamId,
        isStreamer: false,
        isGuest: true
      });

      if (!this.streamViewers.has(streamId)) {
        this.streamViewers.set(streamId, new Set());
      }
      
      this.streamViewers.get(streamId)!.add(guestId);

      // Track analytics
      const streamObj = isGuestStream ? await GuestStream.findById(streamId) : await Stream.findById(streamId).populate('streamerId');
      if (streamObj) {
        const streamerId = isGuestStream ? streamObj.guestId : streamObj.streamerId._id.toString();
        this.analytics.viewerJoined(streamId, streamerId, guestId);
      }

      // Update viewer count in appropriate model
      if (isGuestStream) {
        await GuestStream.findByIdAndUpdate(streamId, {
          viewerCount: this.streamViewers.get(streamId)!.size
        });
      } else {
        await Stream.findByIdAndUpdate(streamId, {
          viewerCount: this.streamViewers.get(streamId)!.size
        });
      }

      this.broadcastToStream(streamId, {
        type: 'user_joined',
        userId: guestId,
        username: guestUsername || 'Guest',
        viewerCount: this.streamViewers.get(streamId)!.size
      });

      ws.send(JSON.stringify({
        type: 'joined_stream',
        streamId,
        isStreamer: false,
        viewerCount: this.streamViewers.get(streamId)!.size,
        clientId
      }));

    } catch (error) {
      console.error('Join guest stream error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to join stream as guest'
      }));
    }
  }

  private async handleLeaveStream(ws: WebSocket, message: any) {
    const client = this.findClientByWs(ws);
    
    if (!client || !client.streamId) return;

    const streamId = client.streamId;
    
    // Track analytics
    this.analytics.viewerLeft(streamId, client.userId);
    
    this.streamViewers.get(streamId)?.delete(client.userId);
    
    if (this.streamViewers.get(streamId)?.size === 0) {
      this.streamViewers.delete(streamId);
    }

    // Determine if it's a guest stream
    let isGuestStream = false;
    try {
      const regularStream = await Stream.findById(streamId);
      if (!regularStream) {
        const guestStream = await GuestStream.findById(streamId);
        if (guestStream) {
          isGuestStream = true;
        }
      }

      // Update viewer count in appropriate model
      if (isGuestStream) {
        await GuestStream.findByIdAndUpdate(streamId, {
          viewerCount: this.streamViewers.get(streamId)?.size || 0
        });
      } else {
        await Stream.findByIdAndUpdate(streamId, {
          viewerCount: this.streamViewers.get(streamId)?.size || 0
        });
      }
    } catch (error) {
      console.error('Error updating viewer count on leave:', error);
    }

    this.broadcastToStream(streamId, {
      type: 'user_left',
      userId: client.userId,
      username: client.username,
      viewerCount: this.streamViewers.get(streamId)?.size || 0
    });

    client.streamId = undefined;
    client.isStreamer = false;
  }

  private async handleChatMessage(ws: WebSocket, message: any) {
    try {
      const client = this.findClientByWs(ws);
      
      if (!client || !client.streamId) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Not in a stream'
        }));
        return;
      }

      const { text } = message;
      
      if (!text || text.trim().length === 0) {
        return;
      }

      const chatMessage = new ChatMessage({
        streamId: client.streamId,
        userId: client.userId,
        username: client.username,
        message: text.trim()
      });

      await chatMessage.save();

      // Track analytics
      this.analytics.messagePosted(client.streamId);

      this.broadcastToStream(client.streamId, {
        type: 'chat_message',
        id: chatMessage._id,
        userId: client.userId,
        username: client.username,
        message: text.trim(),
        timestamp: chatMessage.timestamp
      });

    } catch (error) {
      console.error('Chat message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to send message'
      }));
    }
  }

  private async handleChatReaction(ws: WebSocket, message: any) {
    try {
      const client = this.findClientByWs(ws);
      
      if (!client || !client.streamId) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Not in a stream'
        }));
        return;
      }

      const { messageId, emoji, action } = message;
      
      if (!messageId || !emoji) {
        return;
      }

      // Validate emoji
      const allowedEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '💯', '👏'];
      if (!allowedEmojis.includes(emoji)) {
        return;
      }

      if (action === 'add') {
        // Add reaction (replace existing if user already reacted to this message)
        await ChatReaction.findOneAndUpdate(
          { messageId, userId: client.userId },
          {
            messageId,
            streamId: client.streamId,
            userId: client.userId,
            username: client.username,
            emoji,
            timestamp: new Date()
          },
          { upsert: true, new: true }
        );

        // Track analytics
        this.analytics.reactionAdded(client.streamId);
      } else if (action === 'remove') {
        // Remove reaction
        await ChatReaction.findOneAndDelete({
          messageId,
          userId: client.userId,
          emoji
        });
      }

      // Get updated reaction counts for this message
      const reactionCounts = await ChatReaction.aggregate([
        { $match: { messageId: new mongoose.Types.ObjectId(messageId) } },
        { $group: { _id: '$emoji', count: { $sum: 1 }, users: { $push: { userId: '$userId', username: '$username' } } } },
        { $sort: { count: -1 } }
      ]);

      this.broadcastToStream(client.streamId, {
        type: 'chat_reaction_update',
        messageId,
        reactions: reactionCounts.map(r => ({
          emoji: r._id,
          count: r.count,
          users: r.users
        }))
      });

    } catch (error) {
      console.error('Chat reaction error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process reaction'
      }));
    }
  }

  private async handleCreatePoll(ws: WebSocket, message: any) {
    try {
      const client = this.findClientByWs(ws);
      
      if (!client || !client.streamId || !client.isStreamer) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Only streamers can create polls'
        }));
        return;
      }

      const { question, options, allowMultipleVotes, duration } = message;
      
      if (!question || !options || !Array.isArray(options) || options.length < 2 || options.length > 6) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid poll data'
        }));
        return;
      }

      // Close any existing active polls for this stream
      await Poll.updateMany(
        { streamId: client.streamId, isActive: true },
        { isActive: false }
      );

      const pollOptions = options.map((text: string, index: number) => ({
        id: `option_${index + 1}`,
        text: text.trim().substring(0, 100),
        votes: 0,
        voters: []
      }));

      const expiresAt = duration ? new Date(Date.now() + duration * 1000) : undefined;

      const poll = new Poll({
        streamId: client.streamId,
        creatorId: client.userId,
        creatorUsername: client.username,
        question: question.trim().substring(0, 200),
        options: pollOptions,
        allowMultipleVotes: Boolean(allowMultipleVotes),
        expiresAt
      });

      await poll.save();

      this.broadcastToStream(client.streamId, {
        type: 'poll_created',
        poll: {
          id: poll._id,
          question: poll.question,
          options: poll.options,
          allowMultipleVotes: poll.allowMultipleVotes,
          showResults: poll.showResults,
          totalVotes: poll.totalVotes,
          isActive: poll.isActive,
          createdAt: poll.createdAt,
          expiresAt: poll.expiresAt
        }
      });

    } catch (error) {
      console.error('Create poll error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to create poll'
      }));
    }
  }

  private async handleVotePoll(ws: WebSocket, message: any) {
    try {
      const client = this.findClientByWs(ws);
      
      if (!client || !client.streamId) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Not in a stream'
        }));
        return;
      }

      const { pollId, optionIds } = message;
      
      if (!pollId || !optionIds || !Array.isArray(optionIds)) {
        return;
      }

      const poll = await Poll.findById(pollId);
      
      if (!poll || !poll.isActive || poll.streamId.toString() !== client.streamId) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Poll not found or not active'
        }));
        return;
      }

      // Check if poll has expired
      if (poll.expiresAt && poll.expiresAt < new Date()) {
        await Poll.findByIdAndUpdate(pollId, { isActive: false });
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Poll has expired'
        }));
        return;
      }

      // Remove user's previous votes if not allowing multiple votes
      if (!poll.allowMultipleVotes) {
        poll.options.forEach(option => {
          const voterIndex = option.voters.indexOf(client.userId);
          if (voterIndex > -1) {
            option.voters.splice(voterIndex, 1);
            option.votes = Math.max(0, option.votes - 1);
          }
        });
      }

      // Add new votes
      const votedOptions: string[] = [];
      optionIds.forEach((optionId: string) => {
        const option = poll.options.find(o => o.id === optionId);
        if (option && !option.voters.includes(client.userId)) {
          option.voters.push(client.userId);
          option.votes += 1;
          votedOptions.push(optionId);
        }
      });

      // Recalculate total votes
      poll.totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);

      await poll.save();

      // Track analytics
      this.analytics.pollVoteRecorded(client.streamId);

      // Broadcast updated poll results
      this.broadcastToStream(client.streamId, {
        type: 'poll_updated',
        poll: {
          id: poll._id,
          question: poll.question,
          options: poll.options.map(option => ({
            ...option,
            voters: poll.showResults ? option.voters : []
          })),
          allowMultipleVotes: poll.allowMultipleVotes,
          showResults: poll.showResults,
          totalVotes: poll.totalVotes,
          isActive: poll.isActive
        }
      });

      // Send confirmation to voter
      ws.send(JSON.stringify({
        type: 'vote_recorded',
        pollId: poll._id,
        votedOptions
      }));

    } catch (error) {
      console.error('Vote poll error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to record vote'
      }));
    }
  }

  private async handleEndPoll(ws: WebSocket, message: any) {
    try {
      const client = this.findClientByWs(ws);
      
      if (!client || !client.streamId || !client.isStreamer) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Only streamers can end polls'
        }));
        return;
      }

      const { pollId } = message;
      
      if (!pollId) {
        return;
      }

      const poll = await Poll.findByIdAndUpdate(
        pollId,
        { isActive: false },
        { new: true }
      );

      if (!poll || poll.streamId.toString() !== client.streamId) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Poll not found'
        }));
        return;
      }

      this.broadcastToStream(client.streamId, {
        type: 'poll_ended',
        poll: {
          id: poll._id,
          question: poll.question,
          options: poll.options,
          allowMultipleVotes: poll.allowMultipleVotes,
          showResults: true,
          totalVotes: poll.totalVotes,
          isActive: false
        }
      });

    } catch (error) {
      console.error('End poll error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to end poll'
      }));
    }
  }

  private async handleSendGift(ws: WebSocket, message: any) {
    try {
      const client = this.findClientByWs(ws);
      
      if (!client || !client.streamId) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Not in a stream'
        }));
        return;
      }

      if (client.isGuest) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Please sign in to send gifts'
        }));
        return;
      }

      const { giftId, amount = 1, recipientId, giftMessage, isAnonymous = false } = message;
      
      if (!giftId || !recipientId || amount < 1 || amount > 100) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid gift data'
        }));
        return;
      }

      // Find gift type
      const giftType = GIFT_TYPES.find(g => g.id === giftId);
      if (!giftType) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid gift type'
        }));
        return;
      }

      // Find recipient
      const recipient = Array.from(this.clients.values()).find(c => c.userId === recipientId);
      if (!recipient) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Recipient not found'
        }));
        return;
      }

      // Calculate total value
      const totalValue = giftType.price * amount;

      // Here you would integrate with payment processing
      // For demo purposes, we'll skip payment validation

      // Create gift record
      const gift = new Gift({
        streamId: client.streamId,
        senderId: client.userId,
        senderUsername: client.username,
        recipientId: recipient.userId,
        recipientUsername: recipient.username,
        giftType,
        amount,
        totalValue,
        message: giftMessage?.trim() || '',
        isAnonymous
      });

      await gift.save();

      // Track analytics
      this.analytics.giftSent(client.streamId, totalValue);

      // Broadcast gift to all viewers in the stream
      this.broadcastToStream(client.streamId, {
        type: 'gift_sent',
        gift: {
          id: gift._id,
          giftType,
          amount,
          totalValue,
          senderUsername: isAnonymous ? 'Anonymous' : client.username,
          recipientUsername: recipient.username,
          message: gift.message,
          isAnonymous,
          timestamp: gift.timestamp
        }
      });

      // Send confirmation to sender
      ws.send(JSON.stringify({
        type: 'gift_sent_confirmation',
        giftId: gift._id,
        totalValue
      }));

    } catch (error) {
      console.error('Send gift error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to send gift'
      }));
    }
  }

  private async handleGetGiftTypes(ws: WebSocket, message: any) {
    try {
      ws.send(JSON.stringify({
        type: 'gift_types',
        giftTypes: GIFT_TYPES
      }));
    } catch (error) {
      console.error('Get gift types error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to get gift types'
      }));
    }
  }

  private async handleGetAnalytics(ws: WebSocket, message: any) {
    try {
      const client = this.findClientByWs(ws);
      
      if (!client || !client.streamId || !client.isStreamer) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Only streamers can access analytics'
        }));
        return;
      }

      const analytics = await this.analytics.getLiveAnalytics(client.streamId);
      
      ws.send(JSON.stringify({
        type: 'analytics_data',
        analytics
      }));
    } catch (error) {
      console.error('Get analytics error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to get analytics'
      }));
    }
  }

  private async handleWebRTCSignaling(ws: WebSocket, message: any) {
    const client = this.findClientByWs(ws);
    
    if (!client || !client.streamId) {
      return;
    }

    this.broadcastToStream(client.streamId, {
      ...message,
      fromUserId: client.userId,
      fromUsername: client.username
    }, client.userId);
  }

  private findClientByWs(ws: WebSocket): ConnectedClient | undefined {
    for (const client of this.clients.values()) {
      if (client.ws === ws) {
        return client;
      }
    }
    return undefined;
  }

  private handleDisconnection(ws: WebSocket) {
    const client = this.findClientByWs(ws);
    
    if (client) {
      if (client.streamId) {
        this.handleLeaveStream(ws, { streamId: client.streamId });
      }
      
      for (const [clientId, c] of this.clients.entries()) {
        if (c.ws === ws) {
          this.clients.delete(clientId);
          break;
        }
      }
    }
    
    console.log('WebSocket connection closed');
  }

  private broadcastToStream(streamId: string, message: any, excludeUserId?: string) {
    for (const client of this.clients.values()) {
      if (client.streamId === streamId && client.userId !== excludeUserId) {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify(message));
        }
      }
    }
  }

  public getViewerCount(streamId: string): number {
    return this.streamViewers.get(streamId)?.size || 0;
  }
}