'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';
import { getRealTimeProgramStatus, getRealTimePaymentStatus, formatPaymentDue, isEventPassed } from '@/utils/bookingStatus';

interface ConventionBooking {
  id: number;
  hallId: number;
  hall: { name: string };
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  organizationName: string;
  eventDate: string;
  timeSlot: string;
  eventType: string;
  numberOfGuests: number;
  totalAmount: number;
  advancePayment: number;
  remainingPayment: number;
  paymentStatus: string;
  status: string;
  programStatus: string;
}

export default function ConventionBookingsList() {
  const { modalState, showModal, closeModal } = useModal();
  const [bookings, setBookings] = useState<ConventionBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/convention-bookings');
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching convention bookings:', error);
      showModal('Error fetching convention bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    showModal(
      'Are you sure you want to delete this convention booking? This action cannot be undone.',
      'warning',
      {
        onConfirm: async () => {
          try {
            await api.delete(`/convention-bookings/${id}`);
            fetchBookings();
            showModal('Convention booking deleted successfully!', 'success');
          } catch (error) {
            console.error('Error deleting booking:', error);
            showModal('Error deleting convention booking', 'error');
          }
        },
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    );
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-red-100 text-red-800',
      partial: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getProgramStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800',
      confirmed: 'bg-blue-100 text-blue-800',
      running: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredBookings = bookings.filter(b => 
    filterStatus === 'all' || b.status === filterStatus
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl">Loading convention bookings...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 mb-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">🎪 Convention Hall Bookings</h1>
            <p className="text-purple-50">Manage all convention hall bookings</p>
          </div>
          <button
            onClick={() => window.location.href = '/admin/dashboard/premium-convention'}
            className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center gap-2"
          >
            ➕ New Booking
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="font-semibold">Filter by Status:</span>
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-semibold capitalize ${
                filterStatus === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-2xl font-bold text-purple-600">{bookings.length}</div>
          <div className="text-gray-600">Total Bookings</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-2xl font-bold text-green-600">
            {bookings.filter(b => b.status === 'confirmed').length}
          </div>
          <div className="text-gray-600">Confirmed</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-2xl font-bold text-yellow-600">
            {bookings.filter(b => b.status === 'pending').length}
          </div>
          <div className="text-gray-600">Pending</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-2xl font-bold text-blue-600">
            ৳{bookings.reduce((sum, b) => sum + Number(b.totalAmount), 0).toLocaleString()}
          </div>
          <div className="text-gray-600">Total Revenue</div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px]">
            <thead className="bg-purple-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left whitespace-nowrap">ID</th>
                <th className="px-6 py-4 text-left whitespace-nowrap">Hall</th>
                <th className="px-6 py-4 text-left whitespace-nowrap">Customer</th>
                <th className="px-6 py-4 text-left whitespace-nowrap">Organization</th>
                <th className="px-6 py-4 text-left whitespace-nowrap">Event Date</th>
                <th className="px-6 py-4 text-left whitespace-nowrap">Event Type</th>
                <th className="px-6 py-4 text-left whitespace-nowrap">Guests</th>
                <th className="px-6 py-4 text-left whitespace-nowrap">Total</th>
                <th className="px-6 py-4 text-left whitespace-nowrap">Payment</th>
                <th className="px-6 py-4 text-left whitespace-nowrap">Booking Status</th>
                <th className="px-6 py-4 text-left whitespace-nowrap">Program Status</th>
                <th className="px-6 py-4 text-left whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center text-gray-500">
                    No convention bookings found
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">#{booking.id}</td>
                    <td className="px-6 py-4 font-semibold">{booking.hall?.name || `Hall ${booking.hallId}`}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{booking.customerName}</div>
                      <div className="text-sm text-gray-500">{booking.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4">{booking.organizationName || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">
                        {new Date(booking.eventDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">{booking.timeSlot}</div>
                      {isEventPassed(booking.eventDate, booking.timeSlot) && (
                        <div className="text-xs text-blue-600 font-semibold mt-1">⏰ Event Passed</div>
                      )}
                    </td>
                    <td className="px-6 py-4 capitalize">{booking.eventType}</td>
                    <td className="px-6 py-4 text-center">{booking.numberOfGuests}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-purple-600">
                        ৳{Number(booking.totalAmount).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        Paid: ৳{Number(booking.advancePayment).toLocaleString()}
                      </div>
                      {Number(booking.remainingPayment || 0) > 0 ? (
                        <div className="text-xs font-bold">
                          <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded">
                            DUE: ৳{Number(booking.remainingPayment).toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs text-green-600 font-semibold">✓ Fully Paid</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const paymentInfo = getRealTimePaymentStatus(booking);
                        return (
                          <div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(paymentInfo.status)}`}>
                              {paymentInfo.displayText}
                            </span>
                            {paymentInfo.isDue && (
                              <div className="text-xs text-red-600 font-bold mt-1">⚠️ PAYMENT DUE</div>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const realStatus = getRealTimeProgramStatus(booking);
                        return (
                          <div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getProgramStatusColor(realStatus)}`}>
                              {realStatus}
                            </span>
                            {realStatus === 'completed' && booking.programStatus !== 'completed' && (
                              <div className="text-xs text-blue-600 mt-1">🔄 Auto-completed</div>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.location.href = `/admin/dashboard/convention-bookings/${booking.id}`}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(booking.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
