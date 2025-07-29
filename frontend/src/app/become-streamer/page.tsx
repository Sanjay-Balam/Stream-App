'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/auth';
import Navbar from '../../components/Navbar';
import { Video, Mic, Monitor, Users, DollarSign, BarChart3 } from 'lucide-react';

export default function BecomeStreamerPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  const handleGetStarted = () => {
    if (!isAuthenticated) {
      router.push('/register');
      return;
    }
    
    if (agreed) {
      router.push('/dashboard');
    }
  };

  const features = [
    {
      icon: Video,
      title: 'HD Live Streaming',
      description: 'Broadcast in high quality with our WebRTC technology'
    },
    {
      icon: Users,
      title: 'Interactive Chat',
      description: 'Engage with your audience through real-time chat'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Track your performance and grow your audience'
    },
    {
      icon: DollarSign,
      title: 'Monetization',
      description: 'Earn through donations and subscriptions'
    },
    {
      icon: Monitor,
      title: 'Multi-Platform',
      description: 'Stream from browser or external software'
    },
    {
      icon: Mic,
      title: 'Professional Tools',
      description: 'Advanced streaming controls and moderation'
    }
  ];

  const steps = [
    {
      step: 1,
      title: 'Create Account',
      description: 'Sign up for a free StreamHub account'
    },
    {
      step: 2,
      title: 'Set Up Profile',
      description: 'Customize your streamer profile and bio'
    },
    {
      step: 3,
      title: 'Generate Stream Key',
      description: 'Get your unique streaming key from the dashboard'
    },
    {
      step: 4,
      title: 'Start Streaming',
      description: 'Go live directly from your browser or use OBS'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Become a <span className="text-primary-500">Streamer</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Join thousands of creators sharing their passion with the world. 
            Start streaming today and build your community on StreamHub.
          </p>
          
          {!isAuthenticated ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/register')}
                className="btn-primary px-8 py-3 text-lg"
              >
                Sign Up Free
              </button>
              <button
                onClick={() => router.push('/login')}
                className="btn-secondary px-8 py-3 text-lg"
              >
                Sign In
              </button>
            </div>
          ) : (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-white mb-4">Ready to start streaming?</p>
              <label className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="rounded bg-gray-700 border-gray-600 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-300">
                  I agree to the streaming guidelines and community standards
                </span>
              </label>
              <button
                onClick={handleGetStarted}
                disabled={!agreed}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Access Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Everything You Need to Stream
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card p-6 text-center">
                <div className="w-12 h-12 bg-primary-500 bg-opacity-20 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full mx-auto mb-4 flex items-center justify-center font-bold text-lg">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gray-800 rounded-lg p-8 mb-16">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary-500 mb-2">1000+</div>
              <div className="text-gray-300">Active Streamers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-500 mb-2">50K+</div>
              <div className="text-gray-300">Monthly Viewers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-500 mb-2">24/7</div>
              <div className="text-gray-300">Support Available</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Streaming Journey?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join our community of creators and start building your audience today. 
            It's free to get started and takes less than 5 minutes to set up.
          </p>
          
          <button
            onClick={handleGetStarted}
            className="btn-primary px-8 py-3 text-lg"
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}
          </button>
        </div>
      </div>
    </div>
  );
}