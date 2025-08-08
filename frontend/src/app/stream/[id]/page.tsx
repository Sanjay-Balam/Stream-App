'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { Stream } from '../../../types';
import { useWebRTC } from '../../../hooks/useWebRTC';
import { useAuthStore } from '../../../stores/auth';
import Navbar from '../../../components/Navbar';
import VideoPlayer from '../../../components/VideoPlayer';
import Chat from '../../../components/Chat';
import ShareStreamModal from '../../../components/ShareStreamModal';
import { Eye, Heart, Share, Users, Settings } from 'lucide-react';

export default function StreamPage() {
  const params = useParams();
  const streamId = params.id as string;
  const [stream, setStream] = useState<Stream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [manualStream, setManualStream] = useState<MediaStream | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const manualVideoRef = useRef<HTMLVideoElement>(null);

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4001';
  
  // Check if user is the streamer - for authenticated users or guest streamers
  const isStreamer = useMemo(() => {
    if (!stream) return false;
    
    // For authenticated users
    if (user && stream.streamerId._id === user.id) {
      return true;
    }
    
    // For guest streamers - check if this browser created the guest stream
    if (stream.isGuestStream && typeof window !== 'undefined') {
      const guestId = localStorage.getItem('guestId');
      const guestStreamId = localStorage.getItem('guestStreamId');
      return guestId === stream.streamerId._id && guestStreamId === stream._id;
    }
    
    return false;
  }, [stream, user]);

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

  const displayStream = isStreamer ? (localStream || manualStream) : remoteStream;

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
                      isStreamer ? (
                        // If this is the streamer but no local stream, show camera setup
                        <div>
                          <div className="w-16 h-16 bg-primary-500 bg-opacity-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <Eye className="w-8 h-8 text-primary-500" />
                          </div>
                          <p className="text-white mb-4">
                            {stream.isGuestStream ? 'Guest Stream Active!' : 'Ready to start streaming'}
                          </p>
                          <p className="text-gray-400 text-sm mb-4">
                            {stream.isGuestStream 
                              ? 'Your guest stream is live! Use OBS or streaming software with your stream key to broadcast.'
                              : 'Click the button below to start your camera and begin streaming'
                            }
                          </p>
                          {stream.isGuestStream && (
                            <div className="bg-gray-700 rounded-lg p-4 mb-4 text-left">
                              <h4 className="text-white font-medium mb-2">RTMP Settings</h4>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="text-gray-400">Server URL:</span>
                                  <code className="ml-2 bg-gray-800 px-2 py-1 rounded text-primary-400">
                                    rtmp://localhost:1935/live
                                  </code>
                                </div>
                                <div>
                                  <span className="text-gray-400">Stream Key:</span>
                                  <code className="ml-2 bg-gray-800 px-2 py-1 rounded text-primary-400 break-all text-xs">
                                    Available in guest setup page
                                  </code>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="space-y-3">
                            <button 
                              onClick={() => {
                                // Try to start streaming manually if auto-start failed
                                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                                  navigator.mediaDevices.getUserMedia({
                                    video: true,
                                    audio: true
                                  }).then(stream => {
                                    setManualStream(stream);
                                    if (manualVideoRef.current) {
                                      manualVideoRef.current.srcObject = stream;
                                    }
                                  }).catch(err => {
                                    console.error('Camera access failed:', err);
                                    setError('Camera access denied. Please enable camera permissions and refresh.');
                                  });
                                }
                              }}
                              className="btn-primary"
                            >
                              {stream.isGuestStream ? 'Test Camera' : 'Start Camera'}
                            </button>
                            {stream.isGuestStream && (
                              <p className="text-xs text-yellow-400">
                                Note: For full streaming, use OBS or streaming software with the RTMP settings above
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        // Viewer trying to connect
                        <div>
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                          <p className="text-white mb-2">Connecting to stream...</p>
                          <p className="text-gray-400 text-sm">
                            If this takes too long, the streamer might not be broadcasting yet
                          </p>
                        </div>
                      )
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
                  
                  <button 
                    onClick={() => setShowShareModal(true)}
                    className="btn-secondary p-2 hover:bg-primary-600 transition-colors"
                    title="Share stream"
                  >
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
              <Chat 
                streamId={streamId} 
                wsUrl={wsUrl} 
                isStreamer={isStreamer}
                streamerId={stream?.streamerId._id}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden video element for manual streaming */}
      <video
        ref={manualVideoRef}
        autoPlay
        muted
        playsInline
        style={{ display: 'none' }}
      />

      {/* Share Modal */}
      <ShareStreamModal
        streamId={streamId}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
}