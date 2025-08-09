'use client';

import { useState, useEffect } from 'react';
import { 
  useSearchResources, 
  useGetResource, 
  useCreateResource, 
  useUpdateResource, 
  useDeleteResource,
  useCollections 
} from '../hooks/useDynamicApi';
import { 
  Database, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  X,
  Check,
  RefreshCw
} from 'lucide-react';
import { getDatabaseName } from '../lib/config';

interface DynamicDataExplorerProps {
  isOpen: boolean;
  onClose: () => void;
  database?: string;
  initialTable?: string;
}

export default function DynamicDataExplorer({
  isOpen,
  onClose,
  database = getDatabaseName(),
  initialTable = 'Users'
}: DynamicDataExplorerProps) {
  const [selectedTable, setSelectedTable] = useState(initialTable);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Hooks
  const { collections } = useCollections(database);
  const { 
    data, 
    pagination, 
    loading: searchLoading, 
    error: searchError, 
    searchResources,
    refresh 
  } = useSearchResources(database, selectedTable, {
    filter: searchFilter ? { 
      $or: [
        { _id: { $regex: searchFilter, $options: 'i' } },
        { name: { $regex: searchFilter, $options: 'i' } },
        { title: { $regex: searchFilter, $options: 'i' } },
        { username: { $regex: searchFilter, $options: 'i' } },
        { email: { $regex: searchFilter, $options: 'i' } }
      ]
    } : {},
    page: currentPage,
    pageSize: 10
  });

  const { createResource, loading: createLoading } = useCreateResource(database, selectedTable);
  const { updateResource, loading: updateLoading } = useUpdateResource(database, selectedTable);
  const { deleteResource, loading: deleteLoading } = useDeleteResource(database, selectedTable);

  // Reset page when table changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedItem(null);
    setIsCreating(false);
    setIsEditing(false);
  }, [selectedTable]);

  // Search when filter changes
  useEffect(() => {
    setCurrentPage(1);
    searchResources({
      filter: searchFilter ? { 
        $or: [
          { _id: { $regex: searchFilter, $options: 'i' } },
          { name: { $regex: searchFilter, $options: 'i' } },
          { title: { $regex: searchFilter, $options: 'i' } },
          { username: { $regex: searchFilter, $options: 'i' } },
          { email: { $regex: searchFilter, $options: 'i' } }
        ]
      } : {},
      page: 1,
      pageSize: 10
    });
  }, [searchFilter, searchResources]);

  // Page change
  useEffect(() => {
    searchResources({
      filter: searchFilter ? { 
        $or: [
          { _id: { $regex: searchFilter, $options: 'i' } },
          { name: { $regex: searchFilter, $options: 'i' } },
          { title: { $regex: searchFilter, $options: 'i' } },
          { username: { $regex: searchFilter, $options: 'i' } },
          { email: { $regex: searchFilter, $options: 'i' } }
        ]
      } : {},
      page: currentPage,
      pageSize: 10
    });
  }, [currentPage, searchResources]);

  const handleCreate = async (formData: any) => {
    try {
      const result = await createResource(formData);
      if (result) {
        setIsCreating(false);
        refresh();
      }
    } catch (error) {
      console.error('Create error:', error);
    }
  };

  const handleUpdate = async (formData: any) => {
    if (!selectedItem?._id) return;
    
    try {
      const result = await updateResource(selectedItem._id, formData);
      if (result) {
        setIsEditing(false);
        setSelectedItem(null);
        refresh();
      }
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const success = await deleteResource(item._id);
      if (success) {
        refresh();
        if (selectedItem?._id === item._id) {
          setSelectedItem(null);
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex z-50">
      <div className="bg-gray-800 w-full max-w-7xl mx-auto my-4 rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Database className="w-6 h-6 text-primary-400" />
            <h2 className="text-xl font-bold text-white">Data Explorer</h2>
            <span className="text-gray-400">({database})</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Collections */}
          <div className="w-64 bg-gray-750 border-r border-gray-700 p-4">
            <h3 className="text-white font-medium mb-4">Collections</h3>
            <div className="space-y-1">
              {collections.map((collection) => (
                <button
                  key={collection.name}
                  onClick={() => setSelectedTable(collection.name)}
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${
                    selectedTable === collection.name
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {collection.name}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                  />
                </div>
                <button
                  onClick={refresh}
                  className="btn-secondary p-2"
                  disabled={searchLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${searchLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              <button
                onClick={() => setIsCreating(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create New</span>
              </button>
            </div>

            {/* Data Table */}
            <div className="flex-1 overflow-auto">
              {searchLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
              ) : searchError ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-red-400">Error: {searchError}</div>
                </div>
              ) : (
                <div className="p-4">
                  {data.length === 0 ? (
                    <div className="text-center text-gray-400 py-12">
                      No data found
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.map((item, index) => (
                        <div
                          key={item._id || index}
                          className="bg-gray-700 rounded-lg p-4 flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <div className="text-white font-medium">
                              {item.title || item.name || item.username || item.email || item._id}
                            </div>
                            <div className="text-gray-400 text-sm">
                              ID: {item._id}
                            </div>
                            {item.createdAt && (
                              <div className="text-gray-500 text-xs">
                                Created: {new Date(item.createdAt).toLocaleString()}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setSelectedItem(item)}
                              className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setIsEditing(true);
                              }}
                              className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-2 text-red-400 hover:text-red-300 transition-colors"
                              title="Delete"
                              disabled={deleteLoading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-gray-400 text-sm">
                        Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} results
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage <= 1}
                          className="btn-secondary p-2 disabled:opacity-50"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <span className="text-white px-3 py-1">
                          {pagination.page} / {pagination.totalPages}
                        </span>
                        
                        <button
                          onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                          disabled={currentPage >= pagination.totalPages}
                          className="btn-secondary p-2 disabled:opacity-50"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Detail Panel */}
          {(selectedItem || isCreating || isEditing) && (
            <div className="w-96 bg-gray-750 border-l border-gray-700 p-4 overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">
                  {isCreating ? 'Create New' : isEditing ? 'Edit Item' : 'Item Details'}
                </h3>
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    setIsCreating(false);
                    setIsEditing(false);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {(isCreating || isEditing) ? (
                <ItemForm
                  item={isEditing ? selectedItem : null}
                  onSubmit={isCreating ? handleCreate : handleUpdate}
                  onCancel={() => {
                    setIsCreating(false);
                    setIsEditing(false);
                  }}
                  loading={createLoading || updateLoading}
                />
              ) : (
                <ItemDetails item={selectedItem} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Item Form Component
function ItemForm({ 
  item, 
  onSubmit, 
  onCancel, 
  loading 
}: { 
  item: any; 
  onSubmit: (data: any) => void; 
  onCancel: () => void; 
  loading: boolean;
}) {
  const [formData, setFormData] = useState(item ? { ...item } : {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { _id, __v, createdAt, updatedAt, ...submitData } = formData;
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={JSON.stringify(formData, null, 2)}
        onChange={(e) => {
          try {
            const parsed = JSON.parse(e.target.value);
            setFormData(parsed);
          } catch {
            // Invalid JSON, don't update
          }
        }}
        className="w-full h-64 bg-gray-800 border border-gray-600 rounded-lg p-3 text-white font-mono text-sm"
        placeholder="Enter JSON data..."
      />
      
      <div className="flex space-x-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          <span>{loading ? 'Saving...' : 'Save'}</span>
        </button>
        
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// Item Details Component
function ItemDetails({ item }: { item: any }) {
  return (
    <div className="space-y-4">
      <pre className="bg-gray-800 border border-gray-600 rounded-lg p-3 text-white font-mono text-sm overflow-auto">
        {JSON.stringify(item, null, 2)}
      </pre>
    </div>
  );
}