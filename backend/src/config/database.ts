import mongoose from 'mongoose';

export const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/streaming-platform';
  
  try {
    // Try Atlas connection first
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
      maxPoolSize: 10,
      bufferCommands: false,
    });
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error);
    
    if (mongoUri.includes('mongodb+srv')) {
      console.log('🔄 Atlas connection failed, falling back to local MongoDB...');
      try {
        await mongoose.connect('mongodb://localhost:27017/streaming-platform', {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
        console.log('✅ Connected to local MongoDB');
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