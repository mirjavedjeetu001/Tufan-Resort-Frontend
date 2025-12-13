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
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-accent-50 opacity-40"></div>
          <div className="container mx-auto px-4 relative z-10">
            <h2 className="text-5xl font-heading font-bold text-center mb-4 text-gray-800 animate-fade-in">
              About Tufan Resort
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-accent-500 mx-auto mb-12"></div>
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-xl text-gray-700 mb-8 leading-relaxed animate-fade-in">
                {resortInfo?.aboutText || 'Welcome to Tufan Resort, where luxury meets nature. Experience world-class hospitality in our premium accommodations and state-of-the-art convention facilities.'}
              </p>
              <div className="grid md:grid-cols-3 gap-8 mt-16">
                {resortInfo?.facilities?.slice(0, 3).map((facility: string, idx: number) => (
                  <div key={idx} className="card-premium p-8 text-center group cursor-pointer animate-fade-in">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-2xl font-bold group-hover:scale-110 transition-transform duration-300">
                      {idx + 1}
                    </div>
                    <h3 className="font-heading font-bold text-xl mb-2 text-gray-800">{facility}</h3>
                  </div>
                )) || (
                  <>
                    <div className="card-premium p-8 text-center group cursor-pointer hover-lift">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-3xl">
                        �
                      </div>
                      <h3 className="font-heading font-bold text-xl mb-2 text-gray-800">Lake View</h3>
                      <p className="text-gray-600">Stunning natural beauty</p>
                    </div>
                    <div className="card-premium p-8 text-center group cursor-pointer hover-lift">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center text-white text-3xl">
                        🍛
                      </div>
                      <h3 className="font-heading font-bold text-xl mb-2 text-gray-800">Bengali Cuisine</h3>
                      <p className="text-gray-600">Authentic local flavors</p>
                    </div>
                    <div className="card-premium p-8 text-center group cursor-pointer hover-lift">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white text-3xl">
                        🌿
                      </div>
                      <h3 className="font-heading font-bold text-xl mb-2 text-gray-800">Nature Resort</h3>
                      <p className="text-gray-600">Peaceful green surroundings</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Rooms */}
        <section className="py-20 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-5xl font-heading font-bold text-center mb-4 text-gray-800">Featured Rooms</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-accent-500 mx-auto mb-16"></div>
            <div className="grid md:grid-cols-3 gap-10">
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
                  <div className="p-6">
                    <h3 className="text-2xl font-heading font-bold mb-2 text-gray-800 group-hover:text-primary-600 transition-colors">{room.name}</h3>
                    <p className="text-primary-600 font-semibold mb-3 uppercase text-sm tracking-wide">{room.type}</p>
                    <p className="text-gray-600 mb-4 line-clamp-2">{room.description || 'Luxury accommodation with modern amenities'}</p>
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                      <div>
                        <span className="text-3xl font-bold text-primary-600">৳{Number(room.pricePerNight).toLocaleString()}</span>
                        <span className="text-gray-500">/night</span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-600 text-sm block">Max Guests</span>
                        <span className="text-2xl font-bold text-gray-800">{room.maxGuests}</span>
                      </div>
                    </div>
                    <Link href={`/rooms/${room.id}`} className="btn-premium bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 rounded-lg font-semibold hover:shadow-glow transition-all duration-300 block text-center">
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
              <Link href="/rooms" className="bg-accent text-dark px-8 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition inline-block">
                View All Rooms
              </Link>
            </div>
          </div>
        </section>

        {/* Convention Hall Teaser */}
        <section className="py-16 bg-gray-100">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-heading font-bold text-center mb-12">Convention Hall</h2>
            {halls.length > 0 && (
              <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="h-64 bg-gradient-to-r from-primary to-blue-600"></div>
                <div className="p-8">
                  <h3 className="text-3xl font-heading font-bold mb-4">{halls[0].name}</h3>
                  <p className="text-gray-700 mb-6">{halls[0].description}</p>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{halls[0].dimensions}</p>
                      <p className="text-gray-600">sq ft</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{halls[0].maxCapacity}</p>
                      <p className="text-gray-600">capacity</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{halls[0].eventTypes?.length || 0}</p>
                      <p className="text-gray-600">event types</p>
                    </div>
                  </div>
                  <Link href="/convention-hall" className="block text-center bg-primary text-white py-3 rounded hover:bg-teal-700 transition">
                    Learn More & Inquire
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-heading font-bold mb-4">Ready to Book?</h2>
            <p className="text-xl mb-8">📞 Contact our hotline for reservations and inquiries</p>
            <a href={`tel:${resortInfo?.phone || '+880-XXX-XXXXXX'}`} className="bg-accent text-white px-8 py-4 rounded-lg font-bold text-xl hover:bg-accent-600 transition inline-block shadow-lg hover:shadow-glow">
              📞 {resortInfo?.phone || '+880-XXX-XXXXXX'}
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
