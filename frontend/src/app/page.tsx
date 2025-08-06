'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Stream } from '../types';
import Navbar from '../components/Navbar';
import Link from 'next/link';
import { Play, Users, Eye } from 'lucide-react';

export default function HomePage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const response = await api.get('/streams?live_only=true&limit=12');
        if (response.data.success) {
          setStreams(response.data.data.streams);
        }
      } catch (error) {
        console.error('Failed to fetch streams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStreams();
    const interval = setInterval(fetchStreams, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Welcome to <span className="text-primary-500">StreamHub</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Discover amazing live streams, connect with creators, and join a vibrant community of viewers and streamers.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <Link href="/browse" className="btn-primary px-8 py-3 text-lg">
              Browse Streams
            </Link>
            <Link href="/guest-stream" className="btn-secondary px-8 py-3 text-lg">
              Stream as Guest
            </Link>
            <Link href="/become-streamer" className="btn-outline px-8 py-3 text-lg">
              Create Account
            </Link>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>
              Live Now
            </h2>
            <Link href="/browse" className="text-primary-500 hover:text-primary-400">
              View All
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="aspect-video bg-gray-700 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : streams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {streams.map((stream) => (
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
                        
                        <div className="absolute top-2 left-2">
                          <span className="live-badge">
                            LIVE
                          </span>
                        </div>
                        
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
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                          {stream.category}
                        </span>
                        <span className="text-xs text-gray-400">
                          {stream.viewerCount} viewers
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Play className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Live Streams</h3>
              <p className="text-gray-400 mb-4">There are no live streams at the moment.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/guest-stream" className="btn-primary">
                  Stream as Guest
                </Link>
                <Link href="/register" className="btn-secondary">
                  Create Account
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}