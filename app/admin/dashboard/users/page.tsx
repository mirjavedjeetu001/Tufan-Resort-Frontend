'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

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
  { key: 'dashboard.view', label: 'Dashboard View', icon: '📊' },
  { key: 'rooms.manage', label: 'Rooms Management', icon: '🛏️' },
  { key: 'bookings.manage', label: 'Bookings Management', icon: '📅' },
  { key: 'convention.manage', label: 'Convention Hall Management', icon: '🏛️' },
  { key: 'hero-slides.manage', label: 'Hero Slides Management', icon: '🎨' },
  { key: 'resort-settings.manage', label: 'Resort Settings', icon: '⚙️' },
  { key: 'users.manage', label: 'User Management', icon: '👥' },
  { key: 'menu.manage', label: 'Menu Management', icon: '📋' },
  { key: 'access-control.manage', label: 'Access Control', icon: '🔐' },
];

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
      alert('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      alert('Please fill all required fields');
      return;
    }

    try {
      await api.post('/users', formData);
      fetchUsers();
      setShowModal(false);
      resetForm();
      alert('✅ User created successfully!');
    } catch (error: any) {
      console.error('Error creating user:', error);
      alert(error.response?.data?.message || 'Error creating user');
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
      setShowModal(false);
      resetForm();
      alert('✅ User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
      alert('✅ User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await api.put(`/users/${id}/toggle-active`);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Error updating user status');
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
      alert('✅ Permissions updated successfully!');
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('Error updating permissions');
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
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
    });
    setShowModal(true);
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-green-100 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-5 mb-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent">
                👥 User Management
              </h1>
              <p className="text-gray-600 mt-1">Manage admin users and their permissions</p>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
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
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-5 rounded-xl shadow-lg">
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-green-600 to-yellow-600 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Permissions</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="font-semibold text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="text-gray-600">{user.email}</div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'owner' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'owner' ? '👑 Owner' : '👤 Staff'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => openPermissionsModal(user)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        🔐 {user.permissions?.length || 0} permissions
                      </button>
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => handleToggleActive(user.id)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          user.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {user.isActive ? '✅ Active' : '❌ Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
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
        </div>
      </div>

      {/* Create/Edit User Modal */}
      {showModal && (
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
                  onClick={() => setShowModal(false)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent">
              🔐 Manage Permissions - {selectedUser.name}
            </h2>
            <p className="text-gray-600 mb-6">Select permissions for this user</p>
            <div className="space-y-3 mb-6">
              {AVAILABLE_PERMISSIONS.map((permission) => (
                <label
                  key={permission.key}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(permission.key)}
                    onChange={() => togglePermission(permission.key)}
                    className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="ml-3 text-2xl">{permission.icon}</span>
                  <span className="ml-3 font-medium text-gray-900">{permission.label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleUpdatePermissions}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all"
              >
                Save Permissions
              </button>
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
