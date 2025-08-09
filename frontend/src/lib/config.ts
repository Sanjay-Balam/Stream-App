// Frontend configuration utilities
export const config = {
  // API Configuration
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  
  // Database Configuration
  databaseName: process.env.NEXT_PUBLIC_MONGODB_DATABASE || 'streaming-platform',
  
  // Other configuration can be added here
} as const;

// Helper function to get database name
export const getDatabaseName = () => config.databaseName;

// Helper function to get API URL
export const getApiUrl = () => config.apiUrl;