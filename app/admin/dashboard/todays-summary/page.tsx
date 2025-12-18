'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

interface Booking {
  id: number;
  customerName: string;
  customerPhone: string;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  totalAmount: number;
  room: {
    id: number;
    roomNumber: string;
    name: string;
    category: string;
  };
}

interface ConventionBooking {
  id: number;
  customerName: string;
  customerPhone: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  status: string;
  totalAmount: number;
  conventionHall: {
    id: number;
    name: string;
    capacity: number;
  };
}

export default function TodaysSummaryPage() {
  const [todaysBookings, setTodaysBookings] = useState<Booking[]>([]);
  const [todaysConventions, setTodaysConventions] = useState<ConventionBooking[]>([]);
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [allHalls, setAllHalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodaysSummary();
  }, []);

  const fetchTodaysSummary = async () => {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Fetch room bookings
      const bookingsRes = await api.get('/bookings');
      const todaysRooms = bookingsRes.data.filter((booking: Booking) => {
        const checkIn = booking.checkInDate.split('T')[0];
        return checkIn === today;
      });

      // Fetch convention bookings
      const conventionsRes = await api.get('/convention-bookings');
      const todaysHalls = conventionsRes.data.filter((booking: ConventionBooking) => {
        const eventDate = booking.eventDate.split('T')[0];
        return eventDate === today;
      });

      // Fetch all rooms
      const roomsRes = await api.get('/rooms');
      setAllRooms(roomsRes.data);

      // Fetch all convention halls
      const hallsRes = await api.get('/convention-hall');
      setAllHalls(hallsRes.data);

      setTodaysBookings(todaysRooms);
      setTodaysConventions(todaysHalls);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching today\'s summary:', error);
      setLoading(false);
    }
  };

  const getTotalRevenue = () => {
    const roomsRevenue = todaysBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);
    const hallsRevenue = todaysConventions.reduce((sum, b) => sum + Number(b.totalAmount), 0);
    return roomsRevenue + hallsRevenue;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl text-gray-600">Loading today's summary...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#006747] to-[#f4a425] rounded-2xl shadow-2xl p-8 mb-8 text-white">
          <h1 className="text-4xl font-bold mb-2">📅 Today's Summary</h1>
          <p className="text-lg opacity-90">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-1">Room Bookings</p>
                <p className="text-3xl font-bold text-blue-600">{todaysBookings.length}</p>
              </div>
              <div className="text-5xl">🏨</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-1">Convention Bookings</p>
                <p className="text-3xl font-bold text-purple-600">{todaysConventions.length}</p>
              </div>
              <div className="text-5xl">🎪</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">৳{getTotalRevenue().toLocaleString('en-BD')}</p>
              </div>
              <div className="text-5xl">💰</div>
            </div>
          </div>
        </div>

        {/* Room & Hall Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Room Status */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🚪</span> Room Status
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Rooms:</span>
                <span className="font-bold text-xl text-gray-800">{allRooms.length}</span>
              </div>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">Available:</span>
                  <span className="font-bold text-xl text-green-600">{allRooms.filter(r => r.status === 'available').length}</span>
                </div>
                {allRooms.filter(r => r.status === 'available').length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {allRooms.filter(r => r.status === 'available').map(r => (
                      <div key={r.id} className="bg-green-50 border border-green-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                        <div className="font-bold text-green-700 text-lg mb-1">Room {r.roomNumber}</div>
                        <div className="text-xs text-green-600">{r.roomType}</div>
                        <div className="text-xs text-green-700 font-semibold mt-1">৳{r.pricePerNight?.toLocaleString('en-BD')}/night</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">Booked:</span>
                  <span className="font-bold text-xl text-orange-600">{allRooms.filter(r => r.status === 'booked').length}</span>
                </div>
                {allRooms.filter(r => r.status === 'booked').length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {allRooms.filter(r => r.status === 'booked').map(r => (
                      <div key={r.id} className="bg-orange-50 border border-orange-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                        <div className="font-bold text-orange-700 text-lg mb-1">Room {r.roomNumber}</div>
                        <div className="text-xs text-orange-600">{r.roomType}</div>
                        <div className="text-xs text-orange-700 font-semibold mt-1">৳{r.pricePerNight?.toLocaleString('en-BD')}/night</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">Maintenance:</span>
                  <span className="font-bold text-xl text-red-600">{allRooms.filter(r => r.status === 'maintenance').length}</span>
                </div>
                {allRooms.filter(r => r.status === 'maintenance').length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {allRooms.filter(r => r.status === 'maintenance').map(r => (
                      <div key={r.id} className="bg-red-50 border border-red-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                        <div className="font-bold text-red-700 text-lg mb-1">Room {r.roomNumber}</div>
                        <div className="text-xs text-red-600">{r.roomType}</div>
                        <div className="text-xs text-red-700 font-semibold mt-1">৳{r.pricePerNight?.toLocaleString('en-BD')}/night</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Convention Hall Status */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🎪</span> Convention Hall Status
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Halls:</span>
                <span className="font-bold text-xl text-gray-800">{allHalls.length}</span>
              </div>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">Available Today:</span>
                  <span className="font-bold text-xl text-green-600">{allHalls.filter(h => !todaysConventions.some(c => c.conventionHall?.id === h.id)).length}</span>
                </div>
                {allHalls.filter(h => !todaysConventions.some(c => c.conventionHall?.id === h.id)).length > 0 && (
                  <div className="space-y-2">
                    {allHalls.filter(h => !todaysConventions.some(c => c.conventionHall?.id === h.id)).map(h => (
                      <div key={h.id} className="bg-green-50 border border-green-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                        <div className="font-bold text-green-700 text-base mb-1">{h.name}</div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-green-600">Capacity: {h.maxCapacity} guests</span>
                          <span className="text-green-700 font-semibold">৳{h.pricePerDay?.toLocaleString('en-BD')}/day</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">Booked Today:</span>
                  <span className="font-bold text-xl text-orange-600">{todaysConventions.length}</span>
                </div>
                {todaysConventions.length > 0 && (
                  <div className="space-y-2">
                    {todaysConventions.map(c => {
                      const hall = allHalls.find(h => h.id === c.conventionHall?.id);
                      return hall ? (
                        <div key={c.id} className="bg-orange-50 border border-orange-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                          <div className="font-bold text-orange-700 text-base mb-1">{hall.name}</div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-orange-600">Capacity: {hall.maxCapacity} guests</span>
                            <span className="text-orange-700 font-semibold">৳{hall.pricePerDay?.toLocaleString('en-BD')}/day</span>
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Room Bookings */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span>🏨</span> Today's Room Check-Ins ({todaysBookings.length})
          </h2>

          {todaysBookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🌟</div>
              <p className="text-xl">No room check-ins scheduled for today</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-100 to-blue-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Booking ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Room</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Guest Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Phone</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Check-Out</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todaysBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-200 hover:bg-blue-50 transition">
                      <td className="px-4 py-4 font-semibold text-blue-600">#{booking.id.toString().padStart(5, '0')}</td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-800">{booking.room.roomNumber}</div>
                        <div className="text-sm text-gray-500">{booking.room.name}</div>
                      </td>
                      <td className="px-4 py-4 font-medium text-gray-800">{booking.customerName}</td>
                      <td className="px-4 py-4 text-gray-600">{booking.customerPhone}</td>
                      <td className="px-4 py-4 text-gray-600">{new Date(booking.checkOutDate).toLocaleDateString('en-GB')}</td>
                      <td className="px-4 py-4 font-bold text-green-600">৳{Number(booking.totalAmount).toLocaleString('en-BD')}</td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'checked-in' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {booking.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Convention Bookings */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span>🎪</span> Today's Convention Events ({todaysConventions.length})
          </h2>

          {todaysConventions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🎭</div>
              <p className="text-xl">No convention events scheduled for today</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-100 to-purple-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Booking ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Hall</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Phone</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Time</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todaysConventions.map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-200 hover:bg-purple-50 transition">
                      <td className="px-4 py-4 font-semibold text-purple-600">#{booking.id.toString().padStart(5, '0')}</td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-800">{booking.conventionHall.name}</div>
                        <div className="text-sm text-gray-500">Capacity: {booking.conventionHall.capacity}</div>
                      </td>
                      <td className="px-4 py-4 font-medium text-gray-800">{booking.customerName}</td>
                      <td className="px-4 py-4 text-gray-600">{booking.customerPhone}</td>
                      <td className="px-4 py-4 text-gray-600">{booking.eventStartTime} - {booking.eventEndTime}</td>
                      <td className="px-4 py-4 font-bold text-green-600">৳{Number(booking.totalAmount).toLocaleString('en-BD')}</td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {booking.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <Link
            href="/admin/dashboard"
            className="inline-block bg-gradient-to-r from-[#006747] to-[#f4a425] text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition transform hover:scale-105"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
