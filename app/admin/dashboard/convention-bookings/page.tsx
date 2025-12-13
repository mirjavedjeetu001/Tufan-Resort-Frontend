'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

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
}

export default function ConventionBookingsList() {
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
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this booking?')) {
      try {
        await api.delete(`/convention-bookings/${id}`);
        fetchBookings();
      } catch (error) {
        console.error('Error deleting booking:', error);
      }
    }
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
        <h1 className="text-3xl font-bold mb-2">🎪 Convention Hall Bookings</h1>
        <p className="text-purple-50">Manage all convention hall bookings</p>
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
          <table className="w-full">
            <thead className="bg-purple-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left">ID</th>
                <th className="px-6 py-4 text-left">Hall</th>
                <th className="px-6 py-4 text-left">Customer</th>
                <th className="px-6 py-4 text-left">Organization</th>
                <th className="px-6 py-4 text-left">Event Date</th>
                <th className="px-6 py-4 text-left">Event Type</th>
                <th className="px-6 py-4 text-left">Guests</th>
                <th className="px-6 py-4 text-left">Total</th>
                <th className="px-6 py-4 text-left">Payment</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
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
                      <div className="text-xs text-red-600">
                        Due: ৳{Number(booking.remainingPayment || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(booking.paymentStatus)}`}>
                        {booking.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
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
    </div>
  );
}
