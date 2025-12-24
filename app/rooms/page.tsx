'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { roomsAPI } from '@/lib/api';
import axios from 'axios';

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [resortInfo, setResortInfo] = useState<any>(null);

  useEffect(() => {
    fetchRooms();
    fetchResortInfo();
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

  const fetchResortInfo = async () => {
    try {
      const response = await axios.get('http://localhost:3001/resort-info');
      setResortInfo(response.data);
    } catch (error) {
      console.error('Error fetching resort info:', error);
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
      
      <main className="pt-20 sm:pt-24 pb-12 sm:pb-16 bg-gradient-to-b from-primary-50 to-white">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-heading font-bold text-center mb-3 sm:mb-4 text-primary-700">
            🏠 Our Rooms / আমাদের রুম
          </h1>
          <p className="text-center text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">Choose from our luxurious accommodations / বিলাসবহুল আবাসন থেকে বেছে নিন</p>

          {/* Date Filter */}
          <div className="max-w-4xl mx-auto mb-6 sm:mb-8 bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 mb-3 sm:mb-4 text-center">🗓️ Check Availability / প্রাপ্যতা চেক করুন</h3>
            <div className="flex flex-col gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Check-in Date / চেক-ইন তারিখ</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Check-out Date / চেক-আউট তারিখ</label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  onClick={handleDateSearch}
                  className="px-4 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-primary-600 to-primary-800 text-white rounded-lg text-sm sm:text-base font-semibold hover:shadow-xl hover:from-primary-700 hover:to-primary-900 transition-all"
                >
                  🔍 <span className="hidden xs:inline">Search / অনুসন্ধান</span><span className="xs:hidden">Search</span>
                </button>
                <button
                  onClick={() => { setCheckInDate(''); setCheckOutDate(''); fetchRooms(); }}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white border-2 border-primary-600 text-primary-700 rounded-lg text-sm sm:text-base font-semibold hover:bg-primary-50 transition-all"
                >
                  <span className="hidden xs:inline">Clear / মুছুন</span><span className="xs:hidden">Clear</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="flex justify-center mb-8 sm:mb-12">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-700 text-sm sm:text-base font-semibold w-full max-w-sm"
            >
              <option value="all">🏠 All Rooms / সব রুম</option>
              <option value="standard">Standard / স্ট্যান্ডার্ড</option>
              <option value="deluxe">Deluxe / ডিলাক্স</option>
              <option value="suite">Suite / স্যুইট</option>
              <option value="family">Family / পারিবারিক</option>
            </select>
          </div>

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
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
                <div className="p-4 sm:p-5 lg:p-6">
                  <h3 className="text-xl sm:text-2xl font-heading font-bold mb-1.5 sm:mb-2 text-primary-700">{room.name}</h3>
                  <p className="text-accent-600 mb-2 capitalize text-sm sm:text-base font-semibold">{room.type} Room</p>
                  <p className="text-gray-700 mb-3 sm:mb-4 line-clamp-3 text-sm sm:text-base">{room.description}</p>
                  
                  <div className="mb-3 sm:mb-4">
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 font-semibold">✨ Amenities:</p>
                    <div className="flex flex-wrap gap-2">
                      {room.amenities?.slice(0, 3).map((amenity: string, idx: number) => (
                        <span key={idx} className="bg-accent-50 text-accent-700 border border-accent-200 px-2 py-1 rounded text-xs font-medium">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-3 sm:mb-4 pb-3 sm:pb-4 border-t border-b border-gray-200 py-2.5 sm:py-3">
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-primary-600">৳{room.pricePerNight}</p>
                      <p className="text-xs sm:text-sm text-gray-600">per night / প্রতি রাত</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm sm:text-base font-semibold text-gray-800">👥 {room.maxGuests} guests</p>
                      <p className="text-xs sm:text-sm text-gray-600">🛏️ {room.numberOfBeds} beds</p>
                    </div>
                  </div>

                  <Link 
                    href={`/rooms/${room.id}`}
                    className="block text-center bg-gradient-to-r from-primary-600 to-primary-800 text-white py-2.5 sm:py-3 rounded-lg hover:shadow-xl hover:from-primary-700 hover:to-primary-900 transition text-sm sm:text-base font-semibold"
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
          <div className="mt-12 sm:mt-16 bg-gradient-to-r from-primary-600 to-primary-800 text-white p-6 sm:p-8 rounded-lg text-center shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-3 sm:mb-4">Ready to Book?</h2>
            <p className="text-base sm:text-lg mb-4 sm:mb-6">Contact our hotline for reservations</p>
            <a href={`tel:${resortInfo?.phone || '+8801811480222'}`} className="bg-white text-primary-700 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-bold inline-block shadow-md">
              📞 Call Now: {resortInfo?.phone || '+8801811480222'}
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
