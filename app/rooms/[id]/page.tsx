'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { roomsAPI } from '@/lib/api';
import axios from 'axios';

export default function RoomDetailPage() {
  const params = useParams();
  const [room, setRoom] = useState<any>(null);
  const [resortInfo, setResortInfo] = useState<any>(null);

  useEffect(() => {
    if (params.id) {
      fetchRoom();
      fetchResortInfo();
    }
  }, [params.id]);

  const fetchRoom = async () => {
    try {
      const response = await roomsAPI.getOne(Number(params.id));
      setRoom(response.data);
    } catch (error) {
      console.error('Error fetching room:', error);
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

  if (!room) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-16 text-center">
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Image Gallery */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="h-96 rounded-lg overflow-hidden">
                {room.images && room.images.length > 0 ? (
                  <img
                    src={`http://localhost:3001${room.images[0]}`}
                    alt={room.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
                    <span className="text-white text-xl font-semibold">No Image</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {room.images && room.images.length > 1 ? (
                  room.images.slice(1, 5).map((img: string, idx: number) => (
                    <div key={idx} className="h-46 rounded-lg overflow-hidden">
                      <img
                        src={`http://localhost:3001${img}`}
                        alt={`${room.name} - ${idx + 2}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))
                ) : (
                  <>
                    <div className="h-46 bg-gradient-to-r from-blue-500 to-primary rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold">No Image</span>
                    </div>
                    <div className="h-46 bg-gradient-to-r from-primary to-teal-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold">No Image</span>
                    </div>
                    <div className="h-46 bg-gradient-to-r from-teal-600 to-primary rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold">No Image</span>
                    </div>
                    <div className="h-46 bg-gradient-to-r from-primary to-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold">No Image</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Room Details */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="mb-6">
                <h1 className="text-4xl font-heading font-bold mb-2">{room.name}</h1>
                <p className="text-xl text-gray-600 capitalize">{room.type} Room</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-secondary p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-primary">৳{Number(room.pricePerNight).toLocaleString()}</p>
                  <p className="text-gray-600">per night</p>
                </div>
                <div className="bg-secondary p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-primary">{room.maxGuests}</p>
                  <p className="text-gray-600">max guests</p>
                </div>
                <div className="bg-secondary p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-primary">{room.numberOfBeds}</p>
                  <p className="text-gray-600">beds</p>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-heading font-bold mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed">{room.description}</p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-heading font-bold mb-4">Amenities</h2>
                <div className="grid md:grid-cols-3 gap-3">
                  {room.amenities?.map((amenity: string, idx: number) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="text-primary">✓</span>
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-2xl font-heading font-bold mb-4">Book This Room</h2>
                <p className="text-gray-700 mb-6">
                  To book this room, please contact our reservation hotline. Our friendly staff will assist you with your booking.
                </p>
                <div className="flex gap-4">
                  <a 
                    href={`tel:${resortInfo?.phone || '+880-XXX-XXXXXX'}`}
                    className="bg-primary-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-700 transition shadow-md"
                  >
                    📞 Call to Book
                  </a>
                  <a 
                    href={`https://wa.me/${resortInfo?.phone?.replace(/[^0-9]/g, '') || '880XXXXXXXXX'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition shadow-md"
                  >
                    💬 WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
