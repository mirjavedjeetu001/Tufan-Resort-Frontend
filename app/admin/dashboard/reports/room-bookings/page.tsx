'use client';

import { useState, useEffect, useRef } from 'react';
import { bookingsAPI, roomsAPI } from '@/lib/api';
import { useReactToPrint } from 'react-to-print';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';

interface Room {
  id: number;
  name: string;
  type: string;
  pricePerNight: number;
}

interface Booking {
  id: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  totalAmount: number;
  status: string;
  specialRequests: string;
  room: Room;
  createdAt: string;
}

export default function RoomBookingsReport() {
  const { modalState, showModal, closeModal } = useModal();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [rooms, setRooms] = useState<Room[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bookings, startDate, endDate, statusFilter, roomFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, roomsRes] = await Promise.all([
        bookingsAPI.getAll(),
        roomsAPI.getAll()
      ]);
      setBookings(bookingsRes.data);
      setRooms(roomsRes.data);
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
      filtered = filtered.filter(b => new Date(b.checkInDate) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(b => new Date(b.checkInDate) <= new Date(endDate));
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    // Room filter
    if (roomFilter !== 'all') {
      filtered = filtered.filter(b => b.room.id === parseInt(roomFilter));
    }

    setFilteredBookings(filtered);
  };

  const calculateStats = () => {
    const totalBookings = filteredBookings.length;
    const totalRevenue = filteredBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
    const totalGuests = filteredBookings.reduce((sum, b) => sum + Number(b.numberOfGuests || 0), 0);
    
    const statusCounts = {
      pending: filteredBookings.filter(b => b.status === 'pending').length,
      confirmed: filteredBookings.filter(b => b.status === 'confirmed').length,
      checkedIn: filteredBookings.filter(b => b.status === 'checked-in').length,
      checkedOut: filteredBookings.filter(b => b.status === 'checked-out').length,
      cancelled: filteredBookings.filter(b => b.status === 'cancelled').length,
    };

    const roomWiseStats = rooms.map(room => {
      const roomBookings = filteredBookings.filter(b => b.room?.id === room.id);
      return {
        roomName: room.name,
        bookings: roomBookings.length,
        revenue: roomBookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0)
      };
    }).filter(stat => stat.bookings > 0);

    return { totalBookings, totalRevenue, totalGuests, statusCounts, roomWiseStats };
  };

  const stats = calculateStats();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      'checked-in': 'bg-green-100 text-green-800',
      'checked-out': 'bg-gray-100 text-gray-800',
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-blue-50/20 pb-12 space-y-6">
      {/* Premium Header with Animation */}
      <div className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl shadow-2xl p-8 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="relative flex justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm border border-white/30 shadow-lg">
                📊
              </div>
              <div>
                <h1 className="text-4xl font-bold drop-shadow-lg">Room Bookings Report</h1>
                <p className="text-green-100 mt-1 text-lg">Comprehensive analytics and business insights</p>
              </div>
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="group relative px-8 py-4 bg-white text-green-700 rounded-xl hover:bg-green-50 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center gap-3 font-bold border-2 border-white/50"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">🖨️</span>
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Premium Filters Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            🔍
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Advanced Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-green-300 bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked-in">Checked In</option>
              <option value="checked-out">Checked Out</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Room</label>
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:border-green-300 bg-white"
            >
              <option value="all">All Rooms</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </div>
        </div>
        {(startDate || endDate || statusFilter !== 'all' || roomFilter !== 'all') && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setStatusFilter('all');
              setRoomFilter('all');
            }}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg transform hover:scale-105 font-semibold"
          >
            ✖ Clear All Filters
          </button>
        )}
      </div>

      {/* Premium Statistics Cards with Animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <p className="text-5xl font-bold mt-2 drop-shadow-lg">৳{stats.totalRevenue.toLocaleString()}</p>
              <div className="mt-3 h-1 w-16 bg-white/30 rounded-full" />
            </div>
            <div className="text-6xl opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all">💰</div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-white transform hover:-translate-y-2 transition-all duration-300">
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

        <div className="group relative overflow-hidden bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-600 rounded-2xl shadow-2xl p-8 text-white transform hover:-translate-y-2 transition-all duration-300">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-semibold uppercase tracking-wider">Avg. Booking</p>
              <p className="text-5xl font-bold mt-2 drop-shadow-lg">
                ৳{stats.totalBookings > 0 ? Math.round(stats.totalRevenue / stats.totalBookings).toLocaleString() : 0}
              </p>
              <div className="mt-3 h-1 w-16 bg-white/30 rounded-full" />
            </div>
            <div className="text-6xl opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all">📈</div>
          </div>
        </div>
      </div>

      {/* Premium Status Breakdown */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            📈
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Status Distribution</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(stats.statusCounts).map(([status, count]) => (
            <div key={status} className="group relative overflow-hidden text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 hover:border-green-400 hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/0 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="relative text-4xl font-bold text-gray-800 group-hover:scale-110 transition-transform">{count}</p>
              <p className="relative text-sm text-gray-600 capitalize mt-2 font-semibold">{status.replace('-', ' ')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Premium Room-wise Performance */}
      {stats.roomWiseStats.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              🏠
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Room-wise Performance</h2>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full min-w-[500px]">
              <thead className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Room Name</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Bookings</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {stats.roomWiseStats.map((stat, index) => (
                  <tr key={index} className="hover:bg-green-50/50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 group-hover:text-green-700">{stat.roomName}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-800 text-right">{stat.bookings}</td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600 text-right">৳{stat.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Premium Bookings List */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              📋
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Detailed Bookings <span className="text-green-600">({filteredBookings.length})</span></h2>
          </div>
        </div>
        {filteredBookings.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No bookings found matching the selected filters</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Guest Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Room</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Check-in</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Check-out</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Guests</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">#{booking.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      <div>{booking.guestName}</div>
                      <div className="text-xs text-gray-500">{booking.guestPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">{booking.room.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{formatDate(booking.checkInDate)}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{formatDate(booking.checkOutDate)}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 text-center">{booking.numberOfGuests}</td>
                    <td className="px-4 py-3 text-sm text-gray-800 text-right font-semibold">
                      ৳{booking.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                        {booking.status}
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
            <h2 className="text-xl font-semibold text-gray-700 mt-2">Room Bookings Report</h2>
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
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="border border-gray-300 p-4 rounded">
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold">{stats.totalBookings}</p>
              </div>
              <div className="border border-gray-300 p-4 rounded">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">৳{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="border border-gray-300 p-4 rounded">
                <p className="text-sm text-gray-600">Total Guests</p>
                <p className="text-2xl font-bold">{stats.totalGuests}</p>
              </div>
              <div className="border border-gray-300 p-4 rounded">
                <p className="text-sm text-gray-600">Avg. Value</p>
                <p className="text-2xl font-bold">
                  ৳{stats.totalBookings > 0 ? Math.round(stats.totalRevenue / stats.totalBookings).toLocaleString() : 0}
                </p>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">Status Distribution</h3>
            <div className="grid grid-cols-5 gap-4">
              {Object.entries(stats.statusCounts).map(([status, count]) => (
                <div key={status} className="border border-gray-300 p-3 rounded text-center">
                  <p className="text-xl font-bold">{count}</p>
                  <p className="text-sm capitalize">{status.replace('-', ' ')}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Room-wise Performance */}
          {stats.roomWiseStats.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">Room-wise Performance</h3>
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Room Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Bookings</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.roomWiseStats.map((stat, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-4 py-2">{stat.roomName}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{stat.bookings}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">৳{stat.revenue.toLocaleString()}</td>
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
                  <th className="border border-gray-300 px-2 py-2 text-left">Guest</th>
                  <th className="border border-gray-300 px-2 py-2 text-left">Room</th>
                  <th className="border border-gray-300 px-2 py-2">Check-in</th>
                  <th className="border border-gray-300 px-2 py-2">Check-out</th>
                  <th className="border border-gray-300 px-2 py-2">Guests</th>
                  <th className="border border-gray-300 px-2 py-2 text-right">Amount</th>
                  <th className="border border-gray-300 px-2 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="border border-gray-300 px-2 py-2">#{booking.id}</td>
                    <td className="border border-gray-300 px-2 py-2">{booking.guestName}</td>
                    <td className="border border-gray-300 px-2 py-2">{booking.room.name}</td>
                    <td className="border border-gray-300 px-2 py-2">{formatDate(booking.checkInDate)}</td>
                    <td className="border border-gray-300 px-2 py-2">{formatDate(booking.checkOutDate)}</td>
                    <td className="border border-gray-300 px-2 py-2 text-center">{booking.numberOfGuests}</td>
                    <td className="border border-gray-300 px-2 py-2 text-right">৳{booking.totalAmount.toLocaleString()}</td>
                    <td className="border border-gray-300 px-2 py-2 capitalize">{booking.status}</td>
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
