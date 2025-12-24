'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroCarousel from '@/components/HeroCarousel';
import Link from 'next/link';
import { roomsAPI, conventionHallAPI, resortInfoAPI } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Home() {
  const [featuredRooms, setFeaturedRooms] = useState([]);
  const [halls, setHalls] = useState([]);
  const [resortInfo, setResortInfo] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [roomsRes, hallsRes, infoRes] = await Promise.all([
        roomsAPI.getAvailable(),
        conventionHallAPI.getAll(),
        resortInfoAPI.get(),
      ]);
      
      setFeaturedRooms(roomsRes.data.slice(0, 3));
      setHalls(hallsRes.data);
      setResortInfo(infoRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Navbar />
      
      <main className="pt-16">
        {/* Hero Section */}
        <HeroCarousel />

        {/* About Section */}
        <section className="py-12 sm:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-accent-50 opacity-40"></div>
          <div className="container mx-auto px-4 relative z-10">
            {!resortInfo ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-center mb-3 sm:mb-4 text-gray-800 animate-fade-in">
                  About {resortInfo?.resortName || 'Tufan Resort'}
                </h2>
                <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-primary-500 to-accent-500 mx-auto mb-8 sm:mb-12"></div>
                <div className="max-w-3xl mx-auto text-center">
                  <p className="text-base sm:text-lg lg:text-xl text-gray-700 mb-6 sm:mb-8 leading-relaxed animate-fade-in">
                    {resortInfo?.aboutText || resortInfo?.description || 'Welcome to our resort, where luxury meets nature.'}
                  </p>
                  {resortInfo?.facilities && resortInfo.facilities.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-8 sm:mt-16">
                      {resortInfo.facilities.slice(0, 3).map((facility: string, idx: number) => (
                        <div key={idx} className="card-premium p-4 sm:p-6 lg:p-8 text-center group cursor-pointer animate-fade-in">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold group-hover:scale-110 transition-transform duration-300">
                            {idx + 1}
                          </div>
                          <h3 className="font-heading font-bold text-base sm:text-lg lg:text-xl mb-2 text-gray-800">{facility}</h3>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Featured Rooms */}
        <section className="py-12 sm:py-20 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-center mb-3 sm:mb-4 text-gray-800">Featured Rooms</h2>
            <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-primary-500 to-accent-500 mx-auto mb-8 sm:mb-12 lg:mb-16"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
              {featuredRooms.length > 0 ? featuredRooms.map((room: any) => (
                <div key={room.id} className="card-premium overflow-hidden group">
                  <div className="h-64 bg-gradient-to-br from-primary-400 to-primary-600 relative overflow-hidden">
                    {room.images?.[0] ? (
                      <img src={`${API_URL}${room.images[0]}`} alt={room.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white text-xl font-semibold">No Image</span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <span className="badge-success px-4 py-2 text-sm font-semibold">Available</span>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <h3 className="text-xl sm:text-2xl font-heading font-bold mb-2 text-gray-800 group-hover:text-primary-600 transition-colors">{room.name}</h3>
                    <p className="text-primary-600 font-semibold mb-2 sm:mb-3 uppercase text-xs sm:text-sm tracking-wide">{room.type}</p>
                    <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 line-clamp-2">{room.description || 'Luxury accommodation with modern amenities'}</p>
                    <div className="flex justify-between items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-200">
                      <div>
                        <span className="text-2xl sm:text-3xl font-bold text-primary-600">৳{Number(room.pricePerNight).toLocaleString()}</span>
                        <span className="text-sm sm:text-base text-gray-500">/night</span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-600 text-xs sm:text-sm block">Max Guests</span>
                        <span className="text-xl sm:text-2xl font-bold text-gray-800">{room.maxGuests}</span>
                      </div>
                    </div>
                    <Link href={`/rooms/${room.id}`} className="btn-premium bg-gradient-to-r from-primary-600 to-primary-800 text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:shadow-xl hover:from-primary-700 hover:to-primary-900 transition-all duration-300 block text-center">
                      View Details & Book
                    </Link>
                  </div>
                </div>
              )) : (
                <div className="col-span-3 text-center text-gray-600">
                  <p>No rooms available. Please check back later.</p>
                </div>
              )}
            </div>
            <div className="text-center mt-8">
              <Link href="/rooms" className="bg-accent text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-accent-400 hover:text-gray-900 transition inline-block shadow-md">
                View All Rooms
              </Link>
            </div>
          </div>
        </section>

        {/* Convention Hall Teaser */}
        <section className="py-12 sm:py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-center mb-3 sm:mb-4 text-gray-800">Convention Hall</h2>
            <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-primary-500 to-accent-500 mx-auto mb-8 sm:mb-12 lg:mb-16"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
              {halls.length > 0 ? halls.slice(0, 3).map((hall: any) => (
                <div key={hall.id} className="card-premium overflow-hidden group">
                  <div className="h-64 bg-gradient-to-br from-primary-400 to-primary-600 relative overflow-hidden">
                    {hall.images?.[0] ? (
                      <img src={`${API_URL}${hall.images[0]}`} alt={hall.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white text-xl font-semibold">🏛️ Convention Hall</span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <span className="badge-success px-4 py-2 text-sm font-semibold">Available</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-heading font-bold mb-2 text-gray-800 group-hover:text-primary-600 transition-colors">{hall.name}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{hall.description || 'Perfect venue for events and celebrations'}</p>
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                      <div>
                        <span className="text-3xl font-bold text-primary-600">৳{Number(hall.pricePerDay).toLocaleString()}</span>
                        <span className="text-gray-500">/day</span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-600 text-sm block">Capacity</span>
                        <span className="text-2xl font-bold text-gray-800">{hall.maxCapacity}</span>
                      </div>
                    </div>
                    <Link href="/convention-hall" className="btn-premium bg-gradient-to-r from-primary-600 to-primary-800 text-white py-3 rounded-lg font-semibold hover:shadow-xl hover:from-primary-700 hover:to-primary-900 transition-all duration-300 block text-center">
                      View Details & Book
                    </Link>
                  </div>
                </div>
              )) : (
                <div className="col-span-3 text-center text-gray-600">
                  <p>No convention halls available. Please check back later.</p>
                </div>
              )}
            </div>
            <div className="text-center mt-8">
              <Link href="/convention-hall" className="bg-accent text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-accent-400 hover:text-gray-900 transition inline-block shadow-md">
                View All Convention Halls
              </Link>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-12 sm:py-16 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold mb-3 sm:mb-4">Ready to Book?</h2>
            <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8">📞 Contact our hotline for reservations and inquiries</p>
            <a href={`tel:${resortInfo?.phone || '+880-XXX-XXXXXX'}`} className="bg-white text-primary-700 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-lg sm:text-xl inline-block shadow-lg">
              📞 {resortInfo?.phone || '+880-XXX-XXXXXX'}
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
