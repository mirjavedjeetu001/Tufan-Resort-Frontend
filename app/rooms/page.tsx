'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { roomsAPI } from '@/lib/api';

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (filterType === 'all') {
      setFilteredRooms(rooms);
    } else {
      setFilteredRooms(rooms.filter((room: any) => room.type === filterType));
    }
  }, [filterType, rooms]);

  const fetchRooms = async () => {
    try {
      const response = await roomsAPI.getAvailable(checkInDate, checkOutDate);
      setRooms(response.data);
      setFilteredRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleDateSearch = () => {
    if (checkInDate && checkOutDate) {
      fetchRooms();
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-16 bg-gradient-to-b from-primary-50 to-white">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-heading font-bold text-center mb-4 text-primary-700">
            🏠 Our Rooms / আমাদের রুম
          </h1>
          <p className="text-center text-gray-600 mb-8">Choose from our luxurious accommodations / বিলাসবহুল আবাসন থেকে বেছে নিন</p>

          {/* Date Filter */}
          <div className="max-w-4xl mx-auto mb-8 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">🗓️ Check Availability / প্রাপ্যতা চেক করুন</h3>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Check-in Date / চেক-ইন তারিখ</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Check-out Date / চেক-আউট তারিখ</label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <button
                onClick={handleDateSearch}
                className="px-8 py-3 bg-gradient-to-r from-primary to-primary-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                🔍 Search / অনুসন্ধান
              </button>
              <button
                onClick={() => { setCheckInDate(''); setCheckOutDate(''); fetchRooms(); }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Clear / মুছুন
              </button>
            </div>
          </div>

          {/* Filter */}
          <div className="flex justify-center mb-12">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-6 py-3 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-700 font-semibold"
            >
              <option value="all">🏠 All Rooms / সব রুম</option>
              <option value="standard">Standard / স্ট্যান্ডার্ড</option>
              <option value="deluxe">Deluxe / ডিলাক্স</option>
              <option value="suite">Suite / স্যুইট</option>
              <option value="family">Family / পারিবারিক</option>
            </select>
          </div>

          {/* Rooms Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {filteredRooms.map((room: any) => (
              <div key={room.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1">
                <div className="h-56 relative overflow-hidden">
                  {room.images && room.images.length > 0 ? (
                    <img
                      src={`http://localhost:3001${room.images[0]}`}
                      alt={room.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                      <span className="text-white text-lg font-semibold">No Image</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-heading font-bold mb-2 text-primary-700">{room.name}</h3>
                  <p className="text-accent-600 mb-2 capitalize font-semibold">{room.type} Room</p>
                  <p className="text-gray-700 mb-4 line-clamp-3">{room.description}</p>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2 font-semibold">✨ Amenities:</p>
                    <div className="flex flex-wrap gap-2">
                      {room.amenities?.slice(0, 3).map((amenity: string, idx: number) => (
                        <span key={idx} className="bg-accent-50 text-accent-700 border border-accent-200 px-2 py-1 rounded text-xs font-medium">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-4 pb-4 border-t border-b border-gray-200 py-3">
                    <div>
                      <p className="text-2xl font-bold text-primary-600">৳{room.pricePerNight}</p>
                      <p className="text-sm text-gray-600">per night / প্রতি রাত</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">👥 {room.maxGuests} guests</p>
                      <p className="text-sm text-gray-600">🛏️ {room.numberOfBeds} beds</p>
                    </div>
                  </div>

                  <Link 
                    href={`/rooms/${room.id}`}
                    className="block text-center bg-gradient-to-r from-primary to-primary-600 text-white py-3 rounded-lg hover:shadow-lg transition font-semibold"
                  >
                    View Details / বিস্তারিত দেখুন
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {filteredRooms.length === 0 && (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">No rooms available in this category.</p>
            </div>
          )}

          {/* Contact CTA */}
          <div className="mt-16 bg-primary text-white p-8 rounded-lg text-center">
            <h2 className="text-3xl font-heading font-bold mb-4">Ready to Book?</h2>
            <p className="text-lg mb-6">Contact our hotline for reservations</p>
            <a href="tel:+880-XXX-XXXXXX" className="bg-accent text-dark px-8 py-3 rounded-lg font-bold hover:bg-yellow-500 transition inline-block">
              📞 Call Now: +880-XXX-XXXXXX
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
