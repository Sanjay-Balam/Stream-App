'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth';
import { Stream, STREAM_CATEGORIES } from '../../types';
import Navbar from '../../components/Navbar';
import StreamingSetup from '../../components/StreamingSetup';
import { Video, VideoOff, Mic, MicOff, Settings, Users, Eye, Play } from 'lucide-react';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [currentStream, setCurrentStream] = useState<Stream | null>(null);
  const [isCreatingStream, setIsCreatingStream] = useState(false);
  const [streamForm, setStreamForm] = useState({
    title: '',
    description: '',
    category: 'Gaming',
    tags: ''
  });
  const [hasStreamKey, setHasStreamKey] = useState(false);
  const [streamKey, setStreamKey] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'streamer' && user?.role !== 'admin') {
      // Auto-upgrade user to streamer role for demo purposes
      console.log('User needs streamer role');
    }

    checkCurrentStream();
    checkStreamKey();
  }, [isAuthenticated, user, router]);

  const checkCurrentStream = async () => {
    try {
      const response = await api.get('/streams?live_only=true&limit=1');
      if (response.data.success && response.data.data.streams.length > 0) {
        const userStream = response.data.data.streams.find(
          (stream: Stream) => stream.streamerId._id === user?.id
        );
        if (userStream) {
          setCurrentStream(userStream);
        }
      }
    } catch (error) {
      console.error('Error checking current stream:', error);
    }
  };

  const checkStreamKey = async () => {
    try {
      // Check if user already has a stream key by trying to create a stream
      setHasStreamKey(true); // For now, assume they can generate one
    } catch (error) {
      console.error('Error checking stream key:', error);
    }
  };

  const generateStreamKey = async () => {
    try {
      const response = await api.post('/auth/stream-key');
      if (response.data.success) {
        setStreamKey(response.data.data.streamKey);
        setHasStreamKey(true);
      }
    } catch (error) {
      console.error('Error generating stream key:', error);
    }
  };

  const createStream = async () => {
    if (!streamForm.title.trim()) {
      alert('Please enter a stream title');
      return;
    }

    try {
      setIsCreatingStream(true);
      const tags = streamForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const response = await api.post('/streams', {
        title: streamForm.title,
        description: streamForm.description,
        category: streamForm.category,
        tags
      });

      if (response.data.success) {
        const newStream = response.data.data.stream;
        setCurrentStream(newStream);
        router.push(`/stream/${newStream._id}`);
      }
    } catch (error) {
      console.error('Error creating stream:', error);
      alert('Failed to create stream. Make sure you have a stream key.');
    } finally {
      setIsCreatingStream(false);
    }
  };

  const goLive = async () => {
    if (!currentStream) return;

    try {
      const response = await api.put(`/streams/${currentStream._id}/live`, {
        isLive: true
      });

      if (response.data.success) {
        setCurrentStream(prev => prev ? { ...prev, isLive: true } : null);
        router.push(`/stream/${currentStream._id}`);
      }
    } catch (error) {
      console.error('Error going live:', error);
    }
  };

  const endStream = async () => {
    if (!currentStream) return;

    try {
      const response = await api.put(`/streams/${currentStream._id}/live`, {
        isLive: false
      });

      if (response.data.success) {
        setCurrentStream(null);
      }
    } catch (error) {
      console.error('Error ending stream:', error);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Streamer Dashboard</h1>
          <p className="text-gray-400">Manage your live streams and connect with your audience</p>
        </div>

        {!hasStreamKey ? (
          <div className="card p-6 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500 bg-opacity-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Video className="w-8 h-8 text-primary-500" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Get Started with Streaming</h2>
              <p className="text-gray-400 mb-6">
                Generate your unique stream key to start broadcasting
              </p>
              <button
                onClick={generateStreamKey}
                className="btn-primary px-6 py-3"
              >
                Generate Stream Key
              </button>
            </div>
          </div>
        ) : currentStream ? (
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Current Stream</h2>
                <div className="flex items-center space-x-2">
                  {currentStream.isLive ? (
                    <span className="live-badge">LIVE</span>
                  ) : (
                    <span className="bg-gray-600 text-white text-xs font-bold px-2 py-1 rounded">
                      OFFLINE
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-white mb-2">{currentStream.title}</h3>
                  <p className="text-gray-400 mb-4">{currentStream.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{currentStream.viewerCount} viewers</span>
                    </div>
                    <span className="bg-gray-700 px-2 py-1 rounded">{currentStream.category}</span>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-3">
                  {!currentStream.isLive ? (
                    <button
                      onClick={goLive}
                      className="btn-primary flex items-center justify-center space-x-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>Go Live</span>
                    </button>
                  ) : (
                    <button
                      onClick={endStream}
                      className="btn-danger flex items-center justify-center space-x-2"
                    >
                      <VideoOff className="w-4 h-4" />
                      <span>End Stream</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => router.push(`/stream/${currentStream._id}`)}
                    className="btn-secondary flex items-center justify-center space-x-2"
                  >
                    <Video className="w-4 h-4" />
                    <span>View Stream</span>
                  </button>
                </div>
              </div>
            </div>

            {streamKey && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Stream Key</h3>
                <div className="bg-gray-700 p-3 rounded-lg">
                  <code className="text-sm text-gray-300 break-all">{streamKey}</code>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Keep this key private. Use it in your streaming software to broadcast.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Create New Stream</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stream Title *
                </label>
                <input
                  type="text"
                  value={streamForm.title}
                  onChange={(e) => setStreamForm(prev => ({ ...prev, title: e.target.value }))}
                  className="input"
                  placeholder="Enter your stream title"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={streamForm.description}
                  onChange={(e) => setStreamForm(prev => ({ ...prev, description: e.target.value }))}
                  className="input h-24 resize-none"
                  placeholder="Describe what you'll be streaming..."
                  maxLength={500}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={streamForm.category}
                    onChange={(e) => setStreamForm(prev => ({ ...prev, category: e.target.value }))}
                    className="input"
                  >
                    {STREAM_CATEGORIES.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={streamForm.tags}
                    onChange={(e) => setStreamForm(prev => ({ ...prev, tags: e.target.value }))}
                    className="input"
                    placeholder="gaming, tutorial, beginner"
                  />
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  onClick={createStream}
                  disabled={isCreatingStream || !streamForm.title.trim()}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingStream ? 'Creating...' : 'Create Stream'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <StreamingSetup streamKey={streamKey} />
          
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="btn-secondary w-full flex items-center justify-center space-x-2 p-4">
                <Settings className="w-5 h-5" />
                <span>Stream Settings</span>
              </button>
              <button className="btn-secondary w-full flex items-center justify-center space-x-2 p-4">
                <Users className="w-5 h-5" />
                <span>Manage Followers</span>
              </button>
              <button className="btn-secondary w-full flex items-center justify-center space-x-2 p-4">
                <Eye className="w-5 h-5" />
                <span>Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}