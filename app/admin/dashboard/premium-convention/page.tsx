'use client';

import { useState, useEffect } from 'react';
import { api, conventionBookingsAPI } from '@/lib/api';

interface FoodPackage {
  id: number;
  name: string;
  description: string;
  pricePerPerson: number;
  items: string[];
}

interface AddonService {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
}

export default function PremiumConventionBooking() {
  const [step, setStep] = useState(1);
  const [halls, setHalls] = useState<any[]>([]);
  const [foodPackages, setFoodPackages] = useState<FoodPackage[]>([]);
  const [addonServices, setAddonServices] = useState<AddonService[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);
  
  const [formData, setFormData] = useState({
    hallId: '',
    customerName: '',
    organizationName: '',
    customerEmail: '',
    customerPhone: '',
    eventType: 'conference',
    eventDescription: '',
    eventDate: '',
    timeSlot: 'morning',
    numberOfGuests: 50,
    
    foodPackageId: '',
    foodCost: 0,
    selectedAddons: [] as number[],
    addonsCost: 0,
    hallRent: 0,
    discount: 0,
    totalAmount: 0,
    advancePayment: 0,
    paymentMethod: 'cash',
    paymentStatus: 'partial',
    status: 'confirmed'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [hallsRes, packagesRes, servicesRes] = await Promise.all([
        api.get('/convention-hall'),
        api.get('/food-packages/active'),
        api.get('/addon-services/active')
      ]);
      
      setHalls(hallsRes.data);
      setFoodPackages(packagesRes.data);
      setAddonServices(servicesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleHallSelect = (hallId: string) => {
    const hall = halls.find(h => h.id === Number(hallId));
    if (hall) {
      setFormData({ ...formData, hallId, hallRent: hall.pricePerDay });
      calculateTotal();
    }
  };

  const handleFoodPackageSelect = (packageId: string) => {
    const pkg = foodPackages.find(p => p.id === Number(packageId));
    if (pkg) {
      const foodCost = pkg.pricePerPerson * formData.numberOfGuests;
      setFormData({ ...formData, foodPackageId: packageId || '', foodCost });
      setTimeout(calculateTotal, 100);
    } else {
      setFormData({ ...formData, foodPackageId: '', foodCost: 0 });
      setTimeout(calculateTotal, 100);
    }
  };

  const handleAddonToggle = (serviceId: number) => {
    let newSelectedAddons;
    if (selectedAddons.includes(serviceId)) {
      newSelectedAddons = selectedAddons.filter(id => id !== serviceId);
    } else {
      newSelectedAddons = [...selectedAddons, serviceId];
    }
    setSelectedAddons(newSelectedAddons);
    
    // Calculate addon cost
    const addonCost = newSelectedAddons.reduce((sum, id) => {
      const service = addonServices.find(s => s.id === id);
      return sum + (service?.price || 0);
    }, 0);
    
    setFormData(prev => ({ 
      ...prev, 
      selectedAddons: newSelectedAddons, 
      addonsCost: addonCost 
    }));
    setTimeout(calculateTotal, 100);
  };

  const calculateTotal = () => {
    const total = formData.hallRent + formData.foodCost + formData.addonsCost - formData.discount;
    setFormData(prev => ({ ...prev, totalAmount: total }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare submission data with selected addons as JSON array
    const submissionData = {
      ...formData,
      foodPackageId: formData.foodPackageId ? Number(formData.foodPackageId) : null,
      selectedAddons: JSON.stringify(selectedAddons), // Convert to JSON string for backend
    };
    
    console.log('Submitting convention booking:', submissionData);
    console.log('Selected addons:', selectedAddons);
    console.log('Addons cost:', formData.addonsCost);
    
    try {
      await conventionBookingsAPI.create(submissionData);
      alert('Convention booking created successfully!');
      window.location.href = '/admin/dashboard/bookings';
    } catch (error) {
      console.error('Error creating convention booking:', error);
      alert('Failed to create booking');
    }
  };

  const getAddonsByCategory = (category: string) => {
    return addonServices.filter(s => s.category === category);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 mb-6 text-white">
        <h1 className="text-3xl font-bold mb-2">🎪 Premium Convention Booking</h1>
        <p className="text-purple-50">Book convention hall with food packages and add-on services</p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-between mb-8 max-w-4xl mx-auto">
        {[
          { num: 1, label: 'Hall & Event' },
          { num: 2, label: 'Food & Services' },
          { num: 3, label: 'Payment' }
        ].map((s) => (
          <div key={s.num} className="flex items-center flex-1">
            <div className={`flex flex-col items-center flex-1 ${s.num < 3 ? 'relative' : ''}`}>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                  step >= s.num
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {s.num}
              </div>
              <span className="text-sm mt-2 font-semibold">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
        {/* Step 1: Hall & Event Details */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-purple-600">🏛️ Select Hall & Event Details</h2>
            
            <div className="space-y-6">
              {/* Hall Selection */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Select Convention Hall *</label>
                <select
                  value={formData.hallId}
                  onChange={(e) => handleHallSelect(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                  required
                >
                  <option value="">Choose a hall...</option>
                  {halls.map(hall => (
                    <option key={hall.id} value={hall.id}>
                      {hall.name} - Capacity: {hall.capacity} - ৳{hall.pricePerDay}/day
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Contact Person Name *</label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Organization Name</label>
                  <input
                    type="text"
                    value={formData.organizationName}
                    onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                    placeholder="Company/Organization name"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Event Type *</label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                    required
                  >
                    <option value="conference">Conference</option>
                    <option value="wedding">Wedding</option>
                    <option value="meeting">Meeting</option>
                    <option value="seminar">Seminar</option>
                    <option value="party">Party</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Event Date *</label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Time Slot *</label>
                  <select
                    value={formData.timeSlot}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                    required
                  >
                    <option value="morning">Morning (8 AM - 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                    <option value="evening">Evening (5 PM - 10 PM)</option>
                    <option value="fullday">Full Day</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Number of Guests *</label>
                  <input
                    type="number"
                    value={formData.numberOfGuests}
                    onChange={(e) => {
                      setFormData({ ...formData, numberOfGuests: Number(e.target.value) });
                      if (formData.foodPackageId) {
                        handleFoodPackageSelect(formData.foodPackageId);
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Event Description</label>
                <textarea
                  value={formData.eventDescription}
                  onChange={(e) => setFormData({ ...formData, eventDescription: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                  rows={3}
                  placeholder="Describe your event..."
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-lg font-bold hover:shadow-lg"
            >
              Next: Food & Services →
            </button>
          </div>
        )}

        {/* Step 2: Food Packages & Add-ons */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-purple-600">🍽️ Select Food Package & Add-ons</h2>
            
            {/* Food Packages */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Choose Food Package:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {foodPackages.map(pkg => (
                  <div
                    key={pkg.id}
                    onClick={() => handleFoodPackageSelect(pkg.id.toString())}
                    className={`cursor-pointer border-2 rounded-xl p-4 transition-all ${
                      formData.foodPackageId === pkg.id.toString()
                        ? 'border-purple-600 bg-purple-50 shadow-lg'
                        : 'border-gray-300 hover:border-purple-400'
                    }`}
                  >
                    <h4 className="font-bold text-lg mb-2">{pkg.name}</h4>
                    <p className="text-2xl font-bold text-purple-600 mb-2">৳{pkg.pricePerPerson}<span className="text-sm">/person</span></p>
                    <p className="text-sm text-gray-600 mb-2">{pkg.description}</p>
                    <div className="text-xs text-gray-500">
                      {pkg.items.slice(0, 3).join(', ')}...
                    </div>
                    {formData.foodPackageId === pkg.id.toString() && (
                      <div className="mt-3 text-green-600 font-bold">
                        ✓ Total: ৳{formData.foodCost.toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Add-on Services */}
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Add-on Services:</h3>
              
              {['decoration', 'sound_system', 'photography', 'other'].map(category => {
                const categoryServices = getAddonsByCategory(category);
                if (categoryServices.length === 0) return null;
                
                const categoryLabels: Record<string, string> = {
                  decoration: '🎨 Decoration',
                  sound_system: '🔊 Sound & AV',
                  photography: '📸 Photography & Video',
                  other: '➕ Other Services'
                };
                
                return (
                  <div key={category} className="mb-6">
                    <h4 className="font-semibold text-gray-700 mb-3">
                      {categoryLabels[category] || category}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryServices.map(service => (
                        <div
                          key={service.id}
                          onClick={() => handleAddonToggle(service.id)}
                          className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                            selectedAddons.includes(service.id)
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-gray-300 hover:border-purple-400'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-bold">{service.name}</h5>
                            <input
                              type="checkbox"
                              checked={selectedAddons.includes(service.id)}
                              onChange={() => {}}
                              className="w-5 h-5"
                            />
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                          <p className="text-lg font-bold text-purple-600">৳{service.price.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cost Summary */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-600 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-lg mb-4">💰 Cost Breakdown:</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Hall Rent:</span>
                  <span className="font-bold">৳{formData.hallRent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Food ({formData.numberOfGuests} guests):</span>
                  <span className="font-bold">৳{formData.foodCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Add-ons ({selectedAddons.length} services):</span>
                  <span className="font-bold">৳{formData.addonsCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-purple-600 border-t-2 pt-2 mt-2">
                  <span>Subtotal:</span>
                  <span>৳{(formData.hallRent + formData.foodCost + formData.addonsCost).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-300 text-gray-700 px-6 py-4 rounded-lg font-bold hover:bg-gray-400"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-lg font-bold hover:shadow-lg"
              >
                Next: Payment →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-purple-600">💳 Payment Details</h2>
            
            {/* Final Bill Summary */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-600 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-xl mb-4">📋 Final Bill:</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Hall Rent:</span>
                  <span className="font-bold">৳{formData.hallRent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Food Cost:</span>
                  <span className="font-bold">৳{formData.foodCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Add-on Services ({selectedAddons.length}):</span>
                  <span className="font-bold">৳{formData.addonsCost.toLocaleString()}</span>
                </div>
                {selectedAddons.length > 0 && (
                  <div className="ml-4 text-sm text-gray-600 space-y-1">
                    {selectedAddons.map(addonId => {
                      const addon = addonServices.find(s => s.id === addonId);
                      return addon ? (
                        <div key={addonId} className="flex justify-between">
                          <span>• {addon.name}</span>
                          <span>৳{addon.price.toLocaleString()}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
                <div className="flex justify-between text-lg border-t-2 pt-2">
                  <span>Subtotal:</span>
                  <span className="font-bold">৳{(formData.hallRent + formData.foodCost + formData.addonsCost).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span className="font-bold">-৳{formData.discount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-2xl font-bold text-purple-600 border-t-2 pt-2">
                  <span>TOTAL:</span>
                  <span>৳{formData.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t-2 pt-2">
                  <span>Advance Payment:</span>
                  <span className="font-bold text-blue-600">৳{formData.advancePayment.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-red-600">
                  <span>Remaining:</span>
                  <span>৳{(formData.totalAmount - formData.advancePayment).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Discount (৳)</label>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => {
                    setFormData({ ...formData, discount: Number(e.target.value) });
                    setTimeout(calculateTotal, 100);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Advance Payment (৳) *</label>
                <input
                  type="number"
                  value={formData.advancePayment}
                  onChange={(e) => setFormData({ ...formData, advancePayment: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Payment Method *</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                  required
                >
                  <option value="cash">💵 Cash</option>
                  <option value="card">💳 Card</option>
                  <option value="mfs">📱 Mobile Banking</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-300 text-gray-700 px-6 py-4 rounded-lg font-bold hover:bg-gray-400"
              >
                ← Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-lg font-bold hover:shadow-lg"
              >
                🔒 Confirm Convention Booking
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
