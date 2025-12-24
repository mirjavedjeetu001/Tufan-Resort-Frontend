'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface ActivityLog {
  id: number;
  userName: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: number | null;
  description: string;
  changes: any;
  ipAddress: string;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (actionFilter !== 'all') params.action = actionFilter;
      if (entityTypeFilter !== 'all') params.entityType = entityTypeFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/activity-logs', { params });
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    fetchLogs();
  };

  const handleReset = () => {
    setActionFilter('all');
    setEntityTypeFilter('all');
    setStartDate('');
    setEndDate('');
    setTimeout(() => fetchLogs(), 100);
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'login':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return '➕';
      case 'update':
        return '✏️';
      case 'delete':
        return '🗑️';
      case 'login':
        return '🔐';
      default:
        return '📝';
    }
  };

  const getEntityTypeIcon = (entityType: string) => {
    switch (entityType) {
      case 'room':
        return '🏠';
      case 'booking':
        return '📅';
      case 'convention-hall':
        return '🏛️';
      case 'convention-booking':
        return '🎪';
      case 'hero-slide':
        return '🖼️';
      case 'resort-info':
        return '⚙️';
      case 'user':
        return '👤';
      case 'addon-service':
        return '🎁';
      default:
        return '📦';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📋 Activity Logs</h1>
        <p className="text-gray-600">Track all changes and activities in the system</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">🔍 Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Entity Type</label>
            <select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="room">Rooms</option>
              <option value="booking">Bookings</option>
              <option value="convention-hall">Convention Halls</option>
              <option value="convention-booking">Convention Bookings</option>
              <option value="hero-slide">Hero Slides</option>
              <option value="resort-info">Resort Info</option>
              <option value="user">Users</option>
              <option value="addon-service">Add-on Services</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleFilter}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Apply Filter
          </button>
          <button
            onClick={handleReset}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Activities</p>
              <p className="text-3xl font-bold">{logs.length}</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Creates</p>
              <p className="text-3xl font-bold">{logs.filter(l => l.action === 'create').length}</p>
            </div>
            <div className="text-4xl">➕</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Updates</p>
              <p className="text-3xl font-bold">{logs.filter(l => l.action === 'update').length}</p>
            </div>
            <div className="text-4xl">✏️</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Deletions</p>
              <p className="text-3xl font-bold">{logs.filter(l => l.action === 'delete').length}</p>
            </div>
            <div className="text-4xl">🗑️</div>
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-primary to-primary-dark text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Date & Time</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Action</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Entity Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Description</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">IP Address</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-6xl">📋</div>
                      <p className="text-lg font-semibold">No activity logs found</p>
                      <p className="text-sm">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                          {log.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{log.userName}</p>
                          <p className="text-xs text-gray-500">{log.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${getActionBadgeColor(log.action)}`}>
                        <span>{getActionIcon(log.action)}</span>
                        {log.action.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                        <span>{getEntityTypeIcon(log.entityType)}</span>
                        {log.entityType.replace('-', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                      {log.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.ipAddress || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedLog(log);
                          setShowDetailsModal(true);
                        }}
                        className="text-primary hover:text-primary-dark font-semibold text-sm transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-6 rounded-t-lg">
              <h3 className="text-2xl font-bold">Activity Details</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">User</label>
                  <p className="text-gray-900">{selectedLog.userName}</p>
                  <p className="text-sm text-gray-600">{selectedLog.userEmail}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Date & Time</label>
                  <p className="text-gray-900">{formatDate(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Action</label>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${getActionBadgeColor(selectedLog.action)}`}>
                    <span>{getActionIcon(selectedLog.action)}</span>
                    {selectedLog.action.toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Entity Type</label>
                  <p className="text-gray-900">
                    <span className="mr-2">{getEntityTypeIcon(selectedLog.entityType)}</span>
                    {selectedLog.entityType.replace('-', ' ').toUpperCase()}
                  </p>
                </div>
                {selectedLog.entityId && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Entity ID</label>
                    <p className="text-gray-900">#{selectedLog.entityId}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-semibold text-gray-700">IP Address</label>
                  <p className="text-gray-900">{selectedLog.ipAddress || 'N/A'}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Description</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedLog.description}</p>
              </div>

              {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Changes Made</label>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end rounded-b-lg">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedLog(null);
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
