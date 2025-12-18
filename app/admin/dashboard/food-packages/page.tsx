'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';

interface FoodPackage {
  id: number;
  name: string;
  description: string;
  pricePerPerson: number;
  items: string[];
  isActive: boolean;
}

export default function FoodPackagesPage() {
  const { modalState, showModal: showAlert, closeModal } = useModal();
  const [packages, setPackages] = useState<FoodPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<FoodPackage | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pricePerPerson: '',
    items: '',
    isActive: true
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await api.get('/food-packages');
      setPackages(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching food packages:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const packageData = {
      name: formData.name,
      description: formData.description,
      pricePerPerson: Number(formData.pricePerPerson),
      items: formData.items.split('\n').filter(item => item.trim()),
      isActive: formData.isActive
    };

    try {
      if (editingPackage) {
        await api.put(`/food-packages/${editingPackage.id}`, packageData);
      } else {
        await api.post('/food-packages', packageData);
      }
      setShowModal(false);
      resetForm();
      fetchPackages();
      showAlert('Success', editingPackage ? 'Food package updated successfully!' : 'Food package created successfully!', 'success');
    } catch (error) {
      console.error('Error saving food package:', error);
      showAlert('Error', 'Failed to save food package. Please try again.', 'error');
    }
  };

  const handleEdit = (pkg: FoodPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description,
      pricePerPerson: pkg.pricePerPerson.toString(),
      items: pkg.items.join('\n'),
      isActive: pkg.isActive
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    showAlert(
      'Confirm Delete',
      'Are you sure you want to delete this food package?',
      'warning',
      async () => {
        try {
          await api.delete(`/food-packages/${id}`);
          fetchPackages();
          showAlert('Success', 'Food package deleted successfully!', 'success');
        } catch (error) {
          console.error('Error deleting food package:', error);
          showAlert('Error', 'Failed to delete food package. Please try again.', 'error');
        }
      },
      'Delete',
      'Cancel'
    );
  };

  const handleToggleActive = async (id: number) => {
    try {
      await api.put(`/food-packages/${id}/toggle-active`, {});
      fetchPackages();
    } catch (error) {
      console.error('Error toggling package status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      pricePerPerson: '',
      items: '',
      isActive: true
    });
    setEditingPackage(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#006747]"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#006747] to-[#f4a425] rounded-2xl p-8 mb-6 text-white">
        <h1 className="text-3xl font-bold mb-2">🍽️ Food Packages Management</h1>
        <p className="text-green-50">Manage convention hall food packages and menus</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-600">
          <div className="text-gray-600 text-sm mb-1">Total Packages</div>
          <div className="text-3xl font-bold text-gray-800">{packages.length}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-600">
          <div className="text-gray-600 text-sm mb-1">Active Packages</div>
          <div className="text-3xl font-bold text-gray-800">
            {packages.filter(p => p.isActive).length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-yellow-600">
          <div className="text-gray-600 text-sm mb-1">Min Price</div>
          <div className="text-3xl font-bold text-gray-800">
            ৳{Math.min(...packages.map(p => p.pricePerPerson))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-red-600">
          <div className="text-gray-600 text-sm mb-1">Max Price</div>
          <div className="text-3xl font-bold text-gray-800">
            ৳{Math.max(...packages.map(p => p.pricePerPerson))}
          </div>
        </div>
      </div>

      {/* Add Button */}
      <div className="mb-6">
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-[#006747] to-[#f4a425] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
        >
          ➕ Add New Food Package
        </button>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-200"
          >
            {/* Package Header */}
            <div className="bg-gradient-to-r from-[#006747] to-[#f4a425] p-6 text-white">
              <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">৳{pkg.pricePerPerson}</span>
                <span className="text-sm bg-white/20 px-3 py-1 rounded-full">per person</span>
              </div>
            </div>

            {/* Package Body */}
            <div className="p-6">
              <p className="text-gray-600 mb-4">{pkg.description}</p>
              
              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">📋 Menu Items:</h4>
                <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {pkg.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-1">
                      <span className="text-green-600">✓</span>
                      <span className="text-gray-700 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    pkg.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {pkg.isActive ? '✅ Active' : '❌ Inactive'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(pkg)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleToggleActive(pkg.id)}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    pkg.isActive
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {pkg.isActive ? '⏸️ Deactivate' : '▶️ Activate'}
                </button>
                <button
                  onClick={() => handleDelete(pkg.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#006747] to-[#f4a425] p-6 text-white rounded-t-2xl">
              <h2 className="text-2xl font-bold">
                {editingPackage ? '✏️ Edit Food Package' : '➕ Add New Food Package'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Package Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747]"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Price Per Person (৳)</label>
                  <input
                    type="number"
                    value={formData.pricePerPerson}
                    onChange={(e) => setFormData({ ...formData, pricePerPerson: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747]"
                    required
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Menu Items (one per line)
                  </label>
                  <textarea
                    value={formData.items}
                    onChange={(e) => setFormData({ ...formData, items: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006747]"
                    rows={8}
                    placeholder="Rice&#10;Dal&#10;Chicken Curry&#10;Mixed Vegetable"
                    required
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <label className="text-gray-700 font-semibold">Active (Available for booking)</label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#006747] to-[#f4a425] text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all font-semibold"
                >
                  💾 Save Package
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
                >
                  ❌ Cancel
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
