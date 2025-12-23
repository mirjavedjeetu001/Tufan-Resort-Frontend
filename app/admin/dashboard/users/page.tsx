'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'owner' | 'staff';
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

const AVAILABLE_PERMISSIONS = [
  { 
    key: 'dashboard.view', 
    label: 'Dashboard View', 
    icon: '📊',
    description: 'View dashboard statistics and analytics',
    category: 'General'
  },
  { 
    key: 'rooms.manage', 
    label: 'Rooms Management', 
    icon: '🛏️',
    description: 'Create, edit, delete rooms and manage room inventory',
    category: 'Accommodations'
  },
  { 
    key: 'bookings.manage', 
    label: 'Room Bookings Management', 
    icon: '📅',
    description: 'Manage room bookings, check-ins, check-outs, and payments',
    category: 'Bookings'
  },
  { 
    key: 'convention.manage', 
    label: 'Convention Hall Management', 
    icon: '🏛️',
    description: 'Manage convention halls, pricing, and availability',
    category: 'Facilities'
  },
  { 
    key: 'convention-bookings.manage', 
    label: 'Convention Bookings Management', 
    icon: '🎫',
    description: 'Handle convention hall bookings and event scheduling',
    category: 'Bookings'
  },
  { 
    key: 'food-packages.manage', 
    label: 'Food Packages Management', 
    icon: '🍽️',
    description: 'Create and manage food packages and meal plans',
    category: 'Services'
  },
  { 
    key: 'addon-services.manage', 
    label: 'Add-on Services Management', 
    icon: '➕',
    description: 'Manage additional services and amenities',
    category: 'Services'
  },
  { 
    key: 'hero-slides.manage', 
    label: 'Hero Slides Management', 
    icon: '🎨',
    description: 'Update homepage hero carousel images and content',
    category: 'Content'
  },
  { 
    key: 'resort-settings.manage', 
    label: 'Resort Settings', 
    icon: '⚙️',
    description: 'Modify resort information, contact details, and general settings',
    category: 'Configuration'
  },
  { 
    key: 'users.manage', 
    label: 'User Management', 
    icon: '👥',
    description: 'Create, edit, delete users and manage access control',
    category: 'Administration'
  },
  { 
    key: 'menu.manage', 
    label: 'Menu Management', 
    icon: '📋',
    description: 'Update restaurant menus and food offerings',
    category: 'Content'
  },
  { 
    key: 'access-control.manage', 
    label: 'Access Control & Security', 
    icon: '🔐',
    description: 'Advanced permission management and security settings',
    category: 'Administration'
  },
];

export default function UserManagement() {
  const { modalState, showModal, closeModal: closeNotificationModal } = useModal();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' as 'owner' | 'staff',
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      showModal('Error fetching users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      showModal('Please fill all required fields', 'warning');
      return;
    }

    try {
      await api.post('/users', formData);
      fetchUsers();
      setShowFormModal(false);
      resetForm();
      showModal('User created successfully!', 'success');
    } catch (error: any) {
      console.error('Error creating user:', error);
      showModal(error.response?.data?.message || 'Error creating user', 'error');
    }
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };
      
      if (formData.password) {
        updateData.password = formData.password;
      }

      await api.put(`/users/${selectedUser.id}`, updateData);
      fetchUsers();
      setShowFormModal(false);
      resetForm();
      showModal('User updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating user:', error);
      showModal('Error updating user', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    showModal(
      'Are you sure you want to delete this user? This action cannot be undone.',
      'warning',
      {
        onConfirm: async () => {
          try {
            await api.delete(`/users/${id}`);
            fetchUsers();
            showModal('User deleted successfully!', 'success');
          } catch (error) {
            console.error('Error deleting user:', error);
            showModal('Error deleting user', 'error');
          }
        },
        confirmText: 'Delete User',
        cancelText: 'Cancel'
      }
    );
  };

  const handleToggleActive = async (id: number) => {
    try {
      await api.put(`/users/${id}/toggle-active`);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      showModal('Error updating user status', 'error');
    }
  };

  const openPermissionsModal = (user: User) => {
    setSelectedUser(user);
    setSelectedPermissions(user.permissions || []);
    setShowPermissionsModal(true);
  };

  const handleUpdatePermissions = async () => {
    if (!selectedUser) return;

    try {
      await api.put(`/users/${selectedUser.id}/permissions`, {
        permissions: selectedPermissions,
      });
      fetchUsers();
      setShowPermissionsModal(false);
      showModal('Permissions updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating permissions:', error);
      showModal('Error updating permissions', 'error');
    }
  };

  const togglePermission = (permission: string) => {
    if (selectedPermissions.includes(permission)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permission));
    } else {
      setSelectedPermissions([...selectedPermissions, permission]);
    }
  };

  const openCreateModal = () => {
    setSelectedUser(null);
    resetForm();
    setShowFormModal(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
    });
    setShowFormModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'staff' });
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-5 mb-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-700 to-accent bg-clip-text text-transparent">
                👥 User Management
              </h1>
              <p className="text-gray-600 mt-1">Manage admin users and their permissions</p>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg"
            >
              ➕ Create User
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-5 rounded-xl shadow-lg">
            <div className="text-2xl font-bold">{users.length}</div>
            <div className="text-sm opacity-90">Total Users</div>
          </div>
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white p-5 rounded-xl shadow-lg">
            <div className="text-2xl font-bold">{users.filter(u => u.isActive).length}</div>
            <div className="text-sm opacity-90">Active Users</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-5 rounded-xl shadow-lg">
            <div className="text-2xl font-bold">{users.filter(u => u.role === 'owner').length}</div>
            <div className="text-sm opacity-90">Owners</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-5 rounded-xl shadow-lg">
            <div className="text-2xl font-bold">{users.filter(u => u.role === 'staff').length}</div>
            <div className="text-sm opacity-90">Staff</div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              All Users
            </h2>
            <p className="text-sm text-gray-600 mt-1">{users.length} total users in the system</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-primary-700 to-accent text-gray-900">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Permissions</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gradient-to-r hover:from-green-50 hover:to-yellow-50 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">ID: #{user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-4 py-2 rounded-lg text-xs font-bold shadow-sm inline-flex items-center gap-1 ${
                        user.role === 'owner' 
                          ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300' 
                          : 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300'
                      }`}>
                        {user.role === 'owner' ? '👑 Owner' : '👤 Staff'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openPermissionsModal(user)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-cyan-100 hover:border-blue-300 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 shadow-sm"
                      >
                        🔐 {user.permissions?.length || 0} Permissions
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(user.id)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                          user.isActive
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 hover:from-green-200 hover:to-emerald-200 border-2 border-green-300'
                            : 'bg-gradient-to-r from-red-100 to-red-100 text-red-800 hover:from-red-200 hover:to-red-200 border-2 border-red-300'
                        }`}
                      >
                        {user.isActive ? '✅ Active' : '❌ Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-semibold text-sm transition-colors flex items-center gap-1"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-semibold text-sm transition-colors flex items-center gap-1"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-xl font-semibold text-gray-700">No Users Found</p>
              <p className="text-gray-500 mt-2">Create your first user to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit User Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent">
              {selectedUser ? '✏️ Edit User' : '➕ Create User'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {selectedUser && '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={selectedUser ? 'New password (optional)' : 'Password *'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'owner' | 'staff' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="staff">Staff</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={selectedUser ? handleUpdate : handleCreate}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all"
                >
                  {selectedUser ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white px-8 py-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-black opacity-10"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  🔐 Manage Permissions
                </h2>
                <div className="flex items-center gap-3 text-green-50">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl backdrop-blur">
                      {selectedUser.role === 'owner' ? '👑' : '👤'}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{selectedUser.name}</p>
                      <p className="text-sm text-green-100">{selectedUser.email}</p>
                    </div>
                  </div>
                  <span className="ml-auto px-4 py-1 rounded-full bg-white/20 text-sm font-semibold backdrop-blur">
                    {selectedUser.role === 'owner' ? 'Owner' : 'Staff'}
                  </span>
                </div>
              </div>
            </div>

            {/* Permission Selection Stats */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-8 py-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{selectedPermissions.length}</div>
                    <div className="text-xs text-gray-600">Selected</div>
                  </div>
                  <div className="w-px h-10 bg-gray-300"></div>
                  <div>
                    <div className="text-2xl font-bold text-gray-600">{AVAILABLE_PERMISSIONS.length}</div>
                    <div className="text-xs text-gray-600">Total Available</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedPermissions(AVAILABLE_PERMISSIONS.map(p => p.key))}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-semibold"
                  >
                    ✅ Select All
                  </button>
                  <button
                    onClick={() => setSelectedPermissions([])}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-semibold"
                  >
                    ❌ Clear All
                  </button>
                </div>
              </div>
            </div>

            {/* Permissions List - Grouped by Category */}
            <div className="p-8 overflow-y-auto max-h-[50vh]">
              {Object.entries(
                AVAILABLE_PERMISSIONS.reduce((acc, perm) => {
                  if (!acc[perm.category]) acc[perm.category] = [];
                  acc[perm.category].push(perm);
                  return acc;
                }, {} as Record<string, typeof AVAILABLE_PERMISSIONS>)
              ).map(([category, permissions]) => (
                <div key={category} className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2 border-b pb-2">
                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></span>
                    {category}
                    <span className="ml-auto text-sm font-normal text-gray-500">
                      {permissions.filter(p => selectedPermissions.includes(p.key)).length}/{permissions.length}
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {permissions.map((permission) => (
                      <label
                        key={permission.key}
                        className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedPermissions.includes(permission.key)
                            ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(permission.key)}
                          onChange={() => togglePermission(permission.key)}
                          className="w-5 h-5 mt-1 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                        />
                        <div className="ml-4 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{permission.icon}</span>
                            <span className="font-semibold text-gray-900">{permission.label}</span>
                          </div>
                          <p className="text-sm text-gray-600">{permission.description}</p>
                        </div>
                        {selectedPermissions.includes(permission.key) && (
                          <div className="ml-2">
                            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-8 py-5 flex gap-3 border-t">
              <button
                onClick={handleUpdatePermissions}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Permissions
              </button>
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalState.isOpen}
        onClose={closeNotificationModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
      />
    </div>
  );
}
