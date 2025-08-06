'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { STREAM_CATEGORIES } from '../../types';
import Navbar from '../../components/Navbar';
import GuestStreamingSetup from '../../components/GuestStreamingSetup';
import { Video, User, Clock, AlertCircle } from 'lucide-react';

export default function GuestStreamPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<'form' | 'setup' | 'streaming'>('form');
  const [isCreatingStream, setIsCreatingStream] = useState(false);
  const [streamData, setStreamData] = useState<any>(null);
  const [streamForm, setStreamForm] = useState({
    title: '',
    description: '',
    category: 'Gaming',
    tags: '',
    guestDisplayName: ''
  });

  const createGuestStream = async () => {
    if (!streamForm.title.trim() || !streamForm.guestDisplayName.trim()) {
      alert('Please fill in the required fields');
      return;
    }

    try {
      setIsCreatingStream(true);
      const tags = streamForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const response = await api.post('/guest-streams', {
        title: streamForm.title,
        description: streamForm.description,
        category: streamForm.category,
        tags,
        guestDisplayName: streamForm.guestDisplayName
      });

      console.log('Guest stream creation response:', response.data);

      if (response.data.success) {
        setStreamData(response.data.data);
        // Store guest ID in localStorage to identify this user as the guest streamer
        localStorage.setItem('guestStreamId', response.data.data.stream._id);
        localStorage.setItem('guestId', response.data.data.stream.guestId);
        setCurrentStep('setup');
      } else {
        console.error('Response indicates failure:', response.data);
        alert(response.data.error || 'Failed to create guest stream. Please try again.');
      }
    } catch (error: any) {
      console.error('Error creating guest stream:', error);
      
      if (error.response) {
        // Server responded with error status
        console.error('Server error response:', error.response.data);
        alert(`Server error: ${error.response.data.error || 'Unknown error'}`);
      } else if (error.request) {
        // Request made but no response received
        console.error('No response from server:', error.request);
        alert('Cannot connect to server. Please ensure the backend is running on http://localhost:3001');
      } else {
        // Something else happened
        console.error('Request setup error:', error.message);
        alert(`Request error: ${error.message}`);
      }
    } finally {
      setIsCreatingStream(false);
    }
  };

  const startStreaming = async () => {
    if (!streamData) return;

    try {
      const response = await api.put(`/guest-streams/${streamData.stream._id}/live`, {
        isLive: true
      });

      if (response.data.success) {
        setCurrentStep('streaming');
        router.push(`/stream/${streamData.stream._id}`);
      }
    } catch (error) {
      console.error('Error starting stream:', error);
      alert('Failed to start stream. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Stream as Guest</h1>
          <p className="text-gray-400">Start streaming instantly without creating an account</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${currentStep === 'form' ? 'text-primary-500' : currentStep === 'setup' || currentStep === 'streaming' ? 'text-green-500' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 'form' ? 'bg-primary-500 text-white' : currentStep === 'setup' || currentStep === 'streaming' ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'}`}>
                1
              </div>
              <span>Stream Details</span>
            </div>
            
            <div className="flex-1 h-px bg-gray-600"></div>
            
            <div className={`flex items-center space-x-2 ${currentStep === 'setup' ? 'text-primary-500' : currentStep === 'streaming' ? 'text-green-500' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 'setup' ? 'bg-primary-500 text-white' : currentStep === 'streaming' ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'}`}>
                2
              </div>
              <span>Setup</span>
            </div>
            
            <div className="flex-1 h-px bg-gray-600"></div>
            
            <div className={`flex items-center space-x-2 ${currentStep === 'streaming' ? 'text-green-500' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep === 'streaming' ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'}`}>
                3
              </div>
              <span>Go Live</span>
            </div>
          </div>
        </div>

        {currentStep === 'form' && (
          <div className="space-y-6">
            <div className="bg-yellow-500 bg-opacity-10 border border-yellow-500 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-yellow-500 font-medium mb-1">Guest Stream Limitations</h3>
                  <ul className="text-sm text-yellow-200 space-y-1">
                    <li>• Stream expires after 2 hours</li>
                    <li>• Limited to basic streaming features</li>
                    <li>• No stream history or analytics</li>
                    <li>• Create an account for unlimited streaming</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Stream Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Display Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={streamForm.guestDisplayName}
                      onChange={(e) => setStreamForm(prev => ({ ...prev, guestDisplayName: e.target.value }))}
                      className="input pl-10"
                      placeholder="Enter your name (visible to viewers)"
                      maxLength={30}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Stream Title *
                  </label>
                  <input
                    type="text"
                    value={streamForm.title}
                    onChange={(e) => setStreamForm(prev => ({ ...prev, title: e.target.value }))}
                    className="input"
                    placeholder="What are you streaming today?"
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
                    placeholder="Tell viewers what your stream is about..."
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
                    onClick={createGuestStream}
                    disabled={isCreatingStream || !streamForm.title.trim() || !streamForm.guestDisplayName.trim()}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingStream ? 'Setting up...' : 'Continue to Setup'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'setup' && streamData && (
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Stream Setup</h2>
                <div className="flex items-center space-x-2 text-sm text-yellow-400">
                  <Clock className="w-4 h-4" />
                  <span>Expires in 2 hours</span>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium text-white mb-2">{streamData.stream.title}</h3>
                <p className="text-gray-400 mb-4">{streamData.stream.description}</p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span className="bg-gray-700 px-2 py-1 rounded">{streamData.stream.category}</span>
                  <span>Streamer: {streamData.stream.guestDisplayName}</span>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-6">
                <button
                  onClick={startStreaming}
                  className="btn-primary flex items-center justify-center space-x-2 w-full"
                >
                  <Video className="w-4 h-4" />
                  <span>Go Live Now</span>
                </button>
              </div>
            </div>

            <GuestStreamingSetup streamKey={streamData.streamKey} />
          </div>
        )}
      </div>
    </div>
  );
}