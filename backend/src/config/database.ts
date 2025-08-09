import mongoose from 'mongoose';
import { env } from './env';

export const connectDatabase = async () => {
  // Construct URI with dynamic database name
  let mongoUri = env.MONGODB_URI;
  
  // If using Atlas URI, replace the database name
  if (mongoUri.includes('mongodb+srv')) {
    // Extract base URI without database name
    const baseUri = mongoUri.split('?')[0]; // Remove query params
    const queryParams = mongoUri.includes('?') ? '?' + mongoUri.split('?')[1] : '';
    // Replace database name
    mongoUri = baseUri.replace(/\/[^/]*$/, `/${env.MONGODB_DATABASE}`) + queryParams;
  } else {
    // For local MongoDB, replace database name
    mongoUri = mongoUri.replace(/\/[^/]*$/, `/${env.MONGODB_DATABASE}`);
  }
  
  console.log(`🔗 Connecting to database: ${env.MONGODB_DATABASE}`);
  console.log(`📍 MongoDB URI: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`); // Hide credentials
  
  try {
    // Try Atlas connection first
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
      maxPoolSize: 10,
      bufferCommands: false,
    });
    console.log(`✅ Connected to MongoDB Atlas - Database: ${env.MONGODB_DATABASE}`);
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error);
    
    if (mongoUri.includes('mongodb+srv')) {
      console.log('🔄 Atlas connection failed, falling back to local MongoDB...');
      try {
        await mongoose.connect(`mongodb://localhost:27017/${env.MONGODB_DATABASE}`, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
        console.log(`✅ Connected to local MongoDB - Database: ${env.MONGODB_DATABASE}`);
      } catch (localError) {
        console.error('❌ Local MongoDB connection also failed:', localError);
        console.log('💡 Options:');
        console.log('   1. Install and start local MongoDB: https://docs.mongodb.com/manual/installation/');
        console.log('   2. Fix Atlas connection by:');
        console.log('      - Whitelisting your IP: https://cloud.mongodb.com/');
        console.log('      - Checking credentials in .env file');
        console.log('      - Ensuring cluster is active');
        console.log('🚀 Starting server without database (some features will be limited)...');
        // Clear any connection attempts
        mongoose.connection.removeAllListeners();
        return false;
      }
    } else {
      console.log('🚀 Starting server without database (some features will be limited)...');
      return false;
    }
  }
  return true;
};

mongoose.connection.on('disconnected', () => {
  console.log('📤 MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB error:', error);
});