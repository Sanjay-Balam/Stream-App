import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { authRoutes, streamRoutes, guestStreamRoutes, dynamicRoutes } from './routes';
import { WebSocketService } from './services/websocket';

const app = new Elysia()
  .use(cors({
    origin: [env.FRONTEND_URL, 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }))
  .use(swagger({
    documentation: {
      info: {
        title: 'Streaming Platform API',
        version: '1.0.0',
        description: 'API for live streaming platform with WebRTC and real-time chat'
      }
    }
  }))
  .get('/', () => ({
    message: 'Streaming Platform API',
    version: '1.0.0',
    status: 'running'
  }))
  .use(authRoutes)
  .use(streamRoutes)
  .use(guestStreamRoutes)
  .use(dynamicRoutes)
  .listen(env.PORT);

const startServer = async () => {
  try {
    const dbConnected = await connectDatabase();
    
    if (!dbConnected) {
      console.log('⚠️  Database not connected - some features will be limited');
    }
    
    try {
      const wsService = new WebSocketService(Number(env.PORT) + 1000);
      console.log(`🔌 WebSocket server running on port ${Number(env.PORT) + 1000}`);
    } catch (wsError) {
      console.log('⚠️  WebSocket server failed to start, continuing without it');
    }
    
    console.log(`🚀 HTTP Server running at http://localhost:${env.PORT}`);
    console.log(`📄 API Documentation available at http://localhost:${env.PORT}/swagger`);
    
    if (!dbConnected) {
      console.log('💡 To fully test the app, please connect to MongoDB');
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export type App = typeof app;