'use client';

import { useState, useEffect, useRef } from 'react';
import { conventionBookingsAPI, conventionHallAPI } from '@/lib/api';
import { useReactToPrint } from 'react-to-print';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';

interface Hall {
  id: number;
  name: string;
  capacity: number;
  pricePerDay: number;
}

interface ConventionBooking {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventDate: string;
  eventType: string;
  numberOfGuests: number;
  timeSlot: string;
  totalAmount: number;
  advancePayment: number;
  paymentStatus: string;
  programStatus: string;
  specialRequirements: string;
  conventionHall: Hall;
  addOns: string;
  createdAt: string;
}

export default function ConventionBookingsReport() {
  const { modalState, showModal, closeModal } = useModal();
  const [bookings, setBookings] = useState<ConventionBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<ConventionBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [programStatusFilter, setProgramStatusFilter] = useState('all');
  const [hallFilter, setHallFilter] = useState('all');
  const [timeSlotFilter, setTimeSlotFilter] = useState('all');
  const [halls, setHalls] = useState<Hall[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bookings, startDate, endDate, paymentStatusFilter, programStatusFilter, hallFilter, timeSlotFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, hallsRes] = await Promise.all([
        conventionBookingsAPI.getAll(),
        conventionHallAPI.getAll()
      ]);
      setBookings(bookingsRes.data);
      setHalls(hallsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      showModal('Error', 'Error loading report data. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(b => new Date(b.eventDate) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(b => new Date(b.eventDate) <= new Date(endDate));
    }

    // Payment status filter
    if (paymentStatusFilter !== 'all') {
      filtered = filtered.filter(b => b.paymentStatus === paymentStatusFilter);
    }

    // Program status filter
    if (programStatusFilter !== 'all') {
      filtered = filtered.filter(b => b.programStatus === programStatusFilter);
    }

    // Hall filter
    if (hallFilter !== 'all') {
      filtered = filtered.filter(b => b.conventionHall.id === parseInt(hallFilter));
    }

    // Time slot filter
    if (timeSlotFilter !== 'all') {
      filtered = filtered.filter(b => b.timeSlot === timeSlotFilter);
    }

    setFilteredBookings(filtered);
  };

  const calculateStats = () => {
    const totalBookings = filteredBookings.length;
    const totalRevenue = filteredBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
    const totalAdvancePayment = filteredBookings.reduce((sum, b) => sum + Number(b.advancePayment || 0), 0);
    const totalGuests = filteredBookings.reduce((sum, b) => sum + Number(b.numberOfGuests || 0), 0);
    const pendingPayment = totalRevenue - totalAdvancePayment;
    
    const paymentStatusCounts = {
      pending: filteredBookings.filter(b => b.paymentStatus === 'pending').length,
      partial: filteredBookings.filter(b => b.paymentStatus === 'partial').length,
      paid: filteredBookings.filter(b => b.paymentStatus === 'paid').length,
    };

    const programStatusCounts = {
      pending: filteredBookings.filter(b => b.programStatus === 'pending').length,
      confirmed: filteredBookings.filter(b => b.programStatus === 'confirmed').length,
      running: filteredBookings.filter(b => b.programStatus === 'running').length,
      completed: filteredBookings.filter(b => b.programStatus === 'completed').length,
      cancelled: filteredBookings.filter(b => b.programStatus === 'cancelled').length,
    };

    const timeSlotCounts = {
      morning: filteredBookings.filter(b => b.timeSlot === 'morning').length,
      afternoon: filteredBookings.filter(b => b.timeSlot === 'afternoon').length,
      evening: filteredBookings.filter(b => b.timeSlot === 'evening').length,
      'full-day': filteredBookings.filter(b => b.timeSlot === 'full-day').length,
    };

    const eventTypeCounts: { [key: string]: number } = {};
    filteredBookings.forEach(b => {
      eventTypeCounts[b.eventType] = (eventTypeCounts[b.eventType] || 0) + 1;
    });

    const hallWiseStats = halls.map(hall => {
      const hallBookings = filteredBookings.filter(b => b.conventionHall?.id === hall.id);
      return {
        hallName: hall.name,
        bookings: hallBookings.length,
        revenue: hallBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0),
        guests: hallBookings.reduce((sum, b) => sum + Number(b.numberOfGuests || 0), 0)
      };
    }).filter(stat => stat.bookings > 0);

    return { 
      totalBookings, 
      totalRevenue, 
      totalAdvancePayment,
      pendingPayment,
      totalGuests, 
      paymentStatusCounts, 
      programStatusCounts,
      timeSlotCounts,
      eventTypeCounts,
      hallWiseStats 
    };
  };

  const stats = calculateStats();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const getPaymentStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-orange-100 text-orange-800',
      paid: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getProgramStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-gray-100 text-gray-800',
      confirmed: 'bg-blue-100 text-blue-800',
      running: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/20 pb-12 space-y-6">
      {/* Premium Header with Animation */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-fuchsia-600 rounded-2xl shadow-2xl p-8 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="relative flex justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm border border-white/30 shadow-lg">
                🏛️
              </div>
              <div>
                <h1 className="text-4xl font-bold drop-shadow-lg">Convention Hall Bookings Report</h1>
                <p className="text-purple-100 mt-1 text-lg">Comprehensive analytics and business insights</p>
              </div>
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="group relative px-8 py-4 bg-white text-purple-700 rounded-xl hover:bg-purple-50 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center gap-3 font-bold border-2 border-white/50"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">🖨️</span>
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Premium Filters Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            🔍
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Advanced Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Program Status</label>
            <select
              value={programStatusFilter}
              onChange={(e) => setProgramStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hall</label>
            <select
              value={hallFilter}
              onChange={(e) => setHallFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Halls</option>
              {halls.map(hall => (
                <option key={hall.id} value={hall.id}>{hall.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
            <select
              value={timeSlotFilter}
              onChange={(e) => setTimeSlotFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Slots</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="full-day">Full Day</option>
            </select>
          </div>
        </div>
        {(startDate || endDate || paymentStatusFilter !== 'all' || programStatusFilter !== 'all' || hallFilter !== 'all' || timeSlotFilter !== 'all') && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setPaymentStatusFilter('all');
              setProgramStatusFilter('all');
              setHallFilter('all');
              setTimeSlotFilter('all');
            }}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Premium Statistics Cards with Animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-8 text-white transform hover:-translate-y-2 transition-all duration-300">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider">Total Bookings</p>
              <p className="text-5xl font-bold mt-2 drop-shadow-lg">{stats.totalBookings}</p>
              <div className="mt-3 h-1 w-16 bg-white/30 rounded-full" />
            </div>
            <div className="text-6xl opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all">📊</div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 rounded-2xl shadow-2xl p-8 text-white transform hover:-translate-y-2 transition-all duration-300">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-semibold uppercase tracking-wider">Total Revenue</p>
              <p className="text-4xl font-bold mt-2 drop-shadow-lg">৳{stats.totalRevenue.toLocaleString()}</p>
              <div className="mt-3 h-1 w-16 bg-white/30 rounded-full" />
            </div>
            <div className="text-6xl opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all">💰</div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-600 to-yellow-600 rounded-2xl shadow-2xl p-8 text-white transform hover:-translate-y-2 transition-all duration-300">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-semibold uppercase tracking-wider">Advance Paid</p>
              <p className="text-4xl font-bold mt-2 drop-shadow-lg">৳{stats.totalAdvancePayment.toLocaleString()}</p>
              <div className="mt-3 h-1 w-16 bg-white/30 rounded-full" />
            </div>
            <div className="text-6xl opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all">💵</div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-gradient-to-br from-rose-500 via-red-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-white transform hover:-translate-y-2 transition-all duration-300">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-semibold uppercase tracking-wider">Pending Payment</p>
              <p className="text-4xl font-bold mt-2 drop-shadow-lg">৳{stats.pendingPayment.toLocaleString()}</p>
              <div className="mt-3 h-1 w-16 bg-white/30 rounded-full" />
            </div>
            <div className="text-6xl opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all">⏳</div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 via-purple-600 to-fuchsia-600 rounded-2xl shadow-2xl p-8 text-white transform hover:-translate-y-2 transition-all duration-300">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-semibold uppercase tracking-wider">Total Guests</p>
              <p className="text-5xl font-bold mt-2 drop-shadow-lg">{stats.totalGuests}</p>
              <div className="mt-3 h-1 w-16 bg-white/30 rounded-full" />
            </div>
            <div className="text-6xl opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all">👥</div>
          </div>
        </div>
      </div>

      {/* Payment Status Breakdown */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Payment Status Breakdown</h2>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(stats.paymentStatusCounts).map(([status, count]) => (
            <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">{count}</p>
              <p className="text-sm text-gray-600 capitalize mt-1">{status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Program Status Breakdown */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Program Status Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(stats.programStatusCounts).map(([status, count]) => (
            <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">{count}</p>
              <p className="text-sm text-gray-600 capitalize mt-1">{status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Time Slot Analysis */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Time Slot Analysis</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats.timeSlotCounts).map(([slot, count]) => (
            <div key={slot} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">{count}</p>
              <p className="text-sm text-gray-600 capitalize mt-1">{slot.replace('-', ' ')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Event Type Distribution */}
      {Object.keys(stats.eventTypeCounts).length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Event Type Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.eventTypeCounts).map(([type, count]) => (
              <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-800">{count}</p>
                <p className="text-sm text-gray-600 capitalize mt-1">{type}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hall-wise Performance */}
      {stats.hallWiseStats.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Hall-wise Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Hall Name</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Bookings</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Revenue</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total Guests</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.hallWiseStats.map((stat, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">{stat.hallName}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 text-right">{stat.bookings}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 text-right">৳{stat.revenue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 text-right">{stat.guests}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bookings List */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Booking Details ({filteredBookings.length})</h2>
        {filteredBookings.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No bookings found matching the selected filters</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Customer</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Event Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Time Slot</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Guests</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Advance</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Payment</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Program</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">#{booking.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      <div>{booking.customerName}</div>
                      <div className="text-xs text-gray-500">{booking.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 capitalize">{booking.eventType}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{formatDate(booking.eventDate)}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 capitalize">{booking.timeSlot.replace('-', ' ')}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 text-center">{booking.numberOfGuests}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 text-right font-semibold">
                      ৳{booking.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800 text-right">
                      ৳{booking.advancePayment.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusColor(booking.paymentStatus)}`}>
                        {booking.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getProgramStatusColor(booking.programStatus)}`}>
                        {booking.programStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print Template (Hidden) */}
      <div className="hidden">
        <div ref={printRef} className="p-8 bg-white">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Tufan Resort</h1>
            <h2 className="text-xl font-semibold text-gray-700 mt-2">Convention Hall Bookings Report</h2>
            <p className="text-gray-600 mt-1">Generated on: {new Date().toLocaleDateString()}</p>
            {(startDate || endDate) && (
              <p className="text-gray-600">
                Period: {startDate ? formatDate(startDate) : 'Start'} - {endDate ? formatDate(endDate) : 'End'}
              </p>
            )}
          </div>

          {/* Summary Statistics */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">Summary</h3>
            <div className="grid grid-cols-5 gap-4 mb-4">
              <div className="border border-gray-300 p-4 rounded">
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold">{stats.totalBookings}</p>
              </div>
              <div className="border border-gray-300 p-4 rounded">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-xl font-bold">৳{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="border border-gray-300 p-4 rounded">
                <p className="text-sm text-gray-600">Advance Paid</p>
                <p className="text-xl font-bold">৳{stats.totalAdvancePayment.toLocaleString()}</p>
              </div>
              <div className="border border-gray-300 p-4 rounded">
                <p className="text-sm text-gray-600">Pending Payment</p>
                <p className="text-xl font-bold">৳{stats.pendingPayment.toLocaleString()}</p>
              </div>
              <div className="border border-gray-300 p-4 rounded">
                <p className="text-sm text-gray-600">Total Guests</p>
                <p className="text-2xl font-bold">{stats.totalGuests}</p>
              </div>
            </div>
          </div>

          {/* Status Breakdowns */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">Payment Status</h3>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(stats.paymentStatusCounts).map(([status, count]) => (
                  <div key={status} className="border border-gray-300 p-3 rounded text-center">
                    <p className="text-xl font-bold">{count}</p>
                    <p className="text-sm capitalize">{status}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">Time Slots</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(stats.timeSlotCounts).map(([slot, count]) => (
                  <div key={slot} className="border border-gray-300 p-3 rounded text-center">
                    <p className="text-xl font-bold">{count}</p>
                    <p className="text-sm capitalize">{slot.replace('-', ' ')}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Program Status */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">Program Status</h3>
            <div className="grid grid-cols-5 gap-3">
              {Object.entries(stats.programStatusCounts).map(([status, count]) => (
                <div key={status} className="border border-gray-300 p-3 rounded text-center">
                  <p className="text-xl font-bold">{count}</p>
                  <p className="text-sm capitalize">{status}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hall-wise Performance */}
          {stats.hallWiseStats.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">Hall-wise Performance</h3>
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Hall Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Bookings</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Revenue</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Total Guests</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.hallWiseStats.map((stat, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-4 py-2">{stat.hallName}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{stat.bookings}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">৳{stat.revenue.toLocaleString()}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{stat.guests}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Detailed Bookings */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">Booking Details</h3>
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-2">ID</th>
                  <th className="border border-gray-300 px-2 py-2 text-left">Customer</th>
                  <th className="border border-gray-300 px-2 py-2 text-left">Event</th>
                  <th className="border border-gray-300 px-2 py-2">Date</th>
                  <th className="border border-gray-300 px-2 py-2">Slot</th>
                  <th className="border border-gray-300 px-2 py-2">Guests</th>
                  <th className="border border-gray-300 px-2 py-2 text-right">Total</th>
                  <th className="border border-gray-300 px-2 py-2 text-right">Advance</th>
                  <th className="border border-gray-300 px-2 py-2">Payment</th>
                  <th className="border border-gray-300 px-2 py-2">Program</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="border border-gray-300 px-2 py-2">#{booking.id}</td>
                    <td className="border border-gray-300 px-2 py-2">{booking.customerName}</td>
                    <td className="border border-gray-300 px-2 py-2 capitalize">{booking.eventType}</td>
                    <td className="border border-gray-300 px-2 py-2">{formatDate(booking.eventDate)}</td>
                    <td className="border border-gray-300 px-2 py-2 capitalize">{booking.timeSlot.replace('-', ' ')}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center">{booking.numberOfGuests}</td>
                    <td className="border border-gray-300 px-2 py-2 text-right">৳{booking.totalAmount.toLocaleString()}</td>
                    <td className="border border-gray-300 px-2 py-2 text-right">৳{booking.advancePayment.toLocaleString()}</td>
                    <td className="border border-gray-300 px-2 py-2 capitalize">{booking.paymentStatus}</td>
                    <td className="border border-gray-300 px-2 py-2 capitalize">{booking.programStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
