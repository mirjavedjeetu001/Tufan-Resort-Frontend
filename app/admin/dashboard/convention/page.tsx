'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface ConventionHall {
  id: number;
  name: string;
  capacity: number;
  pricePerDay: number;
  description: string;
  amenities: string[];
  images: string[];
  isAvailable: boolean;
}

export default function ConventionManagement() {
  const [halls, setHalls] = useState<ConventionHall[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingHall, setEditingHall] = useState<ConventionHall | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: 0,
    pricePerDay: 0,
    description: '',
    amenities: '',
    isAvailable: true,
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);

  useEffect(() => {
    fetchHalls();
  }, []);

  const fetchHalls = async () => {
    try {
      const response = await api.get('/convention-hall');
      setHalls(response.data);
    } catch (error) {
      console.error('Error fetching halls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(previews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('maxCapacity', formData.maxCapacity.toString());
    formDataToSend.append('pricePerDay', formData.pricePerDay.toString());
    formDataToSend.append('description', formData.description);
    formDataToSend.append('amenities', formData.amenities);
    formDataToSend.append('isAvailable', formData.isAvailable.toString());
    
    imageFiles.forEach(file => {
      formDataToSend.append('images', file);
    });

    try {
      if (editingHall) {
        await api.put(`/convention-hall/${editingHall.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/convention-hall', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      
      fetchHalls();
      closeModal();
    } catch (error) {
      console.error('Error saving hall:', error);
      alert('Error saving convention hall. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this hall?')) {
      try {
        await api.delete(`/convention-hall/${id}`);
        fetchHalls();
      } catch (error) {
        console.error('Error deleting hall:', error);
      }
    }
  };

  const openModal = (hall?: ConventionHall) => {
    if (hall) {
      setEditingHall(hall);
      setFormData({
        name: hall.name,
        maxCapacity: hall.maxCapacity,
        pricePerDay: hall.pricePerDay,
        description: hall.description,
        amenities: hall.amenities.join(', '),
        isAvailable: hall.isAvailable,
      });
      setImagePreview(hall.images || []);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingHall(null);
    setFormData({
      name: '',
      maxCapacity: 0,
      pricePerDay: 0,
      description: '',
      amenities: '',
      isAvailable: true,
    });
    setImageFiles([]);
    setImagePreview([]);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Convention Hall Management</h1>
          <p className="text-gray-600 mt-1">Manage your event spaces and venues</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg transition-all transform hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Convention Hall
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {halls.map((hall) => (
          <div key={hall.id} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all transform hover:-translate-y-1">
            <div className="relative h-64">
              {hall.images && hall.images.length > 0 ? (
                <img
                  src={`http://localhost:3001${hall.images[0]}`}
                  alt={hall.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-teal-200 flex items-center justify-center">
                  <svg className="w-20 h-20 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}
              <div className="absolute top-4 right-4">
                <span
                  className={`px-4 py-2 rounded-full text-xs font-bold shadow-lg ${
                    hall.isAvailable 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {hall.isAvailable ? '✓ Available' : '✗ Unavailable'}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <h3 className="text-2xl font-bold text-white">{hall.name}</h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-xs font-semibold text-blue-600">Capacity</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{hall.maxCapacity}</p>
                </div>
                
                <div className="bg-accent/10 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-semibold text-accent">Price/Day</span>
                  </div>
                  <p className="text-2xl font-bold text-accent">৳{Number(hall.pricePerDay || 0).toLocaleString()}</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4 line-clamp-2">{hall.description}</p>
              
              {hall.amenities && hall.amenities.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">AMENITIES</p>
                  <div className="flex flex-wrap gap-2">
                    {hall.amenities.slice(0, 4).map((amenity, index) => (
                      <span key={index} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                        {amenity}
                      </span>
                    ))}
                    {hall.amenities.length > 4 && (
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                        +{hall.amenities.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => openModal(hall)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md"
                >
                  ✎ Edit
                </button>
                <button
                  onClick={() => handleDelete(hall.id)}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md"
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {halls.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-300">
          <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-700 mb-2">No Convention Halls Yet</h3>
          <p className="text-gray-500 mb-6">Create your first event space to get started</p>
          <button
            onClick={() => openModal()}
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-semibold inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add First Hall
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-primary to-teal-600 text-white px-6 py-5 flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {editingHall ? '✎ Edit Convention Hall' : '+ Add New Convention Hall'}
              </h2>
              <button
                onClick={closeModal}
                className="text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-2xl transition-colors"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Hall Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="e.g., Grand Ballroom, Crystal Hall"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Capacity (People) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="e.g., 500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Price per Day (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.pricePerDay}
                    onChange={(e) => setFormData({ ...formData, pricePerDay: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="e.g., 50000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Describe the hall features, facilities, and ideal events..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Amenities (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="e.g., Projector, Stage, AC, Sound System, Catering"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Hall Images
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
                {imagePreview.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mt-4">
                    {imagePreview.map((preview, index) => (
                      <img
                        key={index}
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg shadow-md"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="w-5 h-5 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="isAvailable" className="text-sm font-semibold text-gray-700">
                  Hall is available for booking
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-700 text-white py-3 rounded-lg font-bold transition-all shadow-lg"
                >
                  {editingHall ? 'Update Hall' : 'Add Hall'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
