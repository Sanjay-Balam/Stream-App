import { useState, useEffect, useCallback } from 'react';
import { dynamicApiService, SearchQuery, ApiResponse, PaginatedResponse } from '../lib/dynamicApi';

// Hook for creating resources
export const useCreateResource = (database: string, tableName: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createResource = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await dynamicApiService.createResource(database, tableName, data);
      
      if (!result.success) {
        setError(result.error || 'Failed to create resource');
        return null;
      }
      
      return result.data;
    } catch (err: any) {
      setError(err.message || 'Failed to create resource');
      return null;
    } finally {
      setLoading(false);
    }
  }, [database, tableName]);

  return { createResource, loading, error };
};

// Hook for searching resources with auto-refresh
export const useSearchResources = <T = any>(
  database: string,
  tableName: string,
  initialQuery: SearchQuery = {},
  autoRefresh = false,
  refreshInterval = 30000
) => {
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse['pagination']>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<SearchQuery>(initialQuery);

  const searchResources = useCallback(async (searchQuery?: SearchQuery) => {
    setLoading(true);
    setError(null);
    
    const currentQuery = searchQuery || query;
    
    try {
      const result = await dynamicApiService.searchResources<T>(database, tableName, currentQuery);
      
      if (!result.success) {
        setError(result.error || 'Failed to search resources');
        return;
      }
      
      setData(result.data);
      setPagination(result.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to search resources');
    } finally {
      setLoading(false);
    }
  }, [database, tableName, query]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        searchResources();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, searchResources]);

  // Initial fetch
  useEffect(() => {
    searchResources();
  }, [searchResources]);

  return {
    data,
    pagination,
    loading,
    error,
    searchResources,
    setQuery,
    refresh: () => searchResources()
  };
};

// Hook for getting a single resource
export const useGetResource = <T = any>(
  database: string,
  tableName: string,
  id: string | null
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getResource = useCallback(async (resourceId?: string) => {
    const currentId = resourceId || id;
    if (!currentId) return;

    setLoading(true);
    setError(null);
    
    try {
      const result = await dynamicApiService.getResource<T>(database, tableName, currentId);
      
      if (!result.success) {
        setError(result.error || 'Failed to get resource');
        return;
      }
      
      setData(result.data || null);
    } catch (err: any) {
      setError(err.message || 'Failed to get resource');
    } finally {
      setLoading(false);
    }
  }, [database, tableName, id]);

  useEffect(() => {
    if (id) {
      getResource();
    }
  }, [getResource, id]);

  return { data, loading, error, refresh: getResource };
};

// Hook for updating resources
export const useUpdateResource = (database: string, tableName: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateResource = useCallback(async (id: string, data: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await dynamicApiService.updateResource(database, tableName, id, data);
      
      if (!result.success) {
        setError(result.error || 'Failed to update resource');
        return null;
      }
      
      return result.data;
    } catch (err: any) {
      setError(err.message || 'Failed to update resource');
      return null;
    } finally {
      setLoading(false);
    }
  }, [database, tableName]);

  return { updateResource, loading, error };
};

// Hook for deleting resources
export const useDeleteResource = (database: string, tableName: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteResource = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await dynamicApiService.deleteResource(database, tableName, id);
      
      if (!result.success) {
        setError(result.error || 'Failed to delete resource');
        return false;
      }
      
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete resource');
      return false;
    } finally {
      setLoading(false);
    }
  }, [database, tableName]);

  return { deleteResource, loading, error };
};

// Hook for executing direct aggregation pipelines
export const useAggregation = <T = any>(
  database: string,
  tableName: string
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAggregation = useCallback(async (pipeline: any[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await dynamicApiService.directAggregation<T>(database, tableName, pipeline);
      
      if (!result.success) {
        setError(result.error || 'Failed to execute aggregation');
        return [];
      }
      
      const resultData = result.data || [];
      setData(resultData);
      return resultData;
    } catch (err: any) {
      setError(err.message || 'Failed to execute aggregation');
      return [];
    } finally {
      setLoading(false);
    }
  }, [database, tableName]);

  return { data, loading, error, executeAggregation };
};

// Hook for getting collections
export const useCollections = (database: string) => {
  const [collections, setCollections] = useState<{ name: string; collection: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCollections = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await dynamicApiService.getCollections(database);
      
      if (!result.success) {
        setError(result.error || 'Failed to get collections');
        return;
      }
      
      setCollections(result.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to get collections');
    } finally {
      setLoading(false);
    }
  }, [database]);

  useEffect(() => {
    getCollections();
  }, [getCollections]);

  return { collections, loading, error, refresh: getCollections };
};