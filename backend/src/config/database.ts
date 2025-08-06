import mongoose from 'mongoose';

export const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/streaming-platform';
  
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    
    if (mongoUri.includes('mongodb+srv')) {
      console.log('🔄 Atlas connection failed, falling back to local MongoDB...');
      try {
        await mongoose.connect('mongodb://localhost:27017/streaming-platform');
        console.log('✅ Connected to local MongoDB');
      } catch (localError) {
        console.error('❌ Local MongoDB connection also failed:', localError);
        console.log('💡 Please ensure MongoDB is running locally or whitelist your IP in Atlas');
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('📤 MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB error:', error);
});