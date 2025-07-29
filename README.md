# StreamHub - Live Streaming Platform

A comprehensive live streaming platform built with Next.js, Elysia.js, WebRTC, and MongoDB. Features real-time video streaming, chat, user authentication, and monetization capabilities.

## Features

### Core Features
- **Live Video Streaming** - WebRTC-based real-time streaming with multiple quality options
- **Real-Time Chat** - Live chat during streams with moderation tools
- **User Management** - Complete authentication system with JWT
- **Stream Discovery** - Browse and search streams by category
- **Responsive Design** - Mobile-friendly interface

### Advanced Features (In Development)
- Payment gateway integration for donations
- Subscription tiers and monetization
- Stream analytics and dashboard
- Content moderation tools
- Mobile app support

## Tech Stack

### Backend
- **Elysia.js** - Fast and modern TypeScript web framework
- **MongoDB** - Document database with Mongoose ODM
- **WebSocket** - Real-time communication for chat and signaling
- **JWT** - Authentication and authorization
- **Stripe** - Payment processing (planned)

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - State management
- **WebRTC** - Peer-to-peer video streaming

### Infrastructure
- **WebRTC** - Real-time communication
- **WebSocket** - Real-time messaging
- **Simple-peer** - WebRTC wrapper library

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- MongoDB database
- TURN/STUN servers (optional, for production)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd streaming-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - MongoDB connection string
   - JWT secrets
   - Stripe keys (for payments)
   - TURN/STUN server configuration

4. **Start the development servers**
   ```bash
   npm run dev
   # or
   bun dev
   ```

   This will start:
   - Backend API server at `http://localhost:3001`
   - Frontend at `http://localhost:3000`
   - WebSocket server at `ws://localhost:4001`

### Development Commands

```bash
# Start all services
npm run dev

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend

# Build for production
npm run build

# Start production servers
npm start
```

## Project Structure

```
streaming-app/
├── backend/                 # Elysia.js backend
│   ├── src/
│   │   ├── config/         # Database and environment config
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Authentication middleware
│   │   ├── services/       # WebSocket and business logic
│   │   └── types/          # TypeScript type definitions
│   └── package.json
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── stores/        # Zustand state stores
│   │   ├── lib/           # Utilities and API client
│   │   └── types/         # TypeScript types
│   └── package.json
└── package.json           # Root package.json for workspace
```

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user
- `POST /auth/stream-key` - Generate stream key

### Streams
- `GET /streams` - List streams (with filters)
- `GET /streams/:id` - Get specific stream
- `POST /streams` - Create new stream
- `PUT /streams/:id/live` - Update stream status

### WebSocket Events
- `authenticate` - Authenticate WebSocket connection
- `join_stream` - Join a stream room
- `leave_stream` - Leave a stream room
- `chat_message` - Send chat message
- `webrtc_*` - WebRTC signaling messages

## Usage

### For Viewers
1. **Browse Streams** - Visit `/browse` to discover live streams
2. **Watch Streams** - Click on any stream to start watching
3. **Chat** - Sign in to participate in stream chat
4. **Follow** - Follow your favorite streamers

### For Streamers
1. **Register** - Create an account and sign in
2. **Generate Stream Key** - Get your unique streaming key
3. **Start Streaming** - Use the built-in webcam streaming or external software
4. **Manage Stream** - Update title, category, and settings
5. **Interact** - Engage with viewers through chat

## WebRTC Implementation

The platform uses WebRTC for peer-to-peer video streaming:

- **Signaling** - WebSocket server handles offer/answer exchange
- **STUN/TURN** - Configurable servers for NAT traversal
- **Stream Management** - Automatic quality adjustment and reconnection
- **Multiple Viewers** - Efficient broadcasting to multiple peers

## Database Schema

### Users
- Authentication and profile information
- Stream keys and permissions
- Follower/following relationships

### Streams
- Stream metadata and settings
- Live status and viewer counts
- Categories and tags

### Chat Messages
- Real-time chat with moderation
- Message history and replay

## Development Roadmap

### Phase 1 ✅ (Completed)
- [x] Project setup and configuration
- [x] User authentication system
- [x] Basic streaming with WebRTC
- [x] Real-time chat system
- [x] Stream discovery interface

### Phase 2 🚧 (In Progress)
- [ ] Stream analytics dashboard
- [ ] Enhanced moderation tools
- [ ] Payment gateway integration
- [ ] Subscription system

### Phase 3 📋 (Planned)
- [ ] Mobile app development
- [ ] Advanced streaming features
- [ ] Content management system
- [ ] API for third-party integrations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Contact the development team

---

Built with ❤️ by the StreamHub team