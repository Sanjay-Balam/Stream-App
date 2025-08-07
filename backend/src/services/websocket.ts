import { WebSocketServer, WebSocket } from 'ws';
import { ChatMessage, Stream } from '../models';
import { GuestStream } from '../models/GuestStream';
import jwt from 'jsonwebtoken';
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

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
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