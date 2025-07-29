'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Stream, STREAM_CATEGORIES } from '../../types';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { Play, Users, Eye, Filter, Search } from 'lucide-react';

export default function BrowsePage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [liveOnly, setLiveOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchStreams();
  }, [selectedCategory, liveOnly, currentPage]);

  const fetchStreams = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      if (liveOnly) {
        params.append('live_only', 'true');
      }

      const response = await api.get(`/streams?${params.toString()}`);
      
      if (response.data.success) {
        setStreams(response.data.data.streams);
        setTotalPages(response.data.data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to fetch streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStreams = streams.filter(stream => 
    searchQuery === '' || 
    stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stream.streamerId.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stream.streamerId.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-6">Browse Streams</h1>
          
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search streams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10 w-64"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="input w-40"
                >
                  <option value="all">All Categories</option>
                  {STREAM_CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              
              <label className="flex items-center space-x-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={liveOnly}
                  onChange={(e) => setLiveOnly(e.target.checked)}
                  className="rounded bg-gray-700 border-gray-600 text-primary-500 focus:ring-primary-500"
                />
                <span>Live only</span>
              </label>
            </div>
            
            <div className="text-sm text-gray-400">
              {filteredStreams.length} streams found
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="aspect-video bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredStreams.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredStreams.map((stream) => (
                <Link key={stream._id} href={`/stream/${stream._id}`}>
                  <div className="card hover:scale-105 transition-transform duration-200">
                    <div className="relative">
                      <div className="aspect-video bg-gray-700 rounded-t-lg relative overflow-hidden">
                        {stream.thumbnail ? (
                          <img 
                            src={stream.thumbnail} 
                            alt={stream.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-12 h-12 text-gray-500" />
                          </div>
                        )}
                        
                        {stream.isLive && (
                          <div className="absolute top-2 left-2">
                            <span className="live-badge">LIVE</span>
                          </div>
                        )}
                        
                        <div className="absolute bottom-2 right-2">
                          <span className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {stream.viewerCount}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-white mb-2 line-clamp-2">
                        {stream.title}
                      </h3>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                          <Users className="w-3 h-3 text-gray-300" />
                        </div>
                        <span className="text-sm text-gray-300">
                          {stream.streamerId.displayName}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                          {stream.category}
                        </span>
                        <span className="text-xs text-gray-400">
                          {stream.viewerCount} viewers
                        </span>
                      </div>
                      
                      {stream.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {stream.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="text-xs bg-primary-500 bg-opacity-20 text-primary-400 px-2 py-1 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                          {stream.tags.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{stream.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    const pageNumber = currentPage <= 3 
                      ? i + 1 
                      : currentPage + i - 2;
                    
                    if (pageNumber > totalPages) return null;
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`px-3 py-1 rounded ${
                          pageNumber === currentPage
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No streams found
            </h3>
            <p className="text-gray-400 mb-4">
              Try adjusting your filters or search terms
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setLiveOnly(false);
                setCurrentPage(1);
              }}
              className="btn-primary"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}