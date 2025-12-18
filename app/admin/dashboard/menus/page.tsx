'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';

interface MenuItem {
  id: number;
  name: string;
  path: string;
  icon: string;
  order: number;
  isActive: boolean;
  requiredRole: 'owner' | 'staff' | 'public';
  description: string;
  createdAt: string;
}

const ROLE_OPTIONS = [
  { value: 'owner', label: '👑 Owner Only', color: 'purple' },
  { value: 'staff', label: '👤 Staff & Owner', color: 'blue' },
  { value: 'public', label: '🌐 Public Access', color: 'green' },
];

export default function MenuManagement() {
  const { modalState, showModal, closeModal: closeNotificationModal } = useModal();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    path: '',
    icon: '📄',
    order: 0,
    requiredRole: 'staff' as 'owner' | 'staff' | 'public',
    description: '',
  });

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await api.get('/menu-items');
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      showModal('Error fetching menu items', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.path) {
      showModal('Please fill required fields (Name and Path)', 'warning');
      return;
    }

    try {
      await api.post('/menu-items', formData);
      fetchMenuItems();
      setShowFormModal(false);
      resetForm();
      showModal('Menu item created successfully!', 'success');
    } catch (error) {
      console.error('Error creating menu item:', error);
      showModal('Error creating menu item', 'error');
    }
  };

  const handleUpdate = async () => {
    if (!selectedMenu) return;

    try {
      await api.put(`/menu-items/${selectedMenu.id}`, formData);
      fetchMenuItems();
      setShowFormModal(false);
      resetForm();
      showModal('Menu item updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating menu item:', error);
      showModal('Error updating menu item', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      await api.delete(`/menu-items/${id}`);
      fetchMenuItems();
      showModal('Menu item deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting menu item:', error);
      showModal('Error deleting menu item', 'error');
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await api.put(`/menu-items/${id}/toggle`);
      fetchMenuItems();
    } catch (error) {
      console.error('Error toggling menu status:', error);
      showModal('Error updating menu status', 'error');
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm('This will create default menu items. Continue?')) return;

    try {
      await api.get('/menu-items/seed');
      fetchMenuItems();
      showModal('Default menus created successfully!', 'success');
    } catch (error) {
      console.error('Error seeding menus:', error);
      showModal('Error creating default menus', 'error');
    }
  };

  const openCreateModal = () => {
    setSelectedMenu(null);
    resetForm();
    setShowFormModal(true);
  };

  const openEditModal = (menu: MenuItem) => {
    setSelectedMenu(menu);
    setFormData({
      name: menu.name,
      path: menu.path,
      icon: menu.icon,
      order: menu.order,
      requiredRole: menu.requiredRole,
      description: menu.description || '',
    });
    setShowFormModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      path: '',
      icon: '📄',
      order: 0,
      requiredRole: 'staff',
      description: '',
    });
    setSelectedMenu(null);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800';
      case 'staff': return 'bg-blue-100 text-blue-800';
      case 'public': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
                📋 Menu Management
              </h1>
              <p className="text-gray-600 mt-1">Control navigation menu visibility and access</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSeedDefaults}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
              >
                🌱 Seed Defaults
              </button>
              <button
                onClick={openCreateModal}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
              >
                ➕ Create Menu
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-5 rounded-xl shadow-lg">
            <div className="text-2xl font-bold">{menuItems.length}</div>
            <div className="text-sm opacity-90">Total Menus</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-5 rounded-xl shadow-lg">
            <div className="text-2xl font-bold">{menuItems.filter(m => m.isActive).length}</div>
            <div className="text-sm opacity-90">Active Menus</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-5 rounded-xl shadow-lg">
            <div className="text-2xl font-bold">{menuItems.filter(m => m.requiredRole === 'owner').length}</div>
            <div className="text-sm opacity-90">Owner Only</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-5 rounded-xl shadow-lg">
            <div className="text-2xl font-bold">{menuItems.filter(m => m.requiredRole === 'staff').length}</div>
            <div className="text-sm opacity-90">Staff Access</div>
          </div>
        </div>

        {/* Menus Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((menu) => (
            <div
              key={menu.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
            >
              <div className={`p-4 ${menu.isActive ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-gray-400 to-gray-500'} text-white`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{menu.icon}</span>
                    <div>
                      <h3 className="text-lg font-bold">{menu.name}</h3>
                      <p className="text-xs opacity-90">{menu.path}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleActive(menu.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      menu.isActive
                        ? 'bg-white text-green-700 hover:bg-green-50'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {menu.isActive ? '✅ ON' : '❌ OFF'}
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(menu.requiredRole)}`}>
                    {menu.requiredRole === 'owner' ? '👑 Owner' : menu.requiredRole === 'staff' ? '👤 Staff' : '🌐 Public'}
                  </span>
                  <span className="ml-2 text-sm text-gray-600">Order: {menu.order}</span>
                </div>
                {menu.description && (
                  <p className="text-sm text-gray-600 mb-3">{menu.description}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(menu)}
                    className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors font-medium text-sm"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(menu.id)}
                    className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {menuItems.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No Menu Items</h3>
            <p className="text-gray-600 mb-6">Create menu items or seed defaults to get started</p>
            <button
              onClick={handleSeedDefaults}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
            >
              🌱 Seed Default Menus
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent">
              {selectedMenu ? '✏️ Edit Menu Item' : '➕ Create Menu Item'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Menu Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Dashboard"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Path *</label>
                <input
                  type="text"
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="/admin/dashboard"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon (Emoji)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="📊"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Role *</label>
                <select
                  value={formData.requiredRole}
                  onChange={(e) => setFormData({ ...formData, requiredRole: e.target.value as 'owner' | 'staff' | 'public' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={selectedMenu ? handleUpdate : handleCreate}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all"
                >
                  {selectedMenu ? 'Update' : 'Create'}
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
