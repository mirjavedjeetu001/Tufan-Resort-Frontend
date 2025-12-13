'use client';

import { useState, useEffect } from 'react';
import { api, conventionBookingsAPI } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';

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
  hallRent: number;
  discount: number;
  totalAmount: number;
  advancePayment: number;
  remainingPayment: number;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  notes: string;
  createdAt: string;
}

export default function ConventionBookingDetail() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<ConventionBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editingAddons, setEditingAddons] = useState(false);
  const [allAddonServices, setAllAddonServices] = useState<any[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    status: '',
    paymentStatus: '',
    advancePayment: 0,
    notes: '',
    discount: 0,
  });
  const [paymentForm, setPaymentForm] = useState({ amount: 0, method: 'cash', note: '' });

  useEffect(() => {
    if (params.id) {
      fetchBooking();
      fetchAddonServices();
    }
  }, [params.id]);

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
      
      setFormData({
        status: response.data.status,
        paymentStatus: response.data.paymentStatus,
        advancePayment: response.data.advancePayment,
        discount: response.data.discount || 0,
        notes: response.data.notes || '',
      });
    } catch (error) {
      console.error('Error fetching booking:', error);
      alert('Error loading booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddonToggle = (addonId: number) => {
    if (selectedAddons.includes(addonId)) {
      setSelectedAddons(selectedAddons.filter(id => id !== addonId));
    } else {
      setSelectedAddons([...selectedAddons, addonId]);
    }
  };

  const calculateAddonsCost = () => {
    return selectedAddons.reduce((sum, id) => {
      const addon = allAddonServices.find(s => s.id === id);
      return sum + (addon?.price || 0);
    }, 0);
  };

  const handleUpdateAddons = async () => {
    try {
      const addonsCost = calculateAddonsCost();
      const newTotal = booking!.hallRent + booking!.foodCost + addonsCost - formData.discount;
      
      const updateData = {
        selectedAddons: JSON.stringify(selectedAddons),
        addonsCost: addonsCost,
        totalAmount: newTotal,
        remainingPayment: newTotal - formData.advancePayment,
      };
      
      await api.put(`/convention-bookings/${params.id}`, updateData);
      alert('Add-ons updated successfully!');
      setEditingAddons(false);
      fetchBooking();
    } catch (error) {
      console.error('Error updating addons:', error);
      alert('Error updating add-ons');
    }
  };

  const handleUpdate = async () => {
    try {
      const currentTotal = booking!.totalAmount;
      const updateData = {
        ...formData,
        remainingPayment: currentTotal - formData.advancePayment,
      };
      
      await api.put(`/convention-bookings/${params.id}`, updateData);
      alert('Booking updated successfully!');
      setEditing(false);
      fetchBooking();
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Error updating booking');
    }
  };

  const handleAddPayment = async () => {
    if (!booking) return;
    if (paymentForm.amount <= 0) {
      alert('Enter a valid payment amount');
      return;
    }
    try {
      const res = await conventionBookingsAPI.addPayment(booking.id, {
        amount: paymentForm.amount,
        method: paymentForm.method,
        note: paymentForm.note,
      });
      alert('Payment recorded');
      setPaymentForm({ amount: 0, method: 'cash', note: '' });
      setBooking(res.data);
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Error adding payment');
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
              onClick={() => window.print()}
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
                      <label key={addon.id} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAddons.includes(addon.id)}
                          onChange={() => handleAddonToggle(addon.id)}
                          className="w-5 h-5"
                        />
                        <div className="flex-1">
                          <div className="font-semibold">{addon.name}</div>
                          <div className="text-sm text-gray-600">{addon.description}</div>
                        </div>
                        <div className="font-bold text-purple-600">৳{addon.price.toLocaleString()}</div>
                      </label>
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
                        try {
                          if (booking.selectedAddons && typeof booking.selectedAddons === 'string' && booking.selectedAddons.trim() !== '') {
                            parsedAddons = JSON.parse(booking.selectedAddons);
                          }
                        } catch (e) {}
                        setSelectedAddons(parsedAddons);
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
                        return addon ? (
                          <div key={addonId} className="flex justify-between">
                            <span>• {addon.name}</span>
                            <span>৳{addon.price.toLocaleString()}</span>
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
              
              {(editing || booking.discount > 0) && (
                <div className="flex justify-between items-center pb-2 border-b text-red-600">
                  <span>Discount</span>
                  {editing ? (
                    <input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                      className="w-32 px-3 py-1 border-2 rounded text-right font-bold"
                    />
                  ) : (
                    <span className="text-lg font-bold">-৳{Number(booking.discount).toLocaleString()}</span>
                  )}
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2 bg-purple-50 p-4 rounded-lg">
                <span className="text-xl font-bold text-purple-600">TOTAL</span>
                <span className="text-2xl font-bold text-purple-600">৳{Number(booking.totalAmount).toLocaleString()}</span>
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
                {editing ? (
                  <input
                    type="number"
                    value={formData.advancePayment}
                    onChange={(e) => setFormData({ ...formData, advancePayment: Number(e.target.value) })}
                    className="w-full mt-2 px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-600"
                  />
                ) : (
                  <p className="text-lg font-bold text-green-600">৳{Number(booking.advancePayment).toLocaleString()}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600">Remaining Payment</label>
                <p className="text-lg font-bold text-red-600">৳{Number(booking.remainingPayment || booking.totalAmount - booking.advancePayment).toLocaleString()}</p>
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
                      advancePayment: booking.advancePayment,
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
    </div>
  );
}
