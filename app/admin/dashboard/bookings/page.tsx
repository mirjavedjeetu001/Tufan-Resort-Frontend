'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useReactToPrint } from 'react-to-print';
import { InvoiceTemplate } from '@/components/InvoiceTemplate';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';

interface Booking {
  id: number;
  customerName: string;
  customerNid: string;
  customerEmail: string;
  customerPhone: string;
  customerWhatsapp?: string;
  customerAddress?: string;
  referenceName?: string;
  referencePhone?: string;
  createdBy?: {
    id: number;
    name: string;
    email: string;
  };
  customerPhoto?: string;
  customerNidDocument?: string;
  passportDocument?: string;
  visitingCard?: string;
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
  vatEnabled?: boolean;
  vatAmount?: number;
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
  const { modalState, showModal, closeModal } = useModal();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [resortInfo, setResortInfo] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [checkInDateFrom, setCheckInDateFrom] = useState('');
  const [checkInDateTo, setCheckInDateTo] = useState('');
  const [checkOutDateFrom, setCheckOutDateFrom] = useState('');
  const [checkOutDateTo, setCheckOutDateTo] = useState('');
  const [bookingDateFrom, setBookingDateFrom] = useState('');
  const [bookingDateTo, setBookingDateTo] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTimeEditModal, setShowTimeEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExtraChargesModal, setShowExtraChargesModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showVatModal, setShowVatModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ url: string; title: string } | null>(null);
  const [timeData, setTimeData] = useState({ checkInTime: '', checkOutTime: '' });
  const [paymentData, setPaymentData] = useState({ amount: 0, method: 'cash' });
  const [extraChargesData, setExtraChargesData] = useState({ amount: 0, description: '' });
  const [refundData, setRefundData] = useState({ amount: 0, method: 'cash', note: '' });
  const [vatData, setVatData] = useState({ enabled: false, amount: 0 });
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBookings();
    fetchResortInfo();
  }, []);

  const fetchResortInfo = async () => {
    try {
      const response = await api.get('/resort-info');
      setResortInfo(response.data);
    } catch (error) {
      console.error('Error fetching resort info:', error);
    }
  };

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
      showModal('Error updating booking status', 'error');
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
        showModal('Error deleting booking', 'error');
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
      showModal('Check-in/Check-out time updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating time:', error);
      showModal('Error updating time', 'error');
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: selectedBooking ? `Invoice-BOOKING-${selectedBooking.id.toString().padStart(5, '0')}` : 'Invoice',
  });

  // Calculate grand total with discount and VAT
  const calculateGrandTotal = (booking: Booking): number => {
    // Ensure all values are numbers
    const baseAmount = Number(booking.totalAmount) || 0;
    const discountType = String(booking.discountType || 'none');
    const discountPercentage = Number(booking.discountPercentage) || 0;
    const discountAmountValue = Number(booking.discountAmount) || 0;
    const extraCharges = Number(booking.extraCharges) || 0;
    const vatEnabled = booking.vatEnabled || false;
    const vatAmount = Number(booking.vatAmount) || 0;
    
    let discount = 0;
    if (discountType === 'percentage' && discountPercentage > 0) {
      discount = (baseAmount * discountPercentage) / 100;
    } else if (discountType === 'flat' && discountAmountValue > 0) {
      discount = discountAmountValue;
    }
    
    // Ensure discount doesn't exceed base amount
    discount = Math.min(discount, baseAmount);
    
    const afterDiscount = baseAmount - discount;
    const grandTotal = afterDiscount + extraCharges + (vatEnabled ? vatAmount : 0);
    
    console.log('calculateGrandTotal:', { baseAmount, discountType, discount, extraCharges, vatEnabled, vatAmount, grandTotal });
    
    return grandTotal;
  };

  const processRefund = async () => {
    if (!selectedBooking || refundData.amount <= 0) {
      showModal('Please enter a valid refund amount', 'warning');
      return;
    }

    if (refundData.amount > selectedBooking.advancePayment) {
      showModal('Refund amount cannot exceed advance payment', 'warning');
      return;
    }

    const newAdvancePayment = Number(selectedBooking.advancePayment) - Number(refundData.amount);

    try {
      await api.put(`/bookings/${selectedBooking.id}`, {
        advancePayment: newAdvancePayment,
        paymentStatus: newAdvancePayment <= 0 ? 'refunded' : 'partial',
      });

      setShowRefundModal(false);
      setRefundData({ amount: 0, method: 'cash', note: '' });
      fetchBookings();
      const updatedBooking = await api.get(`/bookings/${selectedBooking.id}`);
      setSelectedBooking(updatedBooking.data);
      showModal(`Refund of ৳${refundData.amount} processed successfully!`, 'success');
    } catch (error) {
      console.error('Error processing refund:', error);
      showModal('Error processing refund', 'error');
    }
  };

  const recordPayment = async () => {
    if (!selectedBooking || paymentData.amount <= 0) {
      showModal('Please enter a valid payment amount', 'warning');
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
      showModal('Error calculating payment. Please refresh and try again.', 'error');
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
      
      showModal(`Payment of ৳${paymentData.amount.toLocaleString()} recorded successfully!`, 'success');
    } catch (error) {
      console.error('Error recording payment:', error);
      showModal('Error recording payment', 'error');
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
      showModal('Error calculating charges. Please refresh and try again.', 'error');
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
      
      showModal(`Extra charges of ৳${extraChargesData.amount.toLocaleString()} added successfully!`, 'success');
    } catch (error) {
      console.error('Error updating extra charges:', error);
      showModal('Error updating extra charges', 'error');
    }
  };

  const updateVat = async () => {
    if (!selectedBooking) return;

    try {
      // Recalculate grand total and remaining payment
      const updatedBooking = { 
        ...selectedBooking, 
        vatEnabled: vatData.enabled,
        vatAmount: vatData.enabled ? vatData.amount : 0 
      };
      const grandTotal = calculateGrandTotal(updatedBooking);
      const newRemainingPayment = Math.max(0, grandTotal - Number(selectedBooking.advancePayment));

      // Single API call with all updated fields
      await api.put(`/bookings/${selectedBooking.id}`, {
        vatEnabled: vatData.enabled,
        vatAmount: vatData.enabled ? vatData.amount : 0,
        remainingPayment: newRemainingPayment,
      });

      setShowVatModal(false);
      setVatData({ enabled: false, amount: 0 });
      fetchBookings();

      // Update selected booking
      setSelectedBooking({
        ...selectedBooking,
        vatEnabled: vatData.enabled,
        vatAmount: vatData.enabled ? vatData.amount : 0,
        remainingPayment: newRemainingPayment,
      });

      showModal(vatData.enabled ? `VAT of ৳${vatData.amount.toLocaleString()} applied successfully!` : 'VAT removed successfully!', 'success');
    } catch (error) {
      console.error('Error updating VAT:', error);
      showModal('Error updating VAT', 'error');
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || booking.paymentStatus === paymentFilter;
    const matchesSearch = 
      booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerPhone.includes(searchTerm) ||
      booking.room?.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check-in date filter
    const checkInDate = new Date(booking.checkInDate);
    const matchesCheckInFrom = !checkInDateFrom || checkInDate >= new Date(checkInDateFrom);
    const matchesCheckInTo = !checkInDateTo || checkInDate <= new Date(checkInDateTo);
    
    // Check-out date filter
    const checkOutDate = new Date(booking.checkOutDate);
    const matchesCheckOutFrom = !checkOutDateFrom || checkOutDate >= new Date(checkOutDateFrom);
    const matchesCheckOutTo = !checkOutDateTo || checkOutDate <= new Date(checkOutDateTo);
    
    // Booking date filter
    const bookingDate = new Date(booking.createdAt);
    const matchesBookingFrom = !bookingDateFrom || bookingDate >= new Date(bookingDateFrom);
    const matchesBookingTo = !bookingDateTo || bookingDate <= new Date(bookingDateTo);
    
    return matchesStatus && matchesPayment && matchesSearch && 
           matchesCheckInFrom && matchesCheckInTo &&
           matchesCheckOutFrom && matchesCheckOutTo &&
           matchesBookingFrom && matchesBookingTo;
  });

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    checkedIn: bookings.filter(b => b.status === 'checked_in').length,
    checkedOut: bookings.filter(b => b.status === 'checked_out').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    totalRevenue: bookings
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + Number(b.totalAmount), 0),
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Bookings Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">View and manage all room bookings</p>
        </div>
        <Link
          href="/admin/dashboard/premium-booking"
          className="bg-gradient-to-r from-green-600 to-yellow-500 hover:from-green-700 hover:to-yellow-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg transition-all whitespace-nowrap text-sm sm:text-base"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden xs:inline">Create New Booking</span>
          <span className="xs:hidden">New</span>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
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
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters & Search
        </h3>
        
        {/* Search and Status Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">🔍 Search</label>
            <input
              type="text"
              placeholder="Name, phone, or room number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">📋 Booking Status</label>
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
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">💰 Payment Status</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {/* Date Filters */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-bold text-gray-700 mb-3">📅 Date Filters</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Check-in Date Filter */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <label className="block text-xs font-bold text-blue-800 mb-2">Check-In Date Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={checkInDateFrom}
                  onChange={(e) => setCheckInDateFrom(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="From"
                />
                <input
                  type="date"
                  value={checkInDateTo}
                  onChange={(e) => setCheckInDateTo(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="To"
                />
              </div>
            </div>

            {/* Check-out Date Filter */}
            <div className="bg-green-50 p-3 rounded-lg">
              <label className="block text-xs font-bold text-green-800 mb-2">Check-Out Date Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={checkOutDateFrom}
                  onChange={(e) => setCheckOutDateFrom(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-500"
                  placeholder="From"
                />
                <input
                  type="date"
                  value={checkOutDateTo}
                  onChange={(e) => setCheckOutDateTo(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-500"
                  placeholder="To"
                />
              </div>
            </div>

            {/* Booking Date Filter */}
            <div className="bg-purple-50 p-3 rounded-lg">
              <label className="block text-xs font-bold text-purple-800 mb-2">Booking Date Range</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={bookingDateFrom}
                  onChange={(e) => setBookingDateFrom(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-purple-300 rounded focus:ring-2 focus:ring-purple-500"
                  placeholder="From"
                />
                <input
                  type="date"
                  value={bookingDateTo}
                  onChange={(e) => setBookingDateTo(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-purple-300 rounded focus:ring-2 focus:ring-purple-500"
                  placeholder="To"
                />
              </div>
            </div>
          </div>
          
          {/* Clear Filters Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPaymentFilter('all');
                setCheckInDateFrom('');
                setCheckInDateTo('');
                setCheckOutDateFrom('');
                setCheckOutDateTo('');
                setBookingDateFrom('');
                setBookingDateTo('');
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear All Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-green-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap text-white">Serial/ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap text-white">Room Number</th>
                <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap text-white">Customer Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap text-white">Reference Person</th>
                <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap text-white">Booked By</th>
                <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap text-white">Check-In Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap text-white">Check-Out Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap text-white">Total Amount</th>
                <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap text-white">Payment Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap text-white">Booking Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap text-white">Actions</th>
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
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-800">{booking.referenceName || '—'}</div>
                    <div className="text-xs text-gray-500">{booking.referencePhone || ''}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-primary-600">{booking.createdBy?.name || 'Admin'}</div>
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowDetailsModal(true);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => deleteBooking(booking.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                        title="Delete Booking"
                      >
                        🗑️
                      </button>
                    </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-4 sm:my-8 max-h-[95vh] overflow-y-auto">
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
                {(selectedBooking.customerPhoto || selectedBooking.customerNidDocument || selectedBooking.passportDocument || selectedBooking.visitingCard) && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      📎 Uploaded Documents
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedBooking.customerPhoto && (
                        <button
                          onClick={() => {
                            setSelectedDocument({
                              url: `http://localhost:3001${selectedBooking.customerPhoto}`,
                              title: 'Customer Photo'
                            });
                            setShowDocumentModal(true);
                          }}
                          className="bg-blue-50 hover:bg-blue-100 px-4 py-3 rounded-lg text-sm font-medium text-blue-700 flex items-center gap-2 border-2 border-blue-200 transition-all"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          📷 Customer Photo
                        </button>
                      )}
                      {selectedBooking.customerNidDocument && (
                        <button
                          onClick={() => {
                            setSelectedDocument({
                              url: `http://localhost:3001${selectedBooking.customerNidDocument}`,
                              title: 'NID Document'
                            });
                            setShowDocumentModal(true);
                          }}
                          className="bg-purple-50 hover:bg-purple-100 px-4 py-3 rounded-lg text-sm font-medium text-purple-700 flex items-center gap-2 border-2 border-purple-200 transition-all"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                          </svg>
                          🆔 NID Document
                        </button>
                      )}
                      {selectedBooking.passportDocument && (
                        <button
                          onClick={() => {
                            setSelectedDocument({
                              url: `http://localhost:3001${selectedBooking.passportDocument}`,
                              title: 'Passport Document'
                            });
                            setShowDocumentModal(true);
                          }}
                          className="bg-green-50 hover:bg-green-100 px-4 py-3 rounded-lg text-sm font-medium text-green-700 flex items-center gap-2 border-2 border-green-200 transition-all"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          🛂 Passport
                        </button>
                      )}
                      {selectedBooking.visitingCard && (
                        <button
                          onClick={() => {
                            setSelectedDocument({
                              url: `http://localhost:3001${selectedBooking.visitingCard}`,
                              title: 'Visiting Card'
                            });
                            setShowDocumentModal(true);
                          }}
                          className="bg-orange-50 hover:bg-orange-100 px-4 py-3 rounded-lg text-sm font-medium text-orange-700 flex items-center gap-2 border-2 border-orange-200 transition-all"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          💳 Visiting Card
                        </button>
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
                  {selectedBooking.vatEnabled && selectedBooking.vatAmount && selectedBooking.vatAmount > 0 && (
                    <div className="flex justify-between items-center text-indigo-600 pb-2">
                      <span>VAT/Tax:</span>
                      <span className="font-bold">+৳{selectedBooking.vatAmount.toLocaleString()}</span>
                    </div>
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
                    <span className="font-bold text-red-600">৳{Math.max(0, calculateGrandTotal(selectedBooking) - selectedBooking.advancePayment).toLocaleString()}</span>
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
                <div className="mt-4 pt-4 border-t border-purple-200 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    disabled={Math.max(0, calculateGrandTotal(selectedBooking) - selectedBooking.advancePayment) <= 0 || selectedBooking.status === 'cancelled'}
                    className={`py-3 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                      Math.max(0, calculateGrandTotal(selectedBooking) - selectedBooking.advancePayment) > 0 && selectedBooking.status !== 'cancelled'
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
                    disabled={selectedBooking.status === 'cancelled'}
                    className={`${
                      selectedBooking.status === 'cancelled'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                    } py-3 rounded-lg font-semibold flex items-center justify-center gap-2`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    ➕ Extra Charges
                  </button>
                  <button
                    onClick={() => {
                      setVatData({
                        enabled: selectedBooking.vatEnabled || false,
                        amount: selectedBooking.vatAmount || 0
                      });
                      setShowVatModal(true);
                    }}
                    disabled={selectedBooking.status === 'cancelled'}
                    className={`${
                      selectedBooking.status === 'cancelled'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    } py-3 rounded-lg font-semibold flex items-center justify-center gap-2`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    📊 VAT/Tax
                  </button>
                </div>
                
                {/* Refund Button for Cancelled Bookings */}
                {selectedBooking.status === 'cancelled' && selectedBooking.advancePayment > 0 && selectedBooking.paymentStatus !== 'refunded' && (
                  <div className="mt-3">
                    <button
                      onClick={() => setShowRefundModal(true)}
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                      </svg>
                      🔙 Process Refund (৳{selectedBooking.advancePayment.toLocaleString()} available)
                    </button>
                  </div>
                )}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pt-4 border-t">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-6 py-4 flex justify-between items-center rounded-t-xl sticky top-0 z-10">
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
                  <span className="font-semibold">Remaining Amount:</span> <span className="text-red-600 font-bold">৳{Math.max(0, calculateGrandTotal(selectedBooking) - selectedBooking.advancePayment).toLocaleString()}</span>
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Amount (৳)</label>
                  <input
                    type="number"
                    value={paymentData.amount || ''}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                    max={Math.max(0, calculateGrandTotal(selectedBooking) - selectedBooking.advancePayment)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-lg font-bold"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum: ৳{Math.max(0, calculateGrandTotal(selectedBooking) - selectedBooking.advancePayment).toLocaleString()}</p>
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

      {/* Refund Modal */}
      {showRefundModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-xl font-bold">🔙 Process Refund</h2>
              <button onClick={() => setShowRefundModal(false)} className="text-white hover:bg-white/20 rounded-full p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">Guest:</span> {selectedBooking.customerName}
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">Status:</span> <span className="text-red-600 font-bold">Cancelled</span>
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">Advance Paid:</span> <span className="text-green-600 font-bold">৳{selectedBooking.advancePayment.toLocaleString()}</span>
                </p>
                <p className="text-xs text-red-600 mt-2">
                  ⚠️ This booking is cancelled. Process refund to return the advance payment.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Refund Amount (৳)</label>
                  <input
                    type="number"
                    value={refundData.amount || ''}
                    onChange={(e) => setRefundData({ ...refundData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-lg font-bold"
                    placeholder="0"
                    max={selectedBooking.advancePayment}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum refundable: ৳{selectedBooking.advancePayment.toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Refund Method</label>
                  <select
                    value={refundData.method}
                    onChange={(e) => setRefundData({ ...refundData, method: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                    <option value="cash">💵 Cash</option>
                    <option value="card">💳 Card</option>
                    <option value="mfs">📱 Mobile Banking</option>
                    <option value="bank_transfer">🏦 Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Refund Note (Optional)</label>
                  <textarea
                    value={refundData.note}
                    onChange={(e) => setRefundData({ ...refundData, note: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    rows={2}
                    placeholder="Reason for cancellation or refund notes..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={processRefund}
                  disabled={refundData.amount <= 0 || refundData.amount > selectedBooking.advancePayment}
                  className={`flex-1 py-3 rounded-lg font-bold ${
                    refundData.amount > 0 && refundData.amount <= selectedBooking.advancePayment
                      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  ✅ Process Refund
                </button>
                <button
                  onClick={() => {
                    setShowRefundModal(false);
                    setRefundData({ amount: 0, method: 'cash', note: '' });
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

      {/* VAT/Tax Modal */}
      {showVatModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-xl font-bold">📊 Manage VAT/Tax</h2>
              <button onClick={() => setShowVatModal(false)} className="text-white hover:bg-white/20 rounded-full p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">Guest:</span> {selectedBooking.customerName}
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">Base Amount:</span> <span className="text-indigo-600 font-bold">৳{selectedBooking.totalAmount.toLocaleString()}</span>
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">Current Grand Total:</span> <span className="text-indigo-600 font-bold">৳{calculateGrandTotal(selectedBooking).toLocaleString()}</span>
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="vatEnabled"
                    checked={vatData.enabled}
                    onChange={(e) => setVatData({ ...vatData, enabled: e.target.checked })}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                  <label htmlFor="vatEnabled" className="text-sm font-semibold text-gray-800 cursor-pointer">
                    Enable VAT/Tax
                  </label>
                </div>

                {vatData.enabled && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">VAT/Tax Amount (৳)</label>
                    <input
                      type="number"
                      value={vatData.amount || ''}
                      onChange={(e) => setVatData({ ...vatData, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-lg font-bold"
                      placeholder="0"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the VAT/tax amount to be added to the booking total
                    </p>
                  </div>
                )}

                {vatData.enabled && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">New Grand Total:</span>{' '}
                      <span className="text-green-600 font-bold text-lg">
                        ৳{(calculateGrandTotal(selectedBooking) - (selectedBooking.vatEnabled ? (selectedBooking.vatAmount || 0) : 0) + vatData.amount).toLocaleString()}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={updateVat}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white py-3 rounded-lg font-bold"
                >
                  ✅ Update VAT
                </button>
                <button
                  onClick={() => {
                    setShowVatModal(false);
                    setVatData({ enabled: false, amount: 0 });
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

      {/* Document Viewer Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-accent text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {selectedDocument.title}
              </h2>
              <button
                onClick={() => {
                  setShowDocumentModal(false);
                  setSelectedDocument(null);
                }}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 bg-gray-100 max-h-[calc(90vh-80px)] overflow-auto">
              {(() => {
                const url = selectedDocument.url.toLowerCase();
                const isPDF = url.endsWith('.pdf');
                const isImage = url.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/);
                
                if (isPDF) {
                  return (
                    <div className="bg-white rounded-lg overflow-hidden">
                      <object
                        data={selectedDocument.url}
                        type="application/pdf"
                        className="w-full h-[calc(90vh-160px)]"
                        style={{ minHeight: '600px' }}
                      >
                        <iframe
                          src={`${selectedDocument.url}#toolbar=1&navpanes=1&scrollbar=1`}
                          className="w-full h-[calc(90vh-160px)]"
                          style={{ minHeight: '600px', border: 'none' }}
                          title={selectedDocument.title}
                        >
                          <div className="p-8 text-center">
                            <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="font-semibold text-gray-700">Unable to display PDF</p>
                            <p className="text-sm text-gray-600 mt-2">Your browser doesn't support PDF viewing</p>
                            <a
                              href={selectedDocument.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                            >
                              Open in New Tab
                            </a>
                          </div>
                        </iframe>
                      </object>
                    </div>
                  );
                } else if (isImage) {
                  return (
                    <img
                      src={selectedDocument.url}
                      alt={selectedDocument.title}
                      className="w-full h-auto max-h-[calc(90vh-160px)] object-contain bg-white rounded-lg shadow-lg mx-auto"
                      onError={(e) => {
                        console.error('Image failed to load:', selectedDocument.url);
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLElement).parentElement;
                        if (parent) {
                          const errorDiv = document.createElement('div');
                          errorDiv.className = 'text-center text-red-600 p-8';
                          errorDiv.innerHTML = `
                            <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p class="font-semibold">Unable to load image</p>
                            <p class="text-sm text-gray-600 mt-2">Try downloading the file instead</p>
                          `;
                          parent.appendChild(errorDiv);
                        }
                      }}
                    />
                  );
                } else {
                  return (
                    <div className="bg-white rounded-lg p-8 text-center">
                      <svg className="w-20 h-20 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <p className="text-lg font-semibold text-gray-700 mb-2">Document Preview Not Available</p>
                      <p className="text-sm text-gray-600 mb-4">This file type cannot be previewed in the browser</p>
                      <p className="text-xs text-gray-500">{selectedDocument.url.split('/').pop()}</p>
                    </div>
                  );
                }
              })()}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
              <div className="flex gap-3">
                <a
                  href={selectedDocument.url}
                  download
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
                <a
                  href={selectedDocument.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open in New Tab
                </a>
              </div>
              <button
                onClick={() => {
                  setShowDocumentModal(false);
                  setSelectedDocument(null);
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Invoice Component for Printing */}
      <div className="hidden">
        {selectedBooking && <InvoiceTemplate ref={invoiceRef} booking={selectedBooking} resortInfo={resortInfo} />}
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
