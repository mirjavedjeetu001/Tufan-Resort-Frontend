'use client';
import { useEffect, useState } from 'react';
import { bookingsAPI, roomsAPI } from '@/lib/api';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [rooms, setRooms] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, roomsRes, bookingsRes] = await Promise.all([
        bookingsAPI.getMetrics(),
        roomsAPI.getAll(),
        bookingsAPI.getAll(),
      ]);
      
      setMetrics(metricsRes.data);
      setRooms(roomsRes.data);
      setRecentBookings(bookingsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-heading font-bold mb-8">Dashboard Overview</h1>

      {/* Metrics Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600 mb-2">Total Rooms</p>
          <p className="text-3xl font-bold text-primary">{rooms.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600 mb-2">Total Bookings</p>
          <p className="text-3xl font-bold text-primary">{metrics?.totalBookings || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600 mb-2">Confirmed</p>
          <p className="text-3xl font-bold text-green-600">{metrics?.confirmedBookings || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600 mb-2">Total Revenue</p>
          <p className="text-3xl font-bold text-accent">${metrics?.totalRevenue || 0}</p>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-heading font-bold mb-4">Recent Bookings</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">ID</th>
                <th className="text-left py-3 px-4">Customer</th>
                <th className="text-left py-3 px-4">Room</th>
                <th className="text-left py-3 px-4">Check-in</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking: any) => (
                <tr key={booking.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">#{booking.id}</td>
                  <td className="py-3 px-4">{booking.customerName}</td>
                  <td className="py-3 px-4">{booking.room?.name || 'N/A'}</td>
                  <td className="py-3 px-4">{new Date(booking.checkInDate).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold">${booking.totalAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
