'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface HeroSlide {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
  order: number;
  isActive: boolean;
}

export default function HeroSlidesManagement() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    buttonText: '',
    buttonLink: '',
    order: 1,
    isActive: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const response = await api.get('/hero-slides');
      setSlides(response.data.sort((a: HeroSlide, b: HeroSlide) => a.order - b.order));
    } catch (error) {
      console.error('Error fetching slides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('subtitle', formData.subtitle);
    formDataToSend.append('buttonText', formData.buttonText);
    formDataToSend.append('buttonLink', formData.buttonLink);
    formDataToSend.append('order', formData.order.toString());
    formDataToSend.append('isActive', formData.isActive.toString());
    
    if (imageFile) {
      formDataToSend.append('image', imageFile);
    }

    try {
      if (editingSlide) {
        await api.put(`/hero-slides/${editingSlide.id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/hero-slides', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      
      fetchSlides();
      closeModal();
    } catch (error) {
      console.error('Error saving slide:', error);
      alert('Error saving hero slide. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this slide?')) {
      try {
        await api.delete(`/hero-slides/${id}`);
        fetchSlides();
      } catch (error) {
        console.error('Error deleting slide:', error);
      }
    }
  };

  const openModal = (slide?: HeroSlide) => {
    if (slide) {
      setEditingSlide(slide);
      setFormData({
        title: slide.title || '',
        subtitle: slide.subtitle || '',
        buttonText: slide.buttonText || '',
        buttonLink: slide.buttonLink || '',
        order: slide.order,
        isActive: slide.isActive,
      });
      setImagePreview(slide.imageUrl);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSlide(null);
    setFormData({
      title: '',
      subtitle: '',
      buttonText: '',
      buttonLink: '',
      order: 1,
      isActive: true,
    });
    setImageFile(null);
    setImagePreview('');
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
          <h1 className="text-3xl font-bold text-gray-800">Hero Slides Management</h1>
          <p className="text-gray-600 mt-1">Control your homepage carousel</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg transition-all transform hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Slide
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {slides.map((slide) => (
          <div key={slide.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100 hover:shadow-xl transition-all">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              {/* Image Preview */}
              <div className="relative h-64 md:h-auto">
                {slide.imageUrl ? (
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                    <svg className="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    Order: {slide.order}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      slide.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                    }`}
                  >
                    {slide.isActive ? '● Active' : '○ Inactive'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="md:col-span-2 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{slide.title}</h3>
                  <p className="text-gray-600 mb-4">{slide.subtitle}</p>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-primary/10 px-4 py-2 rounded-lg">
                      <span className="text-xs font-semibold text-primary">Button Text</span>
                      <p className="font-semibold text-gray-800">{slide.buttonText}</p>
                    </div>
                    <div className="bg-blue-50 px-4 py-2 rounded-lg flex-1">
                      <span className="text-xs font-semibold text-blue-600">Link</span>
                      <p className="font-mono text-sm text-gray-700 truncate">{slide.buttonLink}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => openModal(slide)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-lg font-semibold transition-all shadow-md"
                  >
                    ✎ Edit Slide
                  </button>
                  <button
                    onClick={() => handleDelete(slide.id)}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-lg font-semibold transition-all shadow-md"
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {slides.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-dashed border-purple-300">
          <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-700 mb-2">No Hero Slides Yet</h3>
          <p className="text-gray-500 mb-6">Create slides for your homepage carousel</p>
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-lg font-semibold inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add First Slide
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-5 flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                {editingSlide ? '✎ Edit Hero Slide' : '+ Add New Hero Slide'}
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
                  Slide Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="e.g., Welcome to Tufan Resort"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Subtitle *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="e.g., Experience Luxury and Tranquility by the Lake"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Button Text *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.buttonText}
                    onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="e.g., Book Now, Explore"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Button Link *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.buttonLink}
                    onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="e.g., /rooms, /about"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Display Order *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="1"
                />
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first in the carousel</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Hero Image {!editingSlide && '*'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required={!editingSlide}
                  onChange={handleImageChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
                {imagePreview && (
                  <div className="mt-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg shadow-md"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 bg-purple-50 p-4 rounded-lg">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 text-purple-500 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">
                  Show this slide on homepage
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
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-lg font-bold transition-all shadow-lg"
                >
                  {editingSlide ? 'Update Slide' : 'Add Slide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
