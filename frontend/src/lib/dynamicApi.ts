import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with default config
const dynamicApi = axios.create({
  baseURL: `${API_BASE_URL}/api/dynamic`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token if available
dynamicApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
dynamicApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface SearchOptions {
  page?: number;
  pageSize?: number;
}

export interface SearchQuery {
  filter?: any;
  sort?: any;
  project?: any;
  lookups?: any[];
  unwind?: string | string[];
  addFields?: any;
  customStages?: any[];
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

export const dynamicApiService = {
  // Create a new resource
  createResource: async <T = any>(
    database: string,
    tableName: string,
    data: any
  ): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await dynamicApi.post(
        `/mongodb/${database}/createResource/${tableName}`,
        data
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to create resource'
      };
    }
  },

  // Search resources with advanced filtering
  searchResources: async <T = any>(
    database: string,
    tableName: string,
    query: SearchQuery = {}
  ): Promise<PaginatedResponse<T>> => {
    try {
      const response: AxiosResponse<PaginatedResponse<T>> = await dynamicApi.post(
        `/mongodb/${database}/searchResources/${tableName}`,
        query
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || 'Failed to search resources'
      };
    }
  },

  // Get a single resource by ID
  getResource: async <T = any>(
    database: string,
    tableName: string,
    id: string
  ): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await dynamicApi.get(
        `/mongodb/${database}/getResource/${tableName}/${id}`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get resource'
      };
    }
  },

  // Update a resource
  updateResource: async <T = any>(
    database: string,
    tableName: string,
    id: string,
    data: any
  ): Promise<ApiResponse<T>> => {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await dynamicApi.patch(
        `/mongodb/${database}/updateResource/${tableName}/${id}`,
        data
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update resource'
      };
    }
  },

  // Delete a resource
  deleteResource: async (
    database: string,
    tableName: string,
    id: string
  ): Promise<ApiResponse> => {
    try {
      const response: AxiosResponse<ApiResponse> = await dynamicApi.delete(
        `/mongodb/${database}/deleteResource/${tableName}/${id}`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to delete resource'
      };
    }
  },

  // Remove specific keys from a resource
  removeKeysFromResource: async (
    database: string,
    tableName: string,
    id: string,
    removeKeys: string[]
  ): Promise<ApiResponse> => {
    try {
      const response: AxiosResponse<ApiResponse> = await dynamicApi.put(
        `/mongodb/${database}/removeKeysFromBody/${tableName}/${id}`,
        { removeKeys }
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to remove keys'
      };
    }
  },

  // Execute direct MongoDB aggregation pipeline
  directAggregation: async <T = any>(
    database: string,
    tableName: string,
    pipeline: any[]
  ): Promise<ApiResponse<T[]>> => {
    try {
      const response: AxiosResponse<ApiResponse<T[]>> = await dynamicApi.post(
        `/mongodb/${database}/directAggregation/${tableName}`,
        pipeline
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to execute aggregation'
      };
    }
  },

  // Get available collections for a database
  getCollections: async (database: string): Promise<ApiResponse<{ name: string; collection: string }[]>> => {
    try {
      const response: AxiosResponse<ApiResponse<{ name: string; collection: string }[]>> = 
        await dynamicApi.get(`/mongodb/${database}/collections`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get collections'
      };
    }
  }
};

// Helper functions for common streaming app queries

export const streamingQueries = {
  // Get user's streams
  getUserStreams: (userId: string, isLive?: boolean) => ({
    filter: {
      'streamerId._id': userId,
      ...(isLive !== undefined ? { isLive } : {})
    },
    sort: { createdAt: -1 },
    lookups: [{
      from: 'users',
      localField: 'streamerId',
      foreignField: '_id',
      as: 'streamerId'
    }]
  }),

  // Get popular streams
  getPopularStreams: (category?: string) => ({
    filter: {
      isLive: true,
      ...(category ? { category } : {})
    },
    sort: { viewerCount: -1 },
    lookups: [{
      from: 'users',
      localField: 'streamerId',
      foreignField: '_id',
      as: 'streamerId'
    }]
  }),

  // Get chat messages for a stream
  getStreamChat: (streamId: string, limit = 50) => ({
    filter: { streamId },
    sort: { timestamp: -1 },
    pageSize: limit
  }),

  // Get stream analytics
  getStreamAnalytics: (streamId: string, dateRange?: { start: Date; end: Date }) => ({
    filter: {
      streamId,
      ...(dateRange ? {
        createdAt: {
          $gte: dateRange.start.toISOString(),
          $lte: dateRange.end.toISOString()
        }
      } : {})
    },
    sort: { createdAt: -1 }
  }),

  // Get user's gifts sent
  getUserGifts: (userId: string) => ({
    filter: { senderId: userId },
    sort: { timestamp: -1 },
    lookups: [
      {
        from: 'streams',
        localField: 'streamId',
        foreignField: '_id',
        as: 'stream'
      },
      {
        from: 'users',
        localField: 'recipientId',
        foreignField: '_id',
        as: 'recipient'
      }
    ]
  })
};

export default dynamicApiService;