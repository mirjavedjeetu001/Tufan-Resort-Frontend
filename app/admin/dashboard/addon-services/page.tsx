'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface AddonService {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  isActive: boolean;
}

const CATEGORIES = [
  { value: 'DECORATION', label: '🎨 Decoration', color: 'pink' },
  { value: 'AUDIO_VISUAL', label: '🎵 Audio Visual', color: 'purple' },
  { value: 'PHOTOGRAPHY', label: '📸 Photography', color: 'blue' },
  { value: 'CATERING', label: '🍽️ Catering', color: 'orange' },
  { value: 'FURNITURE', label: '🪑 Furniture', color: 'brown' },
  { value: 'TECHNICAL', label: '⚡ Technical', color: 'yellow' },
  { value: 'OTHER', label: '📦 Other', color: 'gray' }
];

export default function AddonServicesPage() {
  const [services, setServices] = useState<AddonService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<AddonService | null>(null);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'DECORATION',
    price: '',
    isActive: true
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get('http://localhost:3001/addon-services');
      setServices(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching addon services:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const serviceData = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      price: Number(formData.price),
      isActive: formData.isActive
    };

    try {
      if (editingService) {
        await axios.put(
          `http://localhost:3001/addon-services/${editingService.id}`,
          serviceData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post('http://localhost:3001/addon-services', serviceData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowModal(false);
      resetForm();
      fetchServices();
    } catch (error) {
      console.error('Error saving addon service:', error);
      alert('Failed to save addon service');
    }
  };

  const handleEdit = (service: AddonService) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      category: service.category,
      price: service.price.toString(),
      isActive: service.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this addon service?')) return;
    
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:3001/addon-services/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchServices();
    } catch (error) {
      console.error('Error deleting addon service:', error);
      alert('Failed to delete addon service');
    }
  };

  const handleToggleActive = async (id: number) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(
        `http://localhost:3001/addon-services/${id}/toggle-active`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchServices();
    } catch (error) {
      console.error('Error toggling service status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'DECORATION',
      price: '',
      isActive: true
    });
    setEditingService(null);
  };

  const getCategoryColor = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat?.color || 'gray';
  };

  const filteredServices = filterCategory === 'ALL' 
    ? services 
    : services.filter(s => s.category === filterCategory);

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
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 mb-6 text-white">
        <h1 className="text-3xl font-bold mb-2">🎨 Add-on Services Management</h1>
        <p className="text-purple-50">Manage additional services for events and conventions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-600">
          <div className="text-gray-600 text-sm mb-1">Total Services</div>
          <div className="text-3xl font-bold text-gray-800">{services.length}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-600">
          <div className="text-gray-600 text-sm mb-1">Active Services</div>
          <div className="text-3xl font-bold text-gray-800">
            {services.filter(s => s.isActive).length}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-600">
          <div className="text-gray-600 text-sm mb-1">Categories</div>
          <div className="text-3xl font-bold text-gray-800">{CATEGORIES.length}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-yellow-600">
          <div className="text-gray-600 text-sm mb-1">Avg Price</div>
          <div className="text-3xl font-bold text-gray-800">
            ৳{Math.round(services.reduce((sum, s) => sum + s.price, 0) / services.length)}
          </div>
        </div>
      </div>

      {/* Actions Row */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
        >
          ➕ Add New Service
        </button>

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-6 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 font-semibold"
        >
          <option value="ALL">🔍 All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-200"
          >
            {/* Service Header */}
            <div className={`bg-gradient-to-r from-${getCategoryColor(service.category)}-500 to-${getCategoryColor(service.category)}-600 p-6 text-white`}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-bold flex-1">{service.name}</h3>
                <span className="text-2xl">
                  {CATEGORIES.find(c => c.value === service.category)?.label.split(' ')[0]}
                </span>
              </div>
              <div className="text-3xl font-bold">৳{service.price.toLocaleString()}</div>
            </div>

            {/* Service Body */}
            <div className="p-6">
              <p className="text-gray-600 mb-4">{service.description}</p>
              
              {/* Category Badge */}
              <div className="mb-4">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                  {CATEGORIES.find(c => c.value === service.category)?.label}
                </span>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    service.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {service.isActive ? '✅ Active' : '❌ Inactive'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleToggleActive(service.id)}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    service.isActive
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {service.isActive ? '⏸️' : '▶️'}
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
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
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white rounded-t-2xl">
              <h2 className="text-2xl font-bold">
                {editingService ? '✏️ Edit Add-on Service' : '➕ Add New Service'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Service Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                    placeholder="e.g., Stage Decoration"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                    rows={3}
                    placeholder="Describe the service..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                    required
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Price (৳)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                    placeholder="0"
                    required
                    min="0"
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
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all font-semibold"
                >
                  💾 Save Service
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
    </div>
  );
}
