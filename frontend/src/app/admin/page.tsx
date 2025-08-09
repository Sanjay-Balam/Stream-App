'use client';

import { useState } from 'react';
import Navbar from '../../components/Navbar';
import DynamicDataExplorer from '../../components/DynamicDataExplorer';
import { useAuthStore } from '../../stores/auth';
import { Database, Users, MessageSquare, BarChart3, Gift, TrendingUp } from 'lucide-react';

export default function AdminPage() {
  const [showDataExplorer, setShowDataExplorer] = useState(false);
  const [selectedDatabase] = useState(process.env.NEXT_PUBLIC_MONGODB_DATABASE || 'streaming-platform');
  const [selectedTable, setSelectedTable] = useState('Users');
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-gray-400 mb-4">Please log in to access the admin panel</p>
            <a href="/login" className="btn-primary">Log In</a>
          </div>
        </div>
      </div>
    );
  }

  const collections = [
    { name: 'Users', icon: Users, description: 'Manage users and streamers' },
    { name: 'Streams', icon: TrendingUp, description: 'View and manage streams' },
    { name: 'ChatMessages', icon: MessageSquare, description: 'Monitor chat messages' },
    { name: 'Polls', icon: BarChart3, description: 'View poll data and results' },
    { name: 'Gifts', icon: Gift, description: 'Monitor gift transactions' },
    { name: 'StreamAnalytics', icon: Database, description: 'Analytics and metrics data' }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">
            Manage your streaming platform data and resources
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Database</p>
                <p className="text-white text-2xl font-bold">{selectedDatabase}</p>
              </div>
              <Database className="w-8 h-8 text-primary-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Collections</p>
                <p className="text-white text-2xl font-bold">{collections.length}</p>
              </div>
              <Database className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Status</p>
                <p className="text-green-400 text-lg font-medium">Connected</p>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Collections Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((collection) => {
              const IconComponent = collection.icon;
              return (
                <div
                  key={collection.name}
                  className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors cursor-pointer border border-gray-700 hover:border-primary-500"
                  onClick={() => {
                    setSelectedTable(collection.name);
                    setShowDataExplorer(true);
                  }}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <IconComponent className="w-6 h-6 text-primary-400" />
                    <h3 className="text-white font-medium">{collection.name}</h3>
                  </div>
                  <p className="text-gray-400 text-sm">{collection.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setShowDataExplorer(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Database className="w-4 h-4" />
              <span>Open Data Explorer</span>
            </button>
            
            <button
              onClick={() => {
                setSelectedTable('Users');
                setShowDataExplorer(true);
              }}
              className="btn-secondary flex items-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>Manage Users</span>
            </button>
            
            <button
              onClick={() => {
                setSelectedTable('Streams');
                setShowDataExplorer(true);
              }}
              className="btn-secondary flex items-center space-x-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>View Streams</span>
            </button>
          </div>
        </div>
      </div>

      {/* Data Explorer Modal */}
      <DynamicDataExplorer
        isOpen={showDataExplorer}
        onClose={() => setShowDataExplorer(false)}
        database={selectedDatabase}
        initialTable={selectedTable}
      />
    </div>
  );
}