'use client';
import { useEffect, useState } from 'react';
import { bookingsAPI, roomsAPI, api, conventionBookingsAPI } from '@/lib/api';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [rooms, setRooms] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  
  // Room Availability Search
  const [roomSearchDates, setRoomSearchDates] = useState({ checkIn: '', checkOut: '' });
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [showRoomResults, setShowRoomResults] = useState(false);
  const [roomBookings, setRoomBookings] = useState<any[]>([]);
  
  // Convention Hall Availability Search
  const [hallSearchDate, setHallSearchDate] = useState('');
  const [hallSearchSlot, setHallSearchSlot] = useState('morning');
  const [allHalls, setAllHalls] = useState<any[]>([]);
  const [hallBookings, setHallBookings] = useState<any[]>([]);
  const [showHallResults, setShowHallResults] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, roomsRes, bookingsRes, hallsRes] = await Promise.all([
        bookingsAPI.getMetrics(),
        roomsAPI.getAll(),
        bookingsAPI.getAll(),
        api.get('/convention-hall'),
      ]);
      
      setMetrics(metricsRes.data);
      setRooms(roomsRes.data);
      setRecentBookings(bookingsRes.data.slice(0, 5));
      setAllHalls(hallsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const searchRoomAvailability = async () => {
    if (!roomSearchDates.checkIn || !roomSearchDates.checkOut) {
      alert('Please select both check-in and check-out dates');
      return;
    }
    
    try {
      const [roomsResponse, bookingsResponse] = await Promise.all([
        api.get(`/rooms/available?checkIn=${roomSearchDates.checkIn}&checkOut=${roomSearchDates.checkOut}`),
        bookingsAPI.getByDateRange(roomSearchDates.checkIn, roomSearchDates.checkOut),
      ]);

      const activeBookings = bookingsResponse.data.filter((booking: any) => booking.status !== 'cancelled');

      setAvailableRooms(roomsResponse.data);
      setRoomBookings(activeBookings);
      setShowRoomResults(true);
    } catch (error) {
      console.error('Error searching room availability:', error);
      alert('Error searching room availability');
    }
  };

  const searchHallAvailability = async () => {
    if (!hallSearchDate) {
      alert('Please select a date');
      return;
    }
    
    try {
      const response = await conventionBookingsAPI.getAvailability(hallSearchDate, hallSearchSlot);
      setHallBookings(response.data);
      setShowHallResults(true);
    } catch (error) {
      console.error('Error searching hall availability:', error);
      alert('Error searching hall availability');
    }
  };

  const isHallBooked = (hallId: number) => {
    const bookingsForHall = hallBookings.filter((booking: any) => booking.hallId === hallId);
    console.log(`Checking hall ${hallId}, bookings:`, bookingsForHall);
    
    return hallBookings.some((booking: any) => 
      booking.hallId === hallId && 
      booking.status !== 'cancelled'
    );
  };

  const bookingStatusStyles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    checked_in: 'bg-blue-100 text-blue-800',
    checked_out: 'bg-gray-200 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const paymentStatusStyles: Record<string, string> = {
    pending: 'bg-red-100 text-red-800',
    partial: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    refunded: 'bg-gray-200 text-gray-800',
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB');
  };

  return (
    <div>
      <h1 className="text-4xl font-heading font-bold mb-8">Dashboard Overview</h1>

      {/* Metrics Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-white to-primary-50 p-6 rounded-lg shadow-md border-l-4 border-primary-500">
          <p className="text-gray-600 mb-2 flex items-center gap-2">
            <span>🏠</span> Total Rooms
          </p>
          <p className="text-3xl font-bold text-primary">{rooms.length}</p>
        </div>
        <div className="bg-gradient-to-br from-white to-accent-50 p-6 rounded-lg shadow-md border-l-4 border-accent-500">
          <p className="text-gray-600 mb-2 flex items-center gap-2">
            <span>📝</span> Total Bookings
          </p>
          <p className="text-3xl font-bold text-accent-600">{metrics?.totalBookings || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-white to-green-50 p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <p className="text-gray-600 mb-2 flex items-center gap-2">
            <span>✅</span> Confirmed
          </p>
          <p className="text-3xl font-bold text-green-600">{metrics?.confirmedBookings || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-white to-secondary-50 p-6 rounded-lg shadow-md border-l-4 border-secondary-500">
          <p className="text-gray-600 mb-2 flex items-center gap-2">
            <span>💰</span> Total Revenue
          </p>
          <p className="text-3xl font-bold text-secondary-600">৳{Number(metrics?.totalRevenue || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Room Availability Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span>🏨</span>
          Room Availability Search
        </h2>
        
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Check-In Date
            </label>
            <input
              type="date"
              value={roomSearchDates.checkIn}
              onChange={(e) => setRoomSearchDates({...roomSearchDates, checkIn: e.target.value})}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Check-Out Date
            </label>
            <input
              type="date"
              value={roomSearchDates.checkOut}
              onChange={(e) => setRoomSearchDates({...roomSearchDates, checkOut: e.target.value})}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={searchRoomAvailability}
              className="w-full px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-600 transition shadow-md hover:shadow-lg"
            >
              🔍 Search Rooms
            </button>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setShowRoomResults(false);
                setAvailableRooms([]);
                setRoomBookings([]);
                setRoomSearchDates({ checkIn: '', checkOut: '' });
              }}
              className="w-full px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Clear
            </button>
          </div>
        </div>

        {showRoomResults && (
          <div className="border-t pt-4">
            {availableRooms.length > 0 ? (
              <>
                <p className="text-green-600 font-semibold mb-4">
                  ✅ {availableRooms.length} room(s) available for selected dates
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Room Number</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Room Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Max Guests</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Price/Night</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {availableRooms.map((room: any) => (
                        <tr key={room.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono font-bold text-primary">{room.roomNumber}</td>
                          <td className="px-4 py-3 font-semibold">{room.name}</td>
                          <td className="px-4 py-3 capitalize">{room.type}</td>
                          <td className="px-4 py-3">{room.maxGuests} guests</td>
                          <td className="px-4 py-3 font-semibold text-accent">৳{Number(room.pricePerNight).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                              ✓ Available
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {roomBookings.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <span>🚫</span> Rooms Already Booked for These Dates
                    </h3>
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Booking Ref</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Room</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Guest & Contact</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Stay Dates</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Payment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {roomBookings.map((booking: any) => (
                            <tr key={booking.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-mono text-primary font-bold">#{booking.id}</td>
                              <td className="px-4 py-3">
                                <div className="font-semibold">{booking.room?.name || 'Room'}</div>
                                <div className="text-xs text-gray-500">Room #{booking.room?.roomNumber || booking.roomId}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-semibold">{booking.customerName}</div>
                                <div className="text-xs text-gray-500">📞 {booking.customerPhone}</div>
                                {booking.customerWhatsapp && (
                                  <div className="text-xs text-gray-500">💬 {booking.customerWhatsapp}</div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div>{formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}</div>
                                <div className="text-xs text-gray-500">Guests: {booking.numberOfGuests}</div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${bookingStatusStyles[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                                  {booking.status.replace('_', ' ').toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${paymentStatusStyles[booking.paymentStatus] || 'bg-gray-100 text-gray-700'}`}>
                                  {booking.paymentStatus.toUpperCase()}
                                </span>
                                <div className="text-xs text-gray-500 mt-1">
                                  Paid: ৳{Number(booking.advancePayment).toLocaleString()}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-red-600 font-semibold text-lg">❌ No rooms available for selected dates</p>
                <p className="text-gray-600 mt-2">All rooms are booked for this period. Please try different dates.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Convention Hall Availability Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span>🏛️</span>
          Convention Hall Availability Search
        </h2>
        
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Date
            </label>
            <input
              type="date"
              value={hallSearchDate}
              onChange={(e) => setHallSearchDate(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Time Slot</label>
            <select
              value={hallSearchSlot}
              onChange={(e) => setHallSearchSlot(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="fullday">Full Day</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={searchHallAvailability}
              className="w-full px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-600 transition shadow-md hover:shadow-lg"
            >
              🔍 Check Halls
            </button>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setShowHallResults(false);
                setHallBookings([]);
                setHallSearchDate('');
                setHallSearchSlot('morning');
              }}
              className="w-full px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Clear
            </button>
          </div>
        </div>

        {showHallResults && (
          <div className="border-t pt-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allHalls.map((hall: any) => {
                const booked = isHallBooked(hall.id);
                return (
                  <div
                    key={hall.id}
                    className={`border-2 rounded-xl p-6 transition-all ${
                      booked
                        ? 'border-red-300 bg-red-50'
                        : 'border-green-300 bg-green-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-800">{hall.name}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          booked
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {booked ? '❌ Booked' : '✓ Available'}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p className="flex items-center gap-2">
                        <span className="font-semibold">Capacity:</span>
                        <span>{hall.maxCapacity} people</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-semibold">Price/Day:</span>
                        <span className="text-accent font-bold">৳{Number(hall.pricePerDay || 0).toLocaleString()}</span>
                      </p>
                      {hall.description && (
                        <p className="text-gray-600 text-xs mt-2 line-clamp-2">
                          {hall.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
