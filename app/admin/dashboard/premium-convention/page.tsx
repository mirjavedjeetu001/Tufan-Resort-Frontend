'use client';

import { useState, useEffect } from 'react';
import { api, conventionBookingsAPI } from '@/lib/api';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';

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
  const { modalState, showModal, closeModal } = useModal();
  const [step, setStep] = useState(1);
  const [halls, setHalls] = useState<any[]>([]);
  const [foodPackages, setFoodPackages] = useState<FoodPackage[]>([]);
  const [addonServices, setAddonServices] = useState<AddonService[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);
  const [availability, setAvailability] = useState<any>(null);
  const [showManualTime, setShowManualTime] = useState(false);
  const [foodPackageQuantity, setFoodPackageQuantity] = useState(1);
  const [addonQuantities, setAddonQuantities] = useState<Record<number, number>>({});
  
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
    customStartTime: '',
    customEndTime: '',
    numberOfGuests: 50,
    
    foodPackageId: '',
    foodPackageQuantity: 1,
    foodCost: 0,
    selectedAddons: [] as number[],
    addonQuantities: {} as Record<number, number>,
    addonsCost: 0,
    hallRent: 0,
    discountType: 'none' as 'none' | 'percentage' | 'flat',
    discountPercentage: 0,
    discountAmount: 0,
    discount: 0,
    vatEnabled: false,
    vatPercentage: 15,
    vatAmount: 0,
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

  const checkAvailability = async () => {
    if (!formData.hallId || !formData.eventDate || !formData.timeSlot) {
      showModal('Please select Hall, Event Date, and Time Slot first', 'warning');
      return;
    }

    try {
      const response = await conventionBookingsAPI.checkAvailability(
        Number(formData.hallId),
        formData.eventDate,
        formData.timeSlot
      );
      setAvailability(response.data);
    } catch (error: any) {
      console.error('Error checking availability:', error);
      showModal('Error checking availability: ' + (error.response?.data?.message || error.message || 'Unknown error'), 'error');
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
      const foodCost = pkg.pricePerPerson * foodPackageQuantity;
      setFormData({ ...formData, foodPackageId: packageId || '', foodPackageQuantity, foodCost });
      setTimeout(calculateTotal, 100);
    } else {
      setFormData({ ...formData, foodPackageId: '', foodPackageQuantity: 1, foodCost: 0 });
      setFoodPackageQuantity(1);
      setTimeout(calculateTotal, 100);
    }
  };

  const handleFoodQuantityChange = (quantity: number) => {
    setFoodPackageQuantity(quantity);
    if (formData.foodPackageId) {
      const pkg = foodPackages.find(p => p.id === Number(formData.foodPackageId));
      if (pkg) {
        const foodCost = pkg.pricePerPerson * quantity;
        setFormData({ ...formData, foodPackageQuantity: quantity, foodCost });
        setTimeout(calculateTotal, 100);
      }
    }
  };

  const handleAddonToggle = (serviceId: number) => {
    let newSelectedAddons;
    let newQuantities = { ...addonQuantities };
    
    if (selectedAddons.includes(serviceId)) {
      newSelectedAddons = selectedAddons.filter(id => id !== serviceId);
      delete newQuantities[serviceId];
    } else {
      newSelectedAddons = [...selectedAddons, serviceId];
      newQuantities[serviceId] = 1; // Default quantity
    }
    setSelectedAddons(newSelectedAddons);
    setAddonQuantities(newQuantities);
    
    // Calculate addon cost with quantities
    const addonCost = newSelectedAddons.reduce((sum, id) => {
      const service = addonServices.find(s => s.id === id);
      const quantity = newQuantities[id] || 1;
      return sum + ((service?.price || 0) * quantity);
    }, 0);
    
    setFormData(prev => ({ 
      ...prev, 
      selectedAddons: newSelectedAddons,
      addonQuantities: newQuantities,
      addonsCost: addonCost 
    }));
    setTimeout(calculateTotal, 100);
  };

  const handleAddonQuantityChange = (serviceId: number, quantity: number) => {
    const newQuantities = { ...addonQuantities, [serviceId]: quantity };
    setAddonQuantities(newQuantities);
    
    // Recalculate addon cost
    const addonCost = selectedAddons.reduce((sum, id) => {
      const service = addonServices.find(s => s.id === id);
      const qty = newQuantities[id] || 1;
      return sum + ((service?.price || 0) * qty);
    }, 0);
    
    setFormData(prev => ({ 
      ...prev,
      addonQuantities: newQuantities,
      addonsCost: addonCost 
    }));
    setTimeout(calculateTotal, 100);
  };

  const calculateDiscountAmount = (): number => {
    const subtotal = Number(formData.hallRent) + Number(formData.foodCost) + Number(formData.addonsCost);
    if (formData.discountType === 'percentage') {
      return (subtotal * Number(formData.discountPercentage)) / 100;
    } else if (formData.discountType === 'flat') {
      return Number(formData.discountAmount);
    }
    return 0;
  };

  const calculateSubtotal = (): number => {
    return Number(formData.hallRent) + Number(formData.foodCost) + Number(formData.addonsCost);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscountAmount();
    const afterDiscount = Number(subtotal) - Number(discount);
    const vatAmount = formData.vatEnabled ? (Number(afterDiscount) * Number(formData.vatPercentage) / 100) : 0;
    const total = Number(afterDiscount) + Number(vatAmount);
    setFormData(prev => ({ ...prev, discount: Number(discount), vatAmount: Number(vatAmount), totalAmount: Number(total) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare submission data with selected addons and quantities as JSON
    const submissionData = {
      ...formData,
      foodPackageId: formData.foodPackageId ? Number(formData.foodPackageId) : null,
      foodPackageQuantity: foodPackageQuantity,
      selectedAddons: JSON.stringify(selectedAddons), // Convert to JSON string for backend
      addonQuantities: JSON.stringify(addonQuantities), // Store quantities
    };
    
    console.log('Submitting convention booking:', submissionData);
    console.log('Selected addons:', selectedAddons);
    console.log('Addon quantities:', addonQuantities);
    console.log('Food package quantity:', foodPackageQuantity);
    console.log('Addons cost:', formData.addonsCost);
    
    try {
      await conventionBookingsAPI.create(submissionData);
      showModal('Convention booking created successfully!', 'success', {
        onConfirm: () => {
          window.location.href = '/admin/dashboard/convention-bookings';
        }
      });
    } catch (error) {
      console.error('Error creating convention booking:', error);
      showModal('Failed to create booking. Please try again.', 'error');
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
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ ...formData, timeSlot: value });
                      setShowManualTime(value === 'custom');
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                    required
                  >
                    <option value="morning">🌅 Morning (8 AM - 12 PM)</option>
                    <option value="afternoon">☀️ Afternoon (12 PM - 5 PM)</option>
                    <option value="evening">🌆 Evening (5 PM - 10 PM)</option>
                    <option value="fullday">⏰ Full Day (8 AM - 10 PM)</option>
                    <option value="custom">⏱️ Custom Time (Manual Entry)</option>
                  </select>
                </div>

                {showManualTime && (
                  <>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Start Time *</label>
                      <input
                        type="time"
                        value={formData.customStartTime}
                        onChange={(e) => setFormData({ ...formData, customStartTime: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                        required={showManualTime}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">End Time *</label>
                      <input
                        type="time"
                        value={formData.customEndTime}
                        onChange={(e) => setFormData({ ...formData, customEndTime: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                        required={showManualTime}
                      />
                    </div>
                  </>
                )}

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

              {/* Availability Check */}
              {formData.hallId && formData.eventDate && formData.timeSlot && (
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
                  <button
                    type="button"
                    onClick={checkAvailability}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-bold shadow-lg"
                  >
                    🔍 Check Availability
                  </button>
                  
                  {availability && (
                    <div className={`mt-4 p-4 rounded-lg ${
                      availability.available 
                        ? 'bg-green-100 border-2 border-green-500 text-green-800' 
                        : 'bg-red-100 border-2 border-red-500 text-red-800'
                    }`}>
                      <div className="flex items-center gap-3 text-lg font-bold">
                        {availability.available ? '✅' : '❌'}
                        <span>
                          {availability.available 
                            ? `${availability.hall.name} is AVAILABLE!` 
                            : `${availability.hall.name} is NOT AVAILABLE`
                          }
                        </span>
                      </div>
                      <div className="mt-2 text-sm">
                        Date: {new Date(formData.eventDate).toLocaleDateString('en-GB')} | 
                        Time: {formData.timeSlot === 'custom' 
                          ? `${formData.customStartTime} - ${formData.customEndTime}` 
                          : formData.timeSlot
                        }
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!availability?.available}
              className={`w-full mt-6 px-6 py-4 rounded-lg font-bold ${
                availability?.available 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg cursor-pointer' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {availability?.available 
                ? 'Next: Food & Services →' 
                : 'Check Availability First'
              }
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
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-semibold">Qty:</label>
                          <input
                            type="number"
                            min="1"
                            value={foodPackageQuantity}
                            onChange={(e) => handleFoodQuantityChange(Number(e.target.value))}
                            onClick={(e) => e.stopPropagation()}
                            className="w-20 px-2 py-1 border-2 border-purple-300 rounded focus:ring-2 focus:ring-purple-600"
                          />
                        </div>
                        <div className="text-green-600 font-bold">
                          ✓ Total: ৳{formData.foodCost.toLocaleString()}
                        </div>
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
                          {selectedAddons.includes(service.id) && (
                            <div className="mt-3 flex items-center gap-2">
                              <label className="text-sm font-semibold">Qty:</label>
                              <input
                                type="number"
                                min="1"
                                value={addonQuantities[service.id] || 1}
                                onChange={(e) => handleAddonQuantityChange(service.id, Number(e.target.value))}
                                onClick={(e) => e.stopPropagation()}
                                className="w-20 px-2 py-1 border-2 border-purple-300 rounded focus:ring-2 focus:ring-purple-600"
                              />
                              <span className="text-sm font-bold text-green-600">
                                = ৳{(service.price * (addonQuantities[service.id] || 1)).toLocaleString()}
                              </span>
                            </div>
                          )}
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
                  <span>Food Package (Qty: {foodPackageQuantity}):</span>
                  <span className="font-bold">৳{formData.foodCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Add-ons ({selectedAddons.length} services):</span>
                  <span className="font-bold">৳{formData.addonsCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-purple-600 border-t-2 pt-2 mt-2">
                  <span>Subtotal:</span>
                  <span>৳{(Number(formData.hallRent) + Number(formData.foodCost) + Number(formData.addonsCost)).toLocaleString()}</span>
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
                  <span className="font-bold">৳{calculateSubtotal().toLocaleString('en-BD')}</span>
                </div>
                {calculateDiscountAmount() > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount ({formData.discountType === 'percentage' ? `${formData.discountPercentage}%` : 'Flat'}):</span>
                    <span className="font-bold">-৳{calculateDiscountAmount().toLocaleString()}</span>
                  </div>
                )}
                {formData.vatEnabled && (
                  <div className="flex justify-between text-orange-600">
                    <span>VAT ({formData.vatPercentage}%):</span>
                    <span className="font-bold">+৳{formData.vatAmount.toLocaleString()}</span>
                  </div>
                )}
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
              {/* Discount Section */}
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-4 text-red-700 flex items-center gap-2">
                  🎁 Discount Options
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Discount Type</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => {
                        setFormData({ ...formData, discountType: e.target.value as 'none' | 'percentage' | 'flat', discountPercentage: 0, discountAmount: 0 });
                        setTimeout(calculateTotal, 100);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                      <option value="none">No Discount</option>
                      <option value="percentage">Percentage Discount (%)</option>
                      <option value="flat">Flat/Fixed Discount (৳)</option>
                    </select>
                  </div>

                  {formData.discountType === 'percentage' && (
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Discount Percentage (%)</label>
                      <input
                        type="number"
                        value={formData.discountPercentage}
                        onChange={(e) => {
                          setFormData({ ...formData, discountPercentage: Number(e.target.value) });
                          setTimeout(calculateTotal, 100);
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="e.g., 10 for 10% off"
                      />
                      {formData.discountPercentage > 0 && (
                        <p className="text-sm text-red-600 mt-2">
                          Discount Amount: ৳{calculateDiscountAmount().toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {formData.discountType === 'flat' && (
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">Fixed Discount Amount (৳)</label>
                      <input
                        type="number"
                        value={formData.discountAmount}
                        onChange={(e) => {
                          setFormData({ ...formData, discountAmount: Number(e.target.value) });
                          setTimeout(calculateTotal, 100);
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        min="0"
                        max={calculateSubtotal()}
                        placeholder="e.g., 500 for ৳500 off"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* VAT/Tax Section */}
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.vatEnabled}
                      onChange={(e) => {
                        const vatEnabled = e.target.checked;
                        setFormData({ ...formData, vatEnabled });
                        setTimeout(calculateTotal, 100);
                      }}
                      className="mr-3 w-5 h-5"
                    />
                    <span className="text-lg font-semibold text-gray-800">📊 Include VAT/Tax ({formData.vatPercentage}%)</span>
                  </label>
                </div>
                
                {formData.vatEnabled && (
                  <div className="bg-white rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-gray-700">
                      <span>After Discount:</span>
                      <span className="font-semibold">৳{(calculateSubtotal() - calculateDiscountAmount()).toLocaleString('en-BD')}</span>
                    </div>
                    <div className="flex justify-between text-orange-600">
                      <span>VAT ({formData.vatPercentage}%):</span>
                      <span className="font-semibold">৳{formData.vatAmount.toLocaleString('en-BD')}</span>
                    </div>
                    <div className="border-t-2 border-gray-300 pt-2 flex justify-between text-green-700 text-lg font-bold">
                      <span>With VAT:</span>
                      <span>৳{formData.totalAmount.toLocaleString('en-BD')}</span>
                    </div>
                  </div>
                )}
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
