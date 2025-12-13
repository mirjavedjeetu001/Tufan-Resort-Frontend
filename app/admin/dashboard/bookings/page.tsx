'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useReactToPrint } from 'react-to-print';
import { InvoiceTemplate } from '@/components/InvoiceTemplate';

interface Booking {
  id: number;
  customerName: string;
  customerNid: string;
  customerEmail: string;
  customerPhone: string;
  customerWhatsapp?: string;
  customerAddress?: string;
  customerPhoto?: string;
  customerNidDocument?: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  numberOfGuests: number;
  totalAmount: number;
  extraCharges?: number;
  extraChargesDescription?: string;
  discountType?: string;
  discountPercentage?: number;
  discountAmount?: number;
  advancePayment: number;
  remainingPayment: number;
  paymentMethod: 'cash' | 'card' | 'mfs';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  additionalGuests?: Array<{
    name: string;
    nid: string;
    phone: string;
  }>;
  room: {
    id: number;
    roomNumber: string;
    name: string;
    type: string;
    pricePerNight: number;
  };
  createdAt: string;
}

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTimeEditModal, setShowTimeEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExtraChargesModal, setShowExtraChargesModal] = useState(false);
  const [timeData, setTimeData] = useState({ checkInTime: '', checkOutTime: '' });
  const [paymentData, setPaymentData] = useState({ amount: 0, method: 'cash' });
  const [extraChargesData, setExtraChargesData] = useState({ amount: 0, description: '' });
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings');
      setBookings(response.data.sort((a: Booking, b: Booking) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (id: number, status: Booking['status']) => {
    try {
      await api.put(`/bookings/${id}`, { status });
      fetchBookings();
      if (selectedBooking?.id === id) {
        setSelectedBooking({ ...selectedBooking, status });
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Error updating booking status');
    }
  };

  const deleteBooking = async (id: number) => {
    if (confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      try {
        await api.delete(`/bookings/${id}`);
        fetchBookings();
        setShowDetailsModal(false);
      } catch (error) {
        console.error('Error deleting booking:', error);
        alert('Error deleting booking');
      }
    }
  };

  const updateCheckInOutTime = async () => {
    if (!selectedBooking) return;
    try {
      await api.put(`/bookings/${selectedBooking.id}`, {
        checkInTime: timeData.checkInTime || selectedBooking.checkInTime,
        checkOutTime: timeData.checkOutTime || selectedBooking.checkOutTime,
      });
      fetchBookings();
      setShowTimeEditModal(false);
      setSelectedBooking({
        ...selectedBooking,
        checkInTime: timeData.checkInTime || selectedBooking.checkInTime,
        checkOutTime: timeData.checkOutTime || selectedBooking.checkOutTime,
      });
      alert('Check-in/Check-out time updated successfully!');
    } catch (error) {
      console.error('Error updating time:', error);
      alert('Error updating time');
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: selectedBooking ? `Invoice-BOOKING-${selectedBooking.id.toString().padStart(5, '0')}` : 'Invoice',
  });

  // Calculate grand total with discount
  const calculateGrandTotal = (booking: Booking): number => {
    // Ensure all values are numbers
    const baseAmount = Number(booking.totalAmount) || 0;
    const discountType = String(booking.discountType || 'none');
    const discountPercentage = Number(booking.discountPercentage) || 0;
    const discountAmountValue = Number(booking.discountAmount) || 0;
    const extraCharges = Number(booking.extraCharges) || 0;
    
    let discount = 0;
    if (discountType === 'percentage' && discountPercentage > 0) {
      discount = (baseAmount * discountPercentage) / 100;
    } else if (discountType === 'flat' && discountAmountValue > 0) {
      discount = discountAmountValue;
    }
    
    // Ensure discount doesn't exceed base amount
    discount = Math.min(discount, baseAmount);
    
    const afterDiscount = baseAmount - discount;
    const grandTotal = afterDiscount + extraCharges;
    
    console.log('calculateGrandTotal:', { baseAmount, discountType, discount, extraCharges, grandTotal });
    
    return grandTotal;
  };

  const recordPayment = async () => {
    if (!selectedBooking || paymentData.amount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    const newAdvancePayment = Number(selectedBooking.advancePayment) + Number(paymentData.amount);
    const grandTotal = calculateGrandTotal(selectedBooking);
    const newRemainingPayment = Math.max(0, grandTotal - newAdvancePayment);

    // Debug logging
    console.log('Payment Calculation Debug:', {
      booking: selectedBooking.id,
      baseAmount: selectedBooking.totalAmount,
      discountType: selectedBooking.discountType,
      discountPercentage: selectedBooking.discountPercentage,
      discountAmount: selectedBooking.discountAmount,
      extraCharges: selectedBooking.extraCharges,
      grandTotal,
      currentAdvance: selectedBooking.advancePayment,
      paymentAmount: paymentData.amount,
      newAdvancePayment,
      newRemainingPayment
    });

    // Ensure no NaN or null values
    if (isNaN(newAdvancePayment) || isNaN(newRemainingPayment) || isNaN(grandTotal)) {
      alert('Error calculating payment. Please refresh and try again.');
      console.error('NaN detected in payment calculation');
      return;
    }

    try {
      await api.put(`/bookings/${selectedBooking.id}`, {
        advancePayment: newAdvancePayment,
        remainingPayment: newRemainingPayment,
        paymentStatus: newRemainingPayment <= 0 ? 'paid' : newAdvancePayment > 0 ? 'partial' : 'pending',
        paymentMethod: paymentData.method,
      });
      
      fetchBookings();
      setShowPaymentModal(false);
      setPaymentData({ amount: 0, method: 'cash' });
      
      // Update selected booking
      setSelectedBooking({
        ...selectedBooking,
        advancePayment: newAdvancePayment,
        remainingPayment: newRemainingPayment,
        paymentStatus: newRemainingPayment <= 0 ? 'paid' : newAdvancePayment > 0 ? 'partial' : 'pending',
      });
      
      alert(`✅ Payment of ৳${paymentData.amount.toLocaleString()} recorded successfully!`);
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Error recording payment');
    }
  };

  const updateExtraCharges = async () => {
    if (!selectedBooking) return;

    const newExtraCharges = Number(selectedBooking.extraCharges || 0) + Number(extraChargesData.amount);
    const updatedBooking = { ...selectedBooking, extraCharges: newExtraCharges };
    const grandTotal = calculateGrandTotal(updatedBooking);
    const newRemainingPayment = Math.max(0, grandTotal - Number(selectedBooking.advancePayment));

    // Ensure no NaN values
    if (isNaN(newExtraCharges) || isNaN(newRemainingPayment) || isNaN(grandTotal)) {
      alert('Error calculating charges. Please refresh and try again.');
      return;
    }

    try {
      await api.put(`/bookings/${selectedBooking.id}`, {
        extraCharges: newExtraCharges,
        extraChargesDescription: selectedBooking.extraChargesDescription 
          ? `${selectedBooking.extraChargesDescription}; ${extraChargesData.description}` 
          : extraChargesData.description,
        remainingPayment: newRemainingPayment,
      });
      
      fetchBookings();
      setShowExtraChargesModal(false);
      setExtraChargesData({ amount: 0, description: '' });
      
      // Update selected booking
      setSelectedBooking({
        ...selectedBooking,
        extraCharges: newExtraCharges,
        extraChargesDescription: selectedBooking.extraChargesDescription 
          ? `${selectedBooking.extraChargesDescription}; ${extraChargesData.description}` 
          : extraChargesData.description,
        remainingPayment: newRemainingPayment,
      });
      
      alert(`✅ Extra charges of ৳${extraChargesData.amount.toLocaleString()} added successfully!`);
    } catch (error) {
      console.error('Error updating extra charges:', error);
      alert('Error updating extra charges');
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesSearch = 
      booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerPhone.includes(searchTerm) ||
      booking.room?.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    checkedIn: bookings.filter(b => b.status === 'checked_in').length,
    checkedOut: bookings.filter(b => b.status === 'checked_out').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    totalRevenue: bookings
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + b.totalAmount, 0),
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      checked_in: 'bg-green-100 text-green-800',
      checked_out: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentBadge = (status: string) => {
    const badges = {
      pending: 'bg-red-100 text-red-800',
      partial: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Bookings Management</h1>
          <p className="text-gray-600 mt-1">View and manage all room bookings</p>
        </div>
        <Link
          href="/admin/dashboard/premium-booking"
          className="bg-gradient-to-r from-green-600 to-yellow-500 hover:from-green-700 hover:to-yellow-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg transition-all transform hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Booking
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm opacity-90">Total Bookings</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold">{stats.confirmed}</div>
          <div className="text-sm opacity-90">Confirmed</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold">{stats.checkedIn}</div>
          <div className="text-sm opacity-90">Checked In</div>
        </div>
        <div className="bg-gradient-to-br from-gray-500 to-gray-600 text-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold">{stats.checkedOut}</div>
          <div className="text-sm opacity-90">Checked Out</div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold">{stats.cancelled}</div>
          <div className="text-sm opacity-90">Cancelled</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-xl shadow-lg">
          <div className="text-2xl font-bold">৳{stats.totalRevenue.toLocaleString()}</div>
          <div className="text-sm opacity-90">Total Revenue</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by name, phone, or room number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-primary to-accent text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Booking ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Room</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Guest</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Check-In</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Check-Out</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Payment</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">#{booking.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-800">{booking.room?.roomNumber || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{booking.room?.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-800">{booking.customerName}</div>
                    <div className="text-xs text-gray-500">{booking.customerPhone}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(booking.checkInDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(booking.checkOutDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-800">৳{booking.totalAmount.toLocaleString()}</div>
                    {booking.extraCharges && booking.extraCharges > 0 && (
                      <div className="text-xs text-orange-600">+৳{booking.extraCharges} extra</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPaymentBadge(booking.paymentStatus)}`}>
                      {booking.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(booking.status)}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowDetailsModal(true);
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Bookings Found</h3>
            <p className="text-gray-500 mb-4">No bookings match your search criteria</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8">
            <div className="sticky top-0 bg-gradient-to-r from-primary to-accent text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-2xl font-bold">Booking Details #{selectedBooking.id}</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Room Info */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Room Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Room Number</p>
                    <p className="font-bold text-lg text-blue-600">{selectedBooking.room?.roomNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Room Name</p>
                    <p className="font-semibold">{selectedBooking.room?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Room Type</p>
                    <p className="font-semibold">{selectedBooking.room?.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rate per Night</p>
                    <p className="font-semibold">৳{selectedBooking.room?.pricePerNight.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Check-in/Check-out with Time */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Check-in / Check-out Schedule
                  </h3>
                  <button
                    onClick={() => {
                      setTimeData({
                        checkInTime: selectedBooking.checkInTime || '',
                        checkOutTime: selectedBooking.checkOutTime || '',
                      });
                      setShowTimeEditModal(true);
                    }}
                    className="bg-white text-orange-600 px-3 py-1 rounded-lg text-sm font-semibold hover:bg-orange-50 border border-orange-300"
                  >
                    ⏰ Set Time
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm text-gray-600 mb-1">Check-In</p>
                    <p className="font-bold text-green-700">
                      📅 {new Date(selectedBooking.checkInDate).toLocaleDateString('en-GB')}
                    </p>
                    <p className="font-bold text-green-600">
                      ⏰ {selectedBooking.checkInTime || 'Time not set'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm text-gray-600 mb-1">Check-Out</p>
                    <p className="font-bold text-red-700">
                      📅 {new Date(selectedBooking.checkOutDate).toLocaleDateString('en-GB')}
                    </p>
                    <p className="font-bold text-red-600">
                      ⏰ {selectedBooking.checkOutTime || 'Time not set'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Guest Info */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Main Guest Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold">{selectedBooking.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">NID Number</p>
                    <p className="font-semibold">{selectedBooking.customerNid}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold">{selectedBooking.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">WhatsApp</p>
                    <p className="font-semibold">{selectedBooking.customerWhatsapp || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{selectedBooking.customerEmail}</p>
                  </div>
                  {selectedBooking.customerAddress && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-semibold">{selectedBooking.customerAddress}</p>
                    </div>
                  )}
                </div>

                {/* Guest Documents */}
                {(selectedBooking.customerPhoto || selectedBooking.customerNidDocument) && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Uploaded Documents:</p>
                    <div className="flex gap-3">
                      {selectedBooking.customerPhoto && (
                        <a
                          href={`http://localhost:3001${selectedBooking.customerPhoto}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white px-3 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 flex items-center gap-2 border border-blue-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          View Photo
                        </a>
                      )}
                      {selectedBooking.customerNidDocument && (
                        <a
                          href={`http://localhost:3001${selectedBooking.customerNidDocument}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white px-3 py-2 rounded-lg text-sm font-medium text-purple-600 hover:bg-purple-50 flex items-center gap-2 border border-purple-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          View NID Document
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Guests */}
              {selectedBooking.additionalGuests && selectedBooking.additionalGuests.length > 0 && (
                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Additional Guest Members ({selectedBooking.additionalGuests.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedBooking.additionalGuests.map((guest, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-cyan-200">
                        <p className="font-bold text-cyan-700 mb-1">Guest #{index + 2}</p>
                        <p className="text-sm"><span className="font-semibold">Name:</span> {guest.name}</p>
                        <p className="text-sm"><span className="font-semibold">NID:</span> {guest.nid}</p>
                        <p className="text-sm"><span className="font-semibold">Phone:</span> {guest.phone}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Booking Details */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Booking Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Check-In Date</p>
                    <p className="font-semibold">{new Date(selectedBooking.checkInDate).toLocaleDateString('en-GB')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Check-Out Date</p>
                    <p className="font-semibold">{new Date(selectedBooking.checkOutDate).toLocaleDateString('en-GB')}</p>
                  </div>
                  {selectedBooking.checkInTime && (
                    <div>
                      <p className="text-sm text-gray-600">Check-In Time</p>
                      <p className="font-semibold">{selectedBooking.checkInTime}</p>
                    </div>
                  )}
                  {selectedBooking.checkOutTime && (
                    <div>
                      <p className="text-sm text-gray-600">Check-Out Time</p>
                      <p className="font-semibold">{selectedBooking.checkOutTime}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Number of Guests</p>
                    <p className="font-semibold">{selectedBooking.numberOfGuests}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Booking Date</p>
                    <p className="font-semibold">{new Date(selectedBooking.createdAt).toLocaleDateString('en-GB')}</p>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Payment Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-gray-700">Base Amount:</span>
                    <span className="font-bold text-lg">৳{selectedBooking.totalAmount.toLocaleString()}</span>
                  </div>
                  {(() => {
                    const discountType = selectedBooking.discountType || 'none';
                    const discountPercentage = Number(selectedBooking.discountPercentage) || 0;
                    const discountAmountValue = Number(selectedBooking.discountAmount) || 0;
                    const baseAmount = Number(selectedBooking.totalAmount) || 0;
                    
                    let discount = 0;
                    if (discountType === 'percentage' && discountPercentage > 0) {
                      discount = (baseAmount * discountPercentage) / 100;
                    } else if (discountType === 'flat' && discountAmountValue > 0) {
                      discount = discountAmountValue;
                    }
                    
                    if (discount > 0) {
                      return (
                        <div className="flex justify-between items-center text-red-600 pb-2">
                          <span>Discount ({discountType === 'percentage' ? `${discountPercentage}%` : 'Flat'}):</span>
                          <span className="font-bold">-৳{discount.toLocaleString()}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {selectedBooking.extraCharges && selectedBooking.extraCharges > 0 && (
                    <>
                      <div className="flex justify-between items-center text-orange-600 pb-2">
                        <span>Extra Charges:</span>
                        <span className="font-bold">+৳{selectedBooking.extraCharges.toLocaleString()}</span>
                      </div>
                      {selectedBooking.extraChargesDescription && (
                        <div className="bg-white rounded p-2 text-sm">
                          <p className="text-gray-600 font-semibold mb-1">Extra Charges Details:</p>
                          <p className="text-gray-700">{selectedBooking.extraChargesDescription}</p>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-purple-200">
                    <span className="font-semibold text-gray-800">Grand Total:</span>
                    <span className="font-bold text-xl text-purple-600">
                      ৳{calculateGrandTotal(selectedBooking).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-purple-200">
                    <span className="text-gray-700">Advance Paid:</span>
                    <span className="font-bold text-green-600">৳{selectedBooking.advancePayment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-gray-700">Remaining:</span>
                    <span className="font-bold text-red-600">৳{selectedBooking.remainingPayment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-purple-200">
                    <span className="text-gray-700">Payment Method:</span>
                    <span className="font-semibold uppercase">{selectedBooking.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Payment Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPaymentBadge(selectedBooking.paymentStatus)}`}>
                      {selectedBooking.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Payment Action Buttons */}
                <div className="mt-4 pt-4 border-t border-purple-200 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    disabled={selectedBooking.remainingPayment <= 0}
                    className={`py-3 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                      selectedBooking.remainingPayment > 0
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    💰 Record Payment
                  </button>
                  <button
                    onClick={() => setShowExtraChargesModal(true)}
                    className="bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    ➕ Add Extra Charges
                  </button>
                </div>
              </div>

              {/* Status Management */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Update Booking Status</h3>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateBookingStatus(selectedBooking.id, status as Booking['status'])}
                      disabled={selectedBooking.status === status}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                        selectedBooking.status === status
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-primary hover:text-primary hover:shadow-md'
                      }`}
                    >
                      {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t">
                <button
                  onClick={handlePrint}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-lg transform hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Invoice
                </button>
                <button
                  onClick={() => deleteBooking(selectedBooking.id)}
                  className="bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Edit Modal */}
      {showTimeEditModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-xl font-bold">⏰ Set Check-in/Check-out Time</h2>
              <button
                onClick={() => setShowTimeEditModal(false)}
                className="text-white hover:bg-white/20 rounded-full p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Check-In Time
                  </label>
                  <input
                    type="time"
                    value={timeData.checkInTime}
                    onChange={(e) => setTimeData({ ...timeData, checkInTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Default: 2:00 PM (14:00)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Check-Out Time
                  </label>
                  <input
                    type="time"
                    value={timeData.checkOutTime}
                    onChange={(e) => setTimeData({ ...timeData, checkOutTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Default: 11:00 AM (11:00)
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={updateCheckInOutTime}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-lg font-semibold transition-all"
                >
                  Save Time
                </button>
                <button
                  onClick={() => setShowTimeEditModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Recording Modal */}
      {showPaymentModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-xl font-bold">💰 Record Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-white hover:bg-white/20 rounded-full p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">Guest:</span> {selectedBooking.customerName}
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">Already Paid:</span> <span className="text-green-600 font-bold">৳{selectedBooking.advancePayment.toLocaleString()}</span>
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Remaining Amount:</span> <span className="text-red-600 font-bold">৳{selectedBooking.remainingPayment.toLocaleString()}</span>
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Amount (৳)</label>
                  <input
                    type="number"
                    value={paymentData.amount || ''}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                    max={selectedBooking.remainingPayment}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-lg font-bold"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum: ৳{selectedBooking.remainingPayment.toLocaleString()}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
                  <select
                    value={paymentData.method}
                    onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="cash">💵 Cash</option>
                    <option value="card">💳 Card</option>
                    <option value="mfs">📱 Mobile Banking</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={recordPayment}
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-lg font-bold"
                >
                  ✅ Record Payment
                </button>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentData({ amount: 0, method: 'cash' });
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extra Charges Modal */}
      {showExtraChargesModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-xl font-bold">➕ Add Extra Charges</h2>
              <button onClick={() => setShowExtraChargesModal(false)} className="text-white hover:bg-white/20 rounded-full p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">Guest:</span> {selectedBooking.customerName}
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">Current Total:</span> <span className="text-blue-600 font-bold">৳{((selectedBooking.totalAmount || 0) + (selectedBooking.extraCharges || 0)).toLocaleString()}</span>
                </p>
                {selectedBooking.extraChargesDescription && (
                  <p className="text-xs text-gray-600 italic mt-2">
                    Previous charges: {selectedBooking.extraChargesDescription}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Charge Amount (৳)</label>
                  <input
                    type="number"
                    value={extraChargesData.amount || ''}
                    onChange={(e) => setExtraChargesData({ ...extraChargesData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-lg font-bold"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={extraChargesData.description}
                    onChange={(e) => setExtraChargesData({ ...extraChargesData, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    rows={3}
                    placeholder="E.g., Room service, Extra towels, Mini bar, etc."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={updateExtraCharges}
                  className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-3 rounded-lg font-bold"
                >
                  ✅ Add Charges
                </button>
                <button
                  onClick={() => {
                    setShowExtraChargesModal(false);
                    setExtraChargesData({ amount: 0, description: '' });
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Invoice Component for Printing */}
      <div className="hidden">
        {selectedBooking && <InvoiceTemplate ref={invoiceRef} booking={selectedBooking} />}
      </div>
    </div>
  );
}
