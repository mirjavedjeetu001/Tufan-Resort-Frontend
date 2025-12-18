'use client';
import { useEffect, useState } from 'react';
import { bookingsAPI, roomsAPI, api, conventionBookingsAPI } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';

export default function AdminDashboard() {
  const { modalState, showModal, closeModal } = useModal();
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
      showModal('Please select both check-in and check-out dates', 'warning');
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
      showModal('Error searching room availability', 'error');
    }
  };

  const searchHallAvailability = async () => {
    if (!hallSearchDate) {
      showModal('Please select a date', 'warning');
      return;
    }
    
    try {
      const response = await conventionBookingsAPI.getAvailability(hallSearchDate, hallSearchSlot);
      setHallBookings(response.data);
      setShowHallResults(true);
    } catch (error) {
      console.error('Error searching hall availability:', error);
      showModal('Error searching hall availability', 'error');
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

  const hallBookedCount = hallBookings.filter((booking: any) => booking.status !== 'cancelled').length;
  const hallAvailableCount = Math.max((allHalls.length || 0) - hallBookedCount, 0);

  return (
    <div className="relative overflow-hidden min-h-screen pt-6 md:pt-10 pb-12">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/8 to-secondary/10 blur-3xl opacity-80" aria-hidden />
      <div className="absolute inset-x-10 top-10 h-64 bg-gradient-to-r from-white/10 via-white/5 to-white/10 rounded-full blur-3xl" aria-hidden />
      <div className="relative space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-primary-900 via-primary-700 to-emerald-600 text-white shadow-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-white/10">
          <div>
            <p className="text-xs md:text-sm uppercase tracking-[0.35em] text-white/70">Control Center</p>
            <h1 className="text-3xl md:text-4xl font-heading font-bold mt-2 drop-shadow-md">Dashboard Overview</h1>
            <p className="text-white/80 mt-2">Realtime snapshots for rooms, bookings, and halls.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <span className="px-4 py-2 rounded-full bg-white/15 border border-white/20 text-sm font-semibold shadow-sm backdrop-blur">Live</span>
            <span className="px-4 py-2 rounded-full bg-white/15 border border-white/20 text-sm font-semibold shadow-sm backdrop-blur">Secure</span>
            <span className="px-4 py-2 rounded-full bg-white/15 border border-white/20 text-sm font-semibold shadow-sm backdrop-blur">Up to date</span>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
          {[{
            label: 'Total Rooms',
            value: rooms.length,
            accent: 'from-primary-500 via-primary-600 to-primary-700',
            icon: '🏠',
          }, {
            label: 'Total Bookings',
            value: metrics?.totalBookings || 0,
            accent: 'from-accent-500 via-accent-600 to-accent-700',
            icon: '📝',
          }, {
            label: 'Confirmed',
            value: metrics?.confirmedBookings || 0,
            accent: 'from-green-500 via-green-600 to-green-700',
            icon: '✅',
          }, {
            label: 'Total Revenue',
            value: `৳${Number(metrics?.totalRevenue || 0).toLocaleString()}`,
            accent: 'from-secondary-500 via-secondary-600 to-secondary-700',
            icon: '💰',
          }].map((card) => (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.accent} text-white shadow-xl p-5 border border-white/10 transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/80 text-sm flex items-center gap-2">{card.icon} {card.label}</p>
                  <p className="text-3xl font-bold mt-2 drop-shadow-sm">{card.value}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg backdrop-blur">★</div>
              </div>
              <div className="mt-4 h-1 rounded-full bg-white/20">
                <div className="h-1 rounded-full bg-white/80 w-3/4" />
              </div>
            </div>
          ))}
        </div>

        {/* Reports Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/admin/dashboard/reports/room-bookings">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl p-6 border border-white/10 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl cursor-pointer group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.2),transparent_50%)]" aria-hidden />
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">📊</span>
                    <h3 className="text-2xl font-bold">Room Bookings Report</h3>
                  </div>
                  <p className="text-white/90 text-sm mb-4">
                    View comprehensive room booking analytics with filters, statistics, and export options
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold">Date Range Filter</span>
                    <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold">Status Breakdown</span>
                    <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold">Room-wise Stats</span>
                    <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold">Print Ready</span>
                  </div>
                </div>
                <div className="text-4xl group-hover:scale-110 transition-transform">→</div>
              </div>
            </div>
          </Link>

          <Link href="/admin/dashboard/reports/convention-bookings">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-xl p-6 border border-white/10 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl cursor-pointer group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.2),transparent_50%)]" aria-hidden />
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">📈</span>
                    <h3 className="text-2xl font-bold">Convention Hall Report</h3>
                  </div>
                  <p className="text-white/90 text-sm mb-4">
                    View comprehensive convention hall analytics with payment tracking, program status, and insights
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold">Payment Status</span>
                    <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold">Program Tracking</span>
                    <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold">Time Slot Analysis</span>
                    <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold">Print Ready</span>
                  </div>
                </div>
                <div className="text-4xl group-hover:scale-110 transition-transform">→</div>
              </div>
            </div>
          </Link>
        </div>

      {/* Room Availability Search */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/90 via-primary-50/70 to-white/90 border border-primary/10 shadow-xl p-6 mb-8 backdrop-blur">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,103,71,0.08),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(244,164,37,0.08),transparent_25%),radial-gradient(circle_at_50%_80%,rgba(211,47,47,0.08),transparent_30%)]" aria-hidden />
        <div className="relative flex items-center justify-between gap-4 mb-6 flex-wrap">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <span className="text-3xl">🏨</span>
            <span>
              Room Availability Search
              <p className="text-sm font-normal text-gray-600">Quickly check open rooms between two dates.</p>
            </span>
          </h2>
          <div className="flex gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-white/70 text-primary-700 text-sm font-semibold border border-primary/10 shadow-sm">Live lookup</span>
            <span className="px-3 py-1 rounded-full bg-white/70 text-secondary-700 text-sm font-semibold border border-secondary/10 shadow-sm">Accurate totals</span>
          </div>
        </div>
        
        <div className="relative grid md:grid-cols-4 gap-4 mb-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Check-In Date
            </label>
            <input
              type="date"
              value={roomSearchDates.checkIn}
              onChange={(e) => setRoomSearchDates({...roomSearchDates, checkIn: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-primary/20 bg-white/80 text-gray-900 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="mm/dd/yyyy"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Check-Out Date
            </label>
            <input
              type="date"
              value={roomSearchDates.checkOut}
              onChange={(e) => setRoomSearchDates({...roomSearchDates, checkOut: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-primary/20 bg-white/80 text-gray-900 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="mm/dd/yyyy"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={searchRoomAvailability}
              className="w-full px-6 py-3 rounded-xl font-semibold text-white shadow-lg bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 hover:shadow-xl transition"
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
              className="w-full px-6 py-3 rounded-xl font-semibold text-gray-700 bg-white/80 border border-gray-200 hover:bg-gray-100 transition shadow-sm"
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
                <div className="overflow-x-auto rounded-xl border border-primary/10 shadow-sm bg-white/70 backdrop-blur">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 text-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Room #</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Room</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Guests</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Price/Night</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {availableRooms.map((room: any) => (
                        <tr key={room.id} className="hover:bg-primary/5 transition">
                          <td className="px-4 py-3 font-mono font-bold text-primary">{room.roomNumber}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900">{room.name}</td>
                          <td className="px-4 py-3 capitalize text-gray-700">{room.type}</td>
                          <td className="px-4 py-3 text-gray-700">{room.maxGuests} guests</td>
                          <td className="px-4 py-3 font-semibold text-accent">৳{Number(room.pricePerNight).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                              ✓ Available
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/admin/dashboard/premium-booking?roomId=${room.id}&checkIn=${roomSearchDates.checkIn}&checkOut=${roomSearchDates.checkOut}`}
                              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg font-medium text-sm"
                            >
                              📅 Book Now
                            </Link>
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
                    <div className="overflow-x-auto rounded-xl border border-gray/10 shadow-sm bg-white/70 backdrop-blur">
                      <table className="w-full text-sm">
                        <thead className="bg-gradient-to-r from-gray-50 via-white to-gray-50 text-gray-800">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Booking Ref</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Room</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Guest & Contact</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Reference</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Booked By</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Stay Dates</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Payment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {roomBookings.map((booking: any) => (
                            <tr key={booking.id} className="hover:bg-primary/5 transition">
                              <td className="px-4 py-3 font-mono text-primary font-bold">#{booking.id}</td>
                              <td className="px-4 py-3">
                                <div className="font-semibold text-gray-900">{booking.room?.name || 'Room'}</div>
                                <div className="text-xs text-gray-500">Room #{booking.room?.roomNumber || booking.roomId}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-semibold text-gray-900">{booking.customerName}</div>
                                <div className="text-xs text-gray-500">📞 {booking.customerPhone}</div>
                                {booking.customerWhatsapp && (
                                  <div className="text-xs text-gray-500">💬 {booking.customerWhatsapp}</div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-800">
                                <div className="font-semibold text-gray-900">{booking.referenceName || '—'}</div>
                                <div className="text-xs text-gray-500">{booking.referencePhone || ''}</div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-800">
                                <div className="font-semibold text-primary">{booking.createdBy?.name || 'Admin'}</div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-800">
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
                                <div className="text-xs text-gray-500 mt-1">Paid: ৳{Number(booking.advancePayment).toLocaleString()}</div>
                                {Number(booking.remainingPayment || 0) > 0 && (
                                  <div className="mt-1 text-xs font-semibold text-red-600">Payment due: ৳{Number(booking.remainingPayment).toLocaleString()}</div>
                                )}
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

      {/* Convention Snapshot Bar */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-900 via-emerald-700 to-secondary-600 text-white shadow-2xl p-5 md:p-6 border border-white/10">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.18),transparent_25%)]" aria-hidden />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Convention Snapshot</p>
            <h3 className="text-2xl font-heading font-bold mt-1 drop-shadow">Live hall status</h3>
            <p className="text-white/80 text-sm mt-1">
              {hallSearchDate ? `For ${formatDate(hallSearchDate)} (${hallSearchSlot})` : 'Run a hall search to see slot-aware availability.'}
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 w-full lg:w-auto">
            {[{
              label: 'Total Halls',
              value: allHalls.length || 0,
              tint: 'from-white/25 to-white/10',
            }, {
              label: 'Booked Halls',
              value: hallBookedCount,
              tint: 'from-red-300/40 to-red-500/20',
            }, {
              label: 'Available',
              value: hallAvailableCount,
              tint: 'from-emerald-300/40 to-emerald-500/20',
            }].map((item) => (
              <div
                key={item.label}
                className={`relative rounded-xl px-4 py-3 bg-gradient-to-br ${item.tint} border border-white/10 shadow-lg backdrop-blur`}
              >
                <p className="text-xs uppercase tracking-wide text-white/80">{item.label}</p>
                <p className="text-2xl font-bold drop-shadow mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Convention Hall Availability Search */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/90 via-accent-50/70 to-white/90 border border-accent/10 shadow-xl p-6 mb-8 backdrop-blur">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(244,164,37,0.08),transparent_25%),radial-gradient(circle_at_85%_20%,rgba(0,103,71,0.08),transparent_25%),radial-gradient(circle_at_50%_90%,rgba(211,47,47,0.08),transparent_28%)]" aria-hidden />
        <div className="relative flex items-center justify-between gap-4 mb-6 flex-wrap">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <span className="text-3xl">🏛️</span>
            <span>
              Convention Hall Availability Search
              <p className="text-sm font-normal text-gray-600">Pick a date and slot to see free halls.</p>
            </span>
          </h2>
          <div className="flex gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-white/70 text-accent-700 text-sm font-semibold border border-accent/10 shadow-sm">Slot aware</span>
            <span className="px-3 py-1 rounded-full bg-white/70 text-primary-700 text-sm font-semibold border border-primary/10 shadow-sm">Instant status</span>
          </div>
        </div>
        
        <div className="relative grid md:grid-cols-4 gap-4 mb-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Select Date
            </label>
            <input
              type="date"
              value={hallSearchDate}
              onChange={(e) => setHallSearchDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-accent/20 bg-white/80 text-gray-900 shadow-sm focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              placeholder="mm/dd/yyyy"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Time Slot</label>
            <select
              value={hallSearchSlot}
              onChange={(e) => setHallSearchSlot(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-accent/20 bg-white/80 text-gray-900 shadow-sm focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
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
              className="w-full px-6 py-3 rounded-xl font-semibold text-white shadow-lg bg-gradient-to-r from-accent-600 via-primary-600 to-secondary-500 hover:shadow-xl transition"
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
              className="w-full px-6 py-3 rounded-xl font-semibold text-gray-700 bg-white/80 border border-gray-200 hover:bg-gray-100 transition shadow-sm"
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
                    className={`relative overflow-hidden rounded-2xl p-6 border shadow-xl transition-all duration-200 backdrop-blur group ${
                      booked
                        ? 'border-red-200/70 bg-gradient-to-br from-rose-50 via-white to-red-50'
                        : 'border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-teal-50'
                    }`}
                  >
                    <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_20%_20%,rgba(0,103,71,0.15),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(244,164,37,0.12),transparent_25%)]" aria-hidden />
                    <div className="relative flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Convention Hall</p>
                        <h3 className="text-xl font-bold text-gray-900 drop-shadow-sm flex items-center gap-2">
                          <span className="text-lg">🏛️</span>
                          {hall.name}
                        </h3>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm border ${
                          booked
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : 'bg-green-100 text-green-700 border-green-200'
                        }`}
                      >
                        {booked ? '❌ Booked' : '✓ Available'}
                      </span>
                    </div>
                    <div className="relative grid grid-cols-2 gap-3 text-sm text-gray-700">
                      <div className="rounded-xl bg-white/80 border border-white/60 px-3 py-2 shadow-sm">
                        <p className="text-xs text-gray-500">Capacity</p>
                        <p className="font-semibold text-gray-900">{hall.maxCapacity} guests</p>
                      </div>
                      <div className="rounded-xl bg-white/80 border border-white/60 px-3 py-2 shadow-sm">
                        <p className="text-xs text-gray-500">Price / Day</p>
                        <p className="font-semibold text-accent">৳{Number(hall.pricePerDay || 0).toLocaleString()}</p>
                      </div>
                      <div className="rounded-xl bg-white/75 border border-white/60 px-3 py-2 shadow-sm">
                        <p className="text-xs text-gray-500">Slot</p>
                        <p className="font-semibold text-gray-900 capitalize">{hallSearchSlot}</p>
                      </div>
                      <div className="rounded-xl bg-white/75 border border-white/60 px-3 py-2 shadow-sm">
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="font-semibold text-gray-900">{hallSearchDate ? formatDate(hallSearchDate) : 'Select a date'}</p>
                      </div>
                    </div>
                    {hall.description && (
                      <p className="relative mt-4 text-sm text-gray-700 leading-relaxed line-clamp-2">
                        {hall.description}
                      </p>
                    )}
                    <div className="relative mt-5 h-1 w-full rounded-full bg-gradient-to-r from-transparent via-black/5 to-transparent" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
