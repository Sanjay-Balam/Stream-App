'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { Stream } from '../../../types';
import { useWebRTC } from '../../../hooks/useWebRTC';
import { useAuthStore } from '../../../stores/auth';
import Navbar from '../../../components/Navbar';
import VideoPlayer from '../../../components/VideoPlayer';
import Chat from '../../../components/Chat';
import { Eye, Heart, Share, Users, Settings } from 'lucide-react';

export default function StreamPage() {
  const params = useParams();
  const streamId = params.id as string;
  const [stream, setStream] = useState<Stream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const { user, isAuthenticated } = useAuthStore();

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4001';
  const isStreamer = stream?.streamerId._id === user?.id;

  const {
    localStream,
    isStreaming,
    viewers,
    localVideoRef,
    toggleVideo,
    toggleAudio,
    switchCamera,
  } = useWebRTC({
    streamId,
    isStreamer,
    wsUrl,
    onStreamReceived: (stream) => {
      setRemoteStream(stream);
    },
    onError: (error) => {
      setError(error);
    },
  });

  useEffect(() => {
    const fetchStream = async () => {
      try {
        const response = await api.get(`/streams/${streamId}`);
        if (response.data.success) {
          setStream(response.data.data.stream);
        } else {
          setError('Stream not found');
        }
      } catch (error) {
        setError('Failed to load stream');
      } finally {
        setLoading(false);
      }
    };

    if (streamId) {
      fetchStream();
    }
  }, [streamId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">
              {error || 'Stream not found'}
            </h1>
            <a href="/" className="btn-primary">
              Go Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  const displayStream = isStreamer ? localStream : remoteStream;

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative">
              {displayStream ? (
                <VideoPlayer 
                  stream={displayStream} 
                  isLocal={isStreamer}
                  muted={isStreamer}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    {stream.isLive ? (
                      <div>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                        <p className="text-white">Connecting to stream...</p>
                      </div>
                    ) : (
                      <div>
                        <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <Eye className="w-8 h-8 text-gray-500" />
                        </div>
                        <p className="text-white mb-2">Stream is offline</p>
                        <p className="text-gray-400 text-sm">
                          {stream.streamerId.displayName} will be back soon
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {stream.isLive && (
                <div className="absolute top-4 left-4">
                  <span className="live-badge">LIVE</span>
                </div>
              )}
              
              <div className="absolute top-4 right-4 flex items-center space-x-2">
                <span className="bg-black bg-opacity-75 text-white text-sm px-3 py-1 rounded-full flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  {viewers}
                </span>
              </div>
              
              {isStreamer && isStreaming && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center space-x-2 bg-black bg-opacity-75 rounded-lg p-2">
                    <button
                      onClick={toggleVideo}
                      className="btn-secondary p-2"
                    >
                      📹
                    </button>
                    <button
                      onClick={toggleAudio}
                      className="btn-secondary p-2"
                    >
                      🎤
                    </button>
                    <button
                      onClick={switchCamera}
                      className="btn-secondary p-2"
                    >
                      🔄
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-white mb-2">
                    {stream.title}
                  </h1>
                  
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-300" />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {stream.streamerId.displayName}
                        </p>
                        <p className="text-sm text-gray-400">
                          @{stream.streamerId.username}
                        </p>
                      </div>
                    </div>
                    
                    <span className="text-xs text-gray-400 bg-gray-700 px-3 py-1 rounded-full">
                      {stream.category}
                    </span>
                  </div>
                  
                  {stream.description && (
                    <p className="text-gray-300 mb-4">
                      {stream.description}
                    </p>
                  )}
                  
                  {stream.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {stream.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs bg-primary-500 bg-opacity-20 text-primary-400 px-2 py-1 rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-3 ml-6">
                  {isAuthenticated && !isStreamer && (
                    <button className="btn-primary flex items-center space-x-2">
                      <Heart className="w-4 h-4" />
                      <span>Follow</span>
                    </button>
                  )}
                  
                  <button className="btn-secondary p-2">
                    <Share className="w-4 h-4" />
                  </button>
                  
                  {isStreamer && (
                    <button className="btn-secondary p-2">
                      <Settings className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="h-96 lg:h-[600px]">
              <Chat streamId={streamId} wsUrl={wsUrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}