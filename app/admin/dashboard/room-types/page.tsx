'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';

interface RoomType {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export default function RoomTypesManagement() {
  const { modalState, openModal, closeModal } = useModal();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<RoomType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    fetchRoomTypes();
  }, []);

  const fetchRoomTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/room-types', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoomTypes(response.data);
    } catch (error) {
      console.error('Error fetching room types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      if (editingType) {
        await axios.put(`http://localhost:3001/room-types/${editingType.id}`, formData, config);
      } else {
        await axios.post('http://localhost:3001/room-types', formData, config);
      }
      
      fetchRoomTypes();
      closeFormModal();
    } catch (error) {
      console.error('Error saving room type:', error);
      alert('Error saving room type. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    showAlert(
      'Confirm Delete',
      'Are you sure you want to delete this room type?',
      'warning',
      async () => {
        try {
          await api.delete(`/room-types/${id}`);
          fetchRoomTypes();
          showAlert('Success', 'Room type deleted successfully!', 'success');
        } catch (error) {
          console.error('Error deleting room type:', error);
          showAlert('Error', 'Failed to delete room type.', 'error');
        }
      },
      'Delete',
      'Cancel'
    );
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:3001/room-types/${id}/toggle-active`, 
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRoomTypes();
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleSeedDefaults = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3001/room-types/seed-defaults', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`✅ ${response.data.message}\n${response.data.count} room types created!`);
      fetchRoomTypes();
    } catch (error) {
      console.error('Error seeding defaults:', error);
      alert('Error creating default room types');
    }
  };

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' = 'error', onConfirm?: () => void, confirmText?: string, cancelText?: string) => {
    openModal({ title, message, type, onConfirm, confirmText, cancelText });
  };

  const openFormModal = (type?: RoomType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        description: type.description,
        isActive: type.isActive,
      });
    } else {
      setEditingType(null);
      setFormData({ name: '', description: '', isActive: true });
    }
    setShowModal(true);
  };

  const closeFormModal = () => {
    setShowModal(false);
    setEditingType(null);
    setFormData({ name: '', description: '', isActive: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl text-gray-600">Loading room types...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#006747] to-[#f4a425] rounded-2xl shadow-2xl p-8 mb-8 text-white">
          <h1 className="text-4xl font-bold mb-2">🏷️ Room Types Management</h1>
          <p className="text-lg opacity-90">Configure room categories for your resort</p>
        </div>

        {/* Add New Button */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => openFormModal()}
            className="bg-gradient-to-r from-[#006747] to-[#f4a425] text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition"
          >
            ➕ Add New Room Type
          </button>
          {roomTypes.length === 0 && (
            <button
              onClick={handleSeedDefaults}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition"
            >
              🌱 Create Default Room Types
            </button>
          )}
        </div>

        {/* Room Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roomTypes.map((type) => (
            <div
              key={type.id}
              className={`bg-white rounded-xl shadow-lg p-6 border-2 transition transform hover:scale-105 ${
                type.isActive ? 'border-green-400' : 'border-gray-300 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">{type.name}</h3>
                <button
                  onClick={() => handleToggleActive(type.id, type.isActive)}
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    type.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {type.isActive ? '✅ Active' : '❌ Inactive'}
                </button>
              </div>
              
              <p className="text-gray-600 mb-4 line-clamp-2">{type.description}</p>
              
              <div className="text-xs text-gray-400 mb-4">
                Created: {new Date(type.createdAt).toLocaleDateString('en-GB')}
              </div>
              
              <div className="flex gap-2 border-t pt-4">
                <button
                  onClick={() => openFormModal(type)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition"
                >
                  📝 Edit
                </button>
                <button
                  onClick={() => handleDelete(type.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-medium transition"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {roomTypes.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg">
            <div className="text-6xl mb-4">🏷️</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Room Types Yet</h3>
            <p className="text-gray-500 mb-4">Create default types or add your own custom room types</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleSeedDefaults}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg"
              >
                🌱 Create Default Types
              </button>
              <button
                onClick={() => openFormModal()}
                className="bg-gradient-to-r from-[#006747] to-[#f4a425] text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg"
              >
                ➕ Add Custom Type
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#006747] to-[#f4a425] text-white px-8 py-6 rounded-t-2xl sticky top-0 z-10">
              <h2 className="text-3xl font-bold">
                {editingType ? '✏️ Edit Room Type' : '➕ Add New Room Type'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Room Type Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747]"
                    placeholder="e.g., Presidential Suite"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747]"
                    rows={4}
                    placeholder="Describe this room type..."
                  />
                </div>

                {/* Active Status */}
                <div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="mr-3 w-5 h-5"
                    />
                    <span className="text-gray-700 font-semibold">Active (Available for booking)</span>
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="flex-1 bg-gray-300 text-gray-700 px-6 py-4 rounded-lg font-bold hover:bg-gray-400"
                >
                  ❌ Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#006747] to-[#f4a425] text-white px-6 py-4 rounded-lg font-bold hover:shadow-lg"
                >
                  {editingType ? '✅ Update' : '➕ Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
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
