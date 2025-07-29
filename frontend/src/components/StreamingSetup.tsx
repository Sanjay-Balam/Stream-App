'use client';

import { useState } from 'react';
import { Monitor, Smartphone, Camera, Mic, Settings, ExternalLink } from 'lucide-react';

interface StreamingSetupProps {
  streamKey?: string;
}

export default function StreamingSetup({ streamKey }: StreamingSetupProps) {
  const [activeTab, setActiveTab] = useState<'browser' | 'software'>('browser');

  const browserSteps = [
    {
      icon: Camera,
      title: 'Camera Access',
      description: 'Allow camera and microphone access when prompted'
    },
    {
      icon: Settings,
      title: 'Stream Settings',
      description: 'Configure your stream title, category, and description'
    },
    {
      icon: Monitor,
      title: 'Go Live',
      description: 'Click "Go Live" to start broadcasting to your audience'
    }
  ];

  const softwareSteps = [
    {
      icon: ExternalLink,
      title: 'Download OBS',
      description: 'Download OBS Studio or your preferred streaming software',
      link: 'https://obsproject.com/'
    },
    {
      icon: Settings,
      title: 'Configure Stream',
      description: 'Add StreamHub as a custom RTMP service'
    },
    {
      icon: Monitor,
      title: 'Start Streaming',
      description: 'Use your stream key to start broadcasting'
    }
  ];

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-white mb-6">How to Start Streaming</h3>
      
      <div className="flex space-x-1 mb-6 bg-gray-700 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('browser')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'browser'
              ? 'bg-primary-600 text-white'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Browser Streaming
        </button>
        <button
          onClick={() => setActiveTab('software')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'software'
              ? 'bg-primary-600 text-white'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Streaming Software
        </button>
      </div>

      {activeTab === 'browser' ? (
        <div className="space-y-4">
          <div className="bg-primary-500 bg-opacity-10 border border-primary-500 rounded-lg p-4 mb-4">
            <h4 className="text-primary-400 font-medium mb-2">Quick Start</h4>
            <p className="text-sm text-gray-300">
              Stream directly from your browser! No additional software required.
            </p>
          </div>
          
          {browserSteps.map((step, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <step.icon className="w-4 h-4 text-primary-400" />
                  <h4 className="font-medium text-white">{step.title}</h4>
                </div>
                <p className="text-sm text-gray-400">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-700 rounded-lg p-4 mb-4">
            <h4 className="text-white font-medium mb-2">RTMP Settings</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">Server URL:</span>
                <code className="ml-2 bg-gray-800 px-2 py-1 rounded text-primary-400">
                  rtmp://localhost:1935/live
                </code>
              </div>
              {streamKey && (
                <div>
                  <span className="text-gray-400">Stream Key:</span>
                  <code className="ml-2 bg-gray-800 px-2 py-1 rounded text-primary-400 break-all">
                    {streamKey}
                  </code>
                </div>
              )}
            </div>
          </div>
          
          {softwareSteps.map((step, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <step.icon className="w-4 h-4 text-primary-400" />
                  <h4 className="font-medium text-white">{step.title}</h4>
                  {step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-400 hover:text-primary-300"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <p className="text-sm text-gray-400">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Camera className="w-4 h-4" />
          <span>Recommended: 1080p resolution, 30fps, good lighting</span>
        </div>
      </div>
    </div>
  );
}