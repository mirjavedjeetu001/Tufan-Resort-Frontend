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
      const response = await roomsAPI.getAvailable();
      setRooms(response.data);
      setFilteredRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-heading font-bold text-center mb-4">Our Rooms</h1>
          <p className="text-center text-gray-600 mb-8">Choose from our luxurious accommodations</p>

          {/* Filter */}
          <div className="flex justify-center mb-12">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-6 py-3 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Rooms</option>
              <option value="standard">Standard</option>
              <option value="deluxe">Deluxe</option>
              <option value="suite">Suite</option>
              <option value="family">Family</option>
            </select>
          </div>

          {/* Rooms Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {filteredRooms.map((room: any) => (
              <div key={room.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                <div className="h-56 bg-gradient-to-r from-primary to-blue-600"></div>
                <div className="p-6">
                  <h3 className="text-2xl font-heading font-bold mb-2">{room.name}</h3>
                  <p className="text-gray-600 mb-2 capitalize">{room.type} Room</p>
                  <p className="text-gray-700 mb-4 line-clamp-3">{room.description}</p>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Amenities:</p>
                    <div className="flex flex-wrap gap-2">
                      {room.amenities?.slice(0, 3).map((amenity: string, idx: number) => (
                        <span key={idx} className="bg-secondary px-2 py-1 rounded text-xs">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-2xl font-bold text-primary">${room.pricePerNight}</p>
                      <p className="text-sm text-gray-600">per night</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{room.maxGuests} guests</p>
                      <p className="text-sm text-gray-600">{room.numberOfBeds} beds</p>
                    </div>
                  </div>

                  <Link 
                    href={`/rooms/${room.id}`}
                    className="block text-center bg-primary text-white py-2 rounded hover:bg-teal-700 transition"
                  >
                    View Details
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
