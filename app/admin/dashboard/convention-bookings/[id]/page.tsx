'use client';

import { useState, useEffect, useRef } from 'react';
import { api, conventionBookingsAPI } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';
import { getRealTimeProgramStatus, isEventPassed, getRealTimePaymentStatus } from '@/utils/bookingStatus';

interface ConventionBooking {
  id: number;
  hallId: number;
  hall: { name: string; maxCapacity: number };
  customerName: string;
  customerNid: string;
  customerPhone: string;
  customerWhatsapp: string;
  customerEmail: string;
  customerAddress: string;
  organizationName: string;
  eventDate: string;
  timeSlot: string;
  eventType: string;
  eventDescription: string;
  numberOfGuests: number;
  foodPackageId: number;
  foodCost: number;
  selectedAddons: any;
  addonsCost: number;
  addonQuantities: any;
  hallRent: number;
  discount: number;
  discountType: string;
  discountValue: number;
  vatAmount: number;
  vatPercentage: number;
  totalAmount: number;
  advancePayment: number;
  remainingPayment: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  programStatus: string;
  notes: string;
  createdAt: string;
  payments?: any[];
}

export default function ConventionBookingDetail() {
  const { modalState, showModal, closeModal } = useModal();
  const params = useParams();
  const router = useRouter();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [booking, setBooking] = useState<ConventionBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editingAddons, setEditingAddons] = useState(false);
  const [allAddonServices, setAllAddonServices] = useState<any[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);
  const [addonQuantities, setAddonQuantities] = useState<Record<number, number>>({});
  const [resortVatPercentage, setResortVatPercentage] = useState(0);
  const [vatEnabled, setVatEnabled] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    paymentStatus: '',
    programStatus: '',
    advancePayment: 0,
    notes: '',
    discount: 0,
    discountType: 'flat',
    discountValue: 0,
    vatPercentage: 0,
    vatAmount: 0,
  });
  const [paymentForm, setPaymentForm] = useState({ amount: 0, method: 'cash', note: '' });

  const handlePrintInvoice = useReactToPrint({
    contentRef: invoiceRef,
  });

  useEffect(() => {
    if (params.id) {
      fetchBooking();
      fetchAddonServices();
      fetchResortSettings();
    }
  }, [params.id]);

  const fetchResortSettings = async () => {
    try {
      const response = await api.get('/resort-info');
      if (response.data) {
        setResortVatPercentage(response.data.vatPercentage || 0);
      }
    } catch (error) {
      console.error('Error fetching resort settings:', error);
    }
  };

  const fetchAddonServices = async () => {
    try {
      const response = await api.get('/addon-services/active');
      setAllAddonServices(response.data);
    } catch (error) {
      console.error('Error fetching addon services:', error);
    }
  };

  const fetchBooking = async () => {
    try {
      const response = await api.get(`/convention-bookings/${params.id}`);
      setBooking(response.data);
      
      // Parse selected addons
      let parsedAddons: number[] = [];
      try {
        if (response.data.selectedAddons && typeof response.data.selectedAddons === 'string' && response.data.selectedAddons.trim() !== '') {
          parsedAddons = JSON.parse(response.data.selectedAddons);
        } else if (Array.isArray(response.data.selectedAddons)) {
          parsedAddons = response.data.selectedAddons;
        }
      } catch (e) {
        console.error('Error parsing addons:', e);
      }
      setSelectedAddons(parsedAddons);
      
      // Parse addon quantities
      let parsedQuantities: Record<number, number> = {};
      try {
        if (response.data.addonQuantities && typeof response.data.addonQuantities === 'string') {
          parsedQuantities = JSON.parse(response.data.addonQuantities);
        }
      } catch (e) {
        console.error('Error parsing addon quantities:', e);
      }
      setAddonQuantities(parsedQuantities);
      
      setFormData({
        status: response.data.status,
        paymentStatus: response.data.paymentStatus,
        programStatus: response.data.programStatus || 'pending',
        advancePayment: response.data.advancePayment,
        discount: response.data.discount || 0,
        discountType: response.data.discountType || 'flat',
        discountValue: response.data.discountValue || 0,
        vatPercentage: response.data.vatPercentage || 0,
        vatAmount: response.data.vatAmount || 0,
        notes: response.data.notes || '',
      });
      
      // Set VAT enabled state based on booking data
      setVatEnabled(response.data.vatAmount > 0 || response.data.vatPercentage > 0);
    } catch (error) {
      console.error('Error fetching booking:', error);
      showModal('Error loading booking details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddonToggle = (addonId: number) => {
    if (selectedAddons.includes(addonId)) {
      setSelectedAddons(selectedAddons.filter(id => id !== addonId));
      // Remove quantity when unchecked
      const newQuantities = { ...addonQuantities };
      delete newQuantities[addonId];
      setAddonQuantities(newQuantities);
    } else {
      setSelectedAddons([...selectedAddons, addonId]);
      // Set default quantity to 1 when checked
      setAddonQuantities({ ...addonQuantities, [addonId]: 1 });
    }
  };

  const handleQuantityChange = (addonId: number, quantity: number) => {
    if (quantity < 1) return;
    setAddonQuantities({ ...addonQuantities, [addonId]: quantity });
  };

  const calculateAddonsCost = () => {
    return selectedAddons.reduce((sum, id) => {
      const addon = allAddonServices.find(s => s.id === id);
      const quantity = addonQuantities[id] || 1;
      return sum + ((addon?.price || 0) * quantity);
    }, 0);
  };

  const handleUpdateAddons = async () => {
    try {
      const addonsCost = calculateAddonsCost();
      const newTotal = booking!.hallRent + booking!.foodCost + addonsCost - formData.discount;
      
      const updateData = {
        selectedAddons: JSON.stringify(selectedAddons),
        addonQuantities: JSON.stringify(addonQuantities),
        addonsCost: addonsCost,
        totalAmount: newTotal,
        remainingPayment: newTotal - formData.advancePayment,
      };
      
      await api.put(`/convention-bookings/${params.id}`, updateData);
      showModal('Add-ons updated successfully!', 'success');
      setEditingAddons(false);
      fetchBooking();
    } catch (error) {
      console.error('Error updating addons:', error);
      showModal('Error updating add-ons', 'error');
    }
  };

  const handleUpdate = async () => {
    try {
      const currentTotal = booking!.totalAmount;
      const advancePayment = Number(formData.advancePayment);
      
      // Auto-calculate payment status
      let paymentStatus = formData.paymentStatus;
      if (advancePayment === 0) {
        paymentStatus = 'pending';
      } else if (advancePayment >= currentTotal) {
        paymentStatus = 'paid';
      } else if (advancePayment > 0 && advancePayment < currentTotal) {
        paymentStatus = 'partial';
      }
      
      const updateData = {
        ...formData,
        paymentStatus,
        remainingPayment: currentTotal - advancePayment,
      };
      
      await api.put(`/convention-bookings/${params.id}`, updateData);
      showModal('Booking updated successfully!', 'success');
      setEditing(false);
      fetchBooking();
    } catch (error) {
      console.error('Error updating booking:', error);
      showModal('Error updating booking', 'error');
    }
  };

  const handleUpdatePricing = async () => {
    try {
      if (!booking) return;
      
      // Calculate new totals
      const subtotal = Number(booking.hallRent || 0) + Number(booking.foodCost || 0) + Number(booking.addonsCost || 0);
      const discountAmount = formData.discountType === 'percentage' 
        ? subtotal * (Number(formData.discountValue || 0) / 100)
        : Number(formData.discountValue || 0);
      const afterDiscount = subtotal - discountAmount;
      const vatAmount = vatEnabled ? afterDiscount * (Number(formData.vatPercentage || 0) / 100) : 0;
      const totalAmount = afterDiscount + vatAmount;
      const remainingPayment = totalAmount - Number(booking.advancePayment || 0);
      
      // Auto-calculate payment status
      let paymentStatus = 'pending';
      if (booking.advancePayment === 0) {
        paymentStatus = 'pending';
      } else if (booking.advancePayment >= totalAmount) {
        paymentStatus = 'paid';
      } else if (booking.advancePayment > 0) {
        paymentStatus = 'partial';
      }
      
      const updateData = {
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        discount: discountAmount,
        vatPercentage: vatEnabled ? formData.vatPercentage : 0,
        vatAmount: vatAmount,
        totalAmount: totalAmount,
        remainingPayment: Math.max(0, remainingPayment),
        paymentStatus: paymentStatus,
      };
      
      await api.put(`/convention-bookings/${params.id}`, updateData);
      showModal('Discount & VAT updated successfully!', 'success');
      fetchBooking();
    } catch (error) {
      console.error('Error updating pricing:', error);
      showModal('Error updating pricing', 'error');
    }
  };

  const handleAddPayment = async () => {
    if (!booking) return;
    if (paymentForm.amount <= 0) {
      showModal('Please enter a valid payment amount', 'warning');
      return;
    }
    try {
      const res = await conventionBookingsAPI.addPayment(booking.id, {
        amount: paymentForm.amount,
        method: paymentForm.method,
        note: paymentForm.note,
      });
      showModal('Payment recorded successfully!', 'success');
      setPaymentForm({ amount: 0, method: 'cash', note: '' });
      setBooking(res.data);
    } catch (error) {
      console.error('Error adding payment:', error);
      showModal('Error adding payment', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-green-100 text-green-800 border-green-300',
      completed: 'bg-blue-100 text-blue-800 border-blue-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-red-100 text-red-800 border-red-300',
      partial: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      paid: 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getProgramStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800 border-gray-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      running: 'bg-orange-100 text-orange-800 border-orange-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading booking details...</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">Booking not found</div>
      </div>
    );
  }

  let addons: any[] = [];
  try {
    if (booking.selectedAddons && typeof booking.selectedAddons === 'string' && booking.selectedAddons.trim() !== '') {
      addons = JSON.parse(booking.selectedAddons);
    } else if (Array.isArray(booking.selectedAddons)) {
      addons = booking.selectedAddons;
    }
  } catch (error) {
    console.error('Error parsing selectedAddons:', error);
    addons = [];
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Convention Booking #{booking.id}</h1>
            <p className="text-purple-50">Complete booking details and management</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrintInvoice}
              className="px-6 py-3 bg-white/90 text-purple-700 rounded-lg font-bold hover:bg-white transition"
            >
              🧾 Print Invoice
            </button>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-white text-purple-600 rounded-lg font-bold hover:bg-purple-50 transition"
            >
              ← Back to List
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-purple-600 mb-4 flex items-center gap-2">
              <span>👤</span> Customer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-600">Name</label>
                <p className="text-lg font-bold">{booking.customerName}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Organization</label>
                <p className="text-lg">{booking.organizationName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Phone</label>
                <p className="text-lg">{booking.customerPhone}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">WhatsApp</label>
                <p className="text-lg">{booking.customerWhatsapp || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Email</label>
                <p className="text-lg">{booking.customerEmail || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">NID</label>
                <p className="text-lg">{booking.customerNid || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-600">Address</label>
                <p className="text-lg">{booking.customerAddress || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-purple-600 mb-4 flex items-center gap-2">
              <span>🎪</span> Event Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-600">Convention Hall</label>
                <p className="text-lg font-bold">{booking.hall?.name || `Hall ${booking.hallId}`}</p>
                <p className="text-sm text-gray-500">Capacity: {booking.hall?.maxCapacity || 'N/A'} guests</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Event Type</label>
                <p className="text-lg capitalize">{booking.eventType}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Event Date</label>
                <p className="text-lg font-bold">{new Date(booking.eventDate).toLocaleDateString('en-GB')}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Time Slot</label>
                <p className="text-lg capitalize">{booking.timeSlot}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Number of Guests</label>
                <p className="text-lg font-bold">{booking.numberOfGuests}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Booked On</label>
                <p className="text-lg">{new Date(booking.createdAt).toLocaleDateString('en-GB')}</p>
              </div>
              {booking.eventDescription && (
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-600">Event Description</label>
                  <p className="text-lg">{booking.eventDescription}</p>
                </div>
              )}
            </div>
          </div>

          {/* Cost Breakdown & Add-ons Management */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-purple-600 flex items-center gap-2">
                <span>💰</span> Invoice & Add-ons
              </h2>
              {!editingAddons && (
                <button
                  onClick={() => setEditingAddons(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                >
                  ➕ Manage Add-ons
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-700">Hall Rent</span>
                <span className="text-lg font-bold">৳{Number(booking.hallRent).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-700">Food Cost ({booking.numberOfGuests} guests)</span>
                <span className="text-lg font-bold">৳{Number(booking.foodCost).toLocaleString()}</span>
              </div>
              
              {editingAddons ? (
                <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50">
                  <h3 className="font-bold mb-3">Select Add-on Services:</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {allAddonServices.map(addon => (
                      <div key={addon.id} className="flex items-center gap-3 p-3 hover:bg-white rounded border-b">
                        <input
                          type="checkbox"
                          checked={selectedAddons.includes(addon.id)}
                          onChange={() => handleAddonToggle(addon.id)}
                          className="w-5 h-5 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="font-semibold">{addon.name}</div>
                          <div className="text-sm text-gray-600">{addon.description}</div>
                        </div>
                        {selectedAddons.includes(addon.id) && (
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-semibold text-gray-600">Qty:</label>
                            <input
                              type="number"
                              min="1"
                              value={addonQuantities[addon.id] || 1}
                              onChange={(e) => handleQuantityChange(addon.id, Number(e.target.value))}
                              className="w-16 px-2 py-1 border-2 border-purple-300 rounded text-center font-bold"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="text-xs text-gray-500">×</span>
                          </div>
                        )}
                        <div className="font-bold text-purple-600 min-w-[100px] text-right">
                          ৳{addon.price.toLocaleString()}
                          {selectedAddons.includes(addon.id) && addonQuantities[addon.id] > 1 && (
                            <div className="text-sm text-purple-700">
                              = ৳{(addon.price * (addonQuantities[addon.id] || 1)).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={handleUpdateAddons}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
                    >
                      💾 Save Add-ons
                    </button>
                    <button
                      onClick={() => {
                        setEditingAddons(false);
                        // Reset to current booking addons
                        let parsedAddons: number[] = [];
                        let parsedQuantities: Record<number, number> = {};
                        try {
                          if (booking.selectedAddons && typeof booking.selectedAddons === 'string' && booking.selectedAddons.trim() !== '') {
                            parsedAddons = JSON.parse(booking.selectedAddons);
                          }
                          if (booking.selectedAddons && typeof booking.selectedAddons === 'string') {
                            parsedQuantities = JSON.parse(booking.selectedAddons);
                          }
                        } catch (e) {}
                        setSelectedAddons(parsedAddons);
                        setAddonQuantities(parsedQuantities);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-gray-700">Add-on Services ({selectedAddons.length})</span>
                    <span className="text-lg font-bold">৳{Number(booking.addonsCost).toLocaleString()}</span>
                  </div>
                  {selectedAddons.length > 0 && (
                    <div className="ml-4 mt-2 space-y-1 text-sm text-gray-600">
                      {selectedAddons.map(addonId => {
                        const addon = allAddonServices.find(s => s.id === addonId);
                        const quantity = addonQuantities[addonId] || 1;
                        return addon ? (
                          <div key={addonId} className="flex justify-between">
                            <span>• {addon.name} {quantity > 1 ? `(×${quantity})` : ''}</span>
                            <span>৳{(addon.price * quantity).toLocaleString()}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-gray-700">Subtotal</span>
                <span className="text-lg font-bold">৳{(Number(booking.hallRent) + Number(booking.foodCost) + Number(booking.addonsCost)).toLocaleString()}</span>
              </div>
              
              <div className="border-2 border-red-100 rounded-lg p-3 my-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-red-700">💸 Discount</span>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="px-3 py-1 border-2 rounded font-semibold"
                  >
                    <option value="flat">Flat Amount (৳)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div className="flex justify-between items-center">
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-32 px-3 py-1 border-2 rounded text-right font-bold"
                    placeholder={formData.discountType === 'percentage' ? '0-100' : 'Amount'}
                  />
                  <span className="text-lg font-bold text-red-600">
                    -৳{(() => {
                      const subtotal = Number(booking.hallRent || 0) + Number(booking.foodCost || 0) + Number(booking.addonsCost || 0);
                      const discountAmount = formData.discountType === 'percentage' 
                        ? subtotal * (Number(formData.discountValue || 0) / 100)
                        : Number(formData.discountValue || 0);
                      return discountAmount.toLocaleString();
                    })()}
                  </span>
                </div>
              </div>
              
              <div className="border-2 border-green-100 rounded-lg p-3 my-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-green-700">📊 VAT</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vatEnabled}
                      onChange={(e) => {
                        setVatEnabled(e.target.checked);
                        if (e.target.checked) {
                          setFormData({ ...formData, vatPercentage: resortVatPercentage });
                        } else {
                          setFormData({ ...formData, vatPercentage: 0, vatAmount: 0 });
                        }
                      }}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-semibold">{vatEnabled ? 'Enabled' : 'Disabled'}</span>
                  </label>
                </div>
                {vatEnabled && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">VAT Percentage</span>
                      <input
                        type="number"
                        value={formData.vatPercentage}
                        onChange={(e) => setFormData({ ...formData, vatPercentage: Number(e.target.value) })}
                        className="w-32 px-3 py-1 border-2 rounded text-right font-bold"
                        placeholder="0-100"
                        max="100"
                        min="0"
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-600">VAT Amount</span>
                      <span className="text-lg font-bold text-green-600">
                        +৳{(() => {
                          const subtotal = Number(booking.hallRent || 0) + Number(booking.foodCost || 0) + Number(booking.addonsCost || 0);
                          const discountAmount = formData.discountType === 'percentage' 
                            ? subtotal * (Number(formData.discountValue || 0) / 100)
                            : Number(formData.discountValue || 0);
                          const afterDiscount = subtotal - discountAmount;
                          const vatAmount = afterDiscount * (Number(formData.vatPercentage || 0) / 100);
                          return vatAmount.toLocaleString();
                        })()}
                      </span>
                    </div>
                  </>
                )}
              </div>
              
              <button
                onClick={handleUpdatePricing}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 flex items-center justify-center gap-2"
              >
                💾 Save Discount & VAT
              </button>
              
              <div className="flex justify-between items-center pt-2 bg-purple-50 p-4 rounded-lg">
                <span className="text-xl font-bold text-purple-600">TOTAL</span>
                <span className="text-2xl font-bold text-purple-600">
                  ৳{(() => {
                    const subtotal = Number(booking.hallRent || 0) + Number(booking.foodCost || 0) + Number(booking.addonsCost || 0);
                    const discountAmount = formData.discountType === 'percentage' 
                      ? subtotal * (Number(formData.discountValue || 0) / 100)
                      : Number(formData.discountValue || 0);
                    const afterDiscount = subtotal - discountAmount;
                    const vatAmount = vatEnabled ? afterDiscount * (Number(formData.vatPercentage || 0) / 100) : 0;
                    const total = afterDiscount + vatAmount;
                    return total.toLocaleString();
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Status & Payment */}
        <div className="space-y-6">
          {/* Status Cards */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Status</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-600">Booking Status</label>
                {editing ? (
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full mt-2 px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                ) : (
                  <div className={`mt-2 px-4 py-2 rounded-lg border-2 font-bold text-center ${getStatusColor(booking.status)}`}>
                    {booking.status.toUpperCase()}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Payment Status</label>
                {editing ? (
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                    className="w-full mt-2 px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                ) : (
                  <div className={`mt-2 px-4 py-2 rounded-lg border-2 font-bold text-center ${getPaymentStatusColor(booking.paymentStatus)}`}>
                    {booking.paymentStatus.toUpperCase()}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Program Status</label>
                {editing ? (
                  <select
                    value={formData.programStatus}
                    onChange={(e) => setFormData({ ...formData, programStatus: e.target.value })}
                    className="w-full mt-2 px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="running">Running</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                ) : (
                  <div>
                    <div className={`mt-2 px-4 py-2 rounded-lg border-2 font-bold text-center ${getProgramStatusColor(booking.programStatus || 'pending')}`}>
                      {getRealTimeProgramStatus(booking).toUpperCase()}
                    </div>
                    {isEventPassed(booking.eventDate, booking.timeSlot) && (
                      <div className="mt-2 text-sm text-center">
                        <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded-full font-semibold">
                          ⏰ Event Time Passed
                        </span>
                      </div>
                    )}
                    {booking.programStatus !== 'completed' && isEventPassed(booking.eventDate, booking.timeSlot) && (
                      <div className="mt-2 text-sm text-center">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold">
                          🔄 Will Auto-Complete
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Payment Details</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-600">Payment Method</label>
                <p className="text-lg capitalize">{booking.paymentMethod}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Advance Payment</label>
                <p className="text-lg font-bold text-green-600">৳{Number(booking.advancePayment).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Remaining Payment</label>
                <p className="text-lg font-bold text-red-600">
                  ৳{(() => {
                    const subtotal = Number(booking.hallRent || 0) + Number(booking.foodCost || 0) + Number(booking.addonsCost || 0);
                    const discountAmount = formData.discountType === 'percentage' 
                      ? subtotal * (Number(formData.discountValue || 0) / 100)
                      : Number(formData.discountValue || 0);
                    const afterDiscount = subtotal - discountAmount;
                    const vatAmount = vatEnabled ? afterDiscount * (Number(formData.vatPercentage || 0) / 100) : 0;
                    const total = afterDiscount + vatAmount;
                    const remaining = total - Number(booking.advancePayment || 0);
                    return Math.max(0, remaining).toLocaleString();
                  })()}
                </p>
              </div>

              <div className="pt-3 border-t">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Payment History</h3>
                  <span className="text-xs text-gray-500">Newest first</span>
                </div>
                {booking.payments && booking.payments.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {[...booking.payments].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                        <div>
                          <div className="font-semibold">৳{Number(p.amount).toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="capitalize">{p.method}</div>
                          {p.note && <div className="text-xs text-gray-500">{p.note}</div>}
                        </div>
                      </div>
                    ))}
                    {Number(booking.discountValue || 0) > 0 && (
                      <div className="flex items-center justify-between bg-red-50 px-3 py-2 rounded border border-red-200">
                        <div>
                          <div className="font-semibold text-red-700">-৳{Number(booking.discountValue).toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{new Date(booking.updatedAt).toLocaleString()}</div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="text-red-700 font-semibold">💸 Discount</div>
                          <div className="text-xs text-gray-500 capitalize">{booking.discountType}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No payments recorded yet.</p>
                )}
              </div>

              <div className="pt-3 border-t">
                <h3 className="font-semibold mb-2">Record Payment</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="number"
                    min="0"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    className="px-3 py-2 border rounded"
                    placeholder="Amount"
                  />
                  <select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                    className="px-3 py-2 border rounded"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="mfs">Mobile Payment</option>
                  </select>
                  <input
                    type="text"
                    value={paymentForm.note}
                    onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                    className="px-3 py-2 border rounded"
                    placeholder="Note (optional)"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddPayment}
                  className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
                >
                  ➕ Add Payment
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Notes</h2>
            {editing ? (
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-600"
                rows={4}
                placeholder="Add notes..."
              />
            ) : (
              <p className="text-gray-700">{booking.notes || 'No notes'}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {editing ? (
              <>
                <button
                  onClick={handleUpdate}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition"
                >
                  💾 Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      status: booking.status,
                      paymentStatus: booking.paymentStatus,
                      programStatus: booking.programStatus || 'pending',
                      advancePayment: booking.advancePayment,
                      discount: booking.discount || 0,
                      notes: booking.notes || '',
                    });
                  }}
                  className="w-full px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition"
              >
                ✏️ Edit Booking
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hidden Print Invoice */}
      <div style={{ display: 'none' }}>
        <div ref={invoiceRef} className="p-8 bg-white">
          <style jsx>{`
            @media print {
              @page {
                size: A4;
                margin: 15mm;
              }
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          `}</style>

          {/* Invoice Header */}
          <div className="text-center mb-6 border-b-4 border-purple-600 pb-4">
            <h1 className="text-3xl font-bold text-purple-600">TUFAN RESORT</h1>
            <p className="text-sm text-gray-600">Convention Hall Booking Invoice</p>
            <p className="text-xs text-gray-500 mt-1">Phone: +880-1234-567890 | Email: info@tufanresort.com</p>
          </div>

          {/* Invoice Info */}
          <div className="flex justify-between mb-6">
            <div>
              <p className="font-bold">Invoice #: {booking.id}</p>
              <p className="text-sm">Date: {new Date().toLocaleDateString('en-GB')}</p>
              <p className="text-sm">Booking Date: {new Date(booking.createdAt).toLocaleDateString('en-GB')}</p>
            </div>
            <div className="text-right">
              <p className="font-bold">Status: {booking.status.toUpperCase()}</p>
              <p className="text-sm">Payment: {booking.paymentStatus.toUpperCase()}</p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2 border-b border-gray-300">Customer Information</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div><strong>Name:</strong> {booking.customerName}</div>
              <div><strong>Organization:</strong> {booking.organizationName || 'N/A'}</div>
              <div><strong>Phone:</strong> {booking.customerPhone}</div>
              <div><strong>Email:</strong> {booking.customerEmail || 'N/A'}</div>
              <div className="col-span-2"><strong>Address:</strong> {booking.customerAddress || 'N/A'}</div>
            </div>
          </div>

          {/* Event Details */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2 border-b border-gray-300">Event Details</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div><strong>Hall:</strong> {booking.hall?.name || `Hall ${booking.hallId}`}</div>
              <div><strong>Event Type:</strong> {booking.eventType}</div>
              <div><strong>Event Date:</strong> {new Date(booking.eventDate).toLocaleDateString('en-GB')}</div>
              <div><strong>Time Slot:</strong> {booking.timeSlot}</div>
              <div><strong>Number of Guests:</strong> {booking.numberOfGuests}</div>
              <div><strong>Hall Capacity:</strong> {booking.hall?.maxCapacity || 'N/A'}</div>
            </div>
          </div>

          {/* Invoice Table */}
          <table className="w-full mb-6 border-collapse">
            <thead>
              <tr className="bg-purple-600 text-white">
                <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Amount (৳)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Hall Rent</td>
                <td className="border border-gray-300 px-4 py-2 text-right">৳{Number(booking.hallRent).toLocaleString('en-BD')}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-2">Food Cost ({booking.numberOfGuests} guests)</td>
                <td className="border border-gray-300 px-4 py-2 text-right">৳{Number(booking.foodCost).toLocaleString('en-BD')}</td>
              </tr>
              {selectedAddons.length > 0 && selectedAddons.map(addonId => {
                const addon = allAddonServices.find(s => s.id === addonId);
                const quantity = addonQuantities[addonId] || 1;
                return addon ? (
                  <tr key={addonId}>
                    <td className="border border-gray-300 px-4 py-2">
                      {addon.name} {quantity > 1 ? `(×${quantity})` : ''}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">৳{(addon.price * quantity).toLocaleString('en-BD')}</td>
                  </tr>
                ) : null;
              })}
              <tr>
                <td className="border border-gray-300 px-4 py-2 font-bold">Subtotal</td>
                <td className="border border-gray-300 px-4 py-2 text-right font-bold">
                  ৳{(Number(booking.hallRent) + Number(booking.foodCost) + Number(booking.addonsCost)).toLocaleString('en-BD')}
                </td>
              </tr>
              {booking.discount > 0 && (
                <tr className="text-red-600">
                  <td className="border border-gray-300 px-4 py-2">Discount</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">-৳{Number(booking.discount).toLocaleString('en-BD')}</td>
                </tr>
              )}
              <tr className="bg-purple-100">
                <td className="border border-gray-300 px-4 py-2 font-bold text-lg">TOTAL</td>
                <td className="border border-gray-300 px-4 py-2 text-right font-bold text-lg">৳{Number(booking.totalAmount).toLocaleString('en-BD')}</td>
              </tr>
            </tbody>
          </table>

          {/* Payment Summary */}
          <div className="mb-6 border-t-2 border-gray-300 pt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Advance Payment:</span>
              <span className="font-bold text-green-600">৳{Number(booking.advancePayment).toLocaleString('en-BD')}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span>Remaining Payment:</span>
              <span className="font-bold text-red-600">৳{Number(booking.remainingPayment || booking.totalAmount - booking.advancePayment).toLocaleString('en-BD')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Payment Method:</span>
              <span className="capitalize">{booking.paymentMethod}</span>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="mb-6">
              <h3 className="font-bold text-sm mb-2">Notes:</h3>
              <p className="text-sm text-gray-700">{booking.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-8 pt-4 border-t border-gray-300">
            <p className="text-xs text-gray-600">Thank you for choosing Tufan Resort!</p>
            <p className="text-xs text-gray-500 mt-1">This is a computer-generated invoice.</p>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-700 font-semibold">Developed By Mir Javed Jeetu</p>
              <p className="text-xs text-gray-600 mt-1">Contact: 01811480222</p>
            </div>
          </div>
        </div>
      </div>

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
