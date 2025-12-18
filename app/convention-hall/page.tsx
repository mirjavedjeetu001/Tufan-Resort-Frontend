'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { conventionHallAPI } from '@/lib/api';

export default function ConventionHallPage() {
  const [halls, setHalls] = useState([]);
  const [filteredHalls, setFilteredHalls] = useState([]);
  const [eventDate, setEventDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('all');
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    fetchHalls();
  }, []);

  useEffect(() => {
    if (selectedTimeSlot === 'all') {
      setFilteredHalls(halls);
    } else {
      setFilteredHalls(halls.filter((hall: any) => 
        hall.timeSlots?.includes(selectedTimeSlot)
      ));
    }
  }, [selectedTimeSlot, halls]);

  const fetchHalls = async () => {
    try {
      const response = await conventionHallAPI.getAll();
      setHalls(response.data);
      setFilteredHalls(response.data);
    } catch (error) {
      console.error('Error fetching convention halls:', error);
    }
  };

  const handleDateSearch = () => {
    if (eventDate) {
      // Filter available halls for selected date
      fetchHalls();
    }
  };

  const nextImage = (hallId: number, imagesLength: number) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [hallId]: ((prev[hallId] || 0) + 1) % imagesLength
    }));
  };

  const prevImage = (hallId: number, imagesLength: number) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [hallId]: ((prev[hallId] || 0) - 1 + imagesLength) % imagesLength
    }));
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-20 sm:pt-24 pb-12 sm:pb-16 bg-gradient-to-b from-primary-50 to-white">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-heading font-bold text-center mb-3 sm:mb-4 text-primary-700">
            🏛️ Convention Hall / কনভেনশন হল
          </h1>
          <p className="text-center text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
            Perfect venue for your events and celebrations / আপনার ইভেন্ট এবং উদযাপনের জন্য নিখুঁত স্থান
          </p>

          {/* Date & Time Slot Filter */}
          <div className="max-w-4xl mx-auto mb-6 sm:mb-8 bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 mb-3 sm:mb-4 text-center">
              🗓️ Check Availability / প্রাপ্যতা চেক করুন
            </h3>
            <div className="flex flex-col gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  Event Date / ইভেন্টের তারিখ
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  Time Slot / সময় স্লট
                </label>
                <select
                  value={selectedTimeSlot}
                  onChange={(e) => setSelectedTimeSlot(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                >
                  <option value="all">All Slots / সব স্লট</option>
                  <option value="morning">Morning / সকাল</option>
                  <option value="afternoon">Afternoon / বিকাল</option>
                  <option value="evening">Evening / সন্ধ্যা</option>
                  <option value="full-day">Full Day / সারাদিন</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  onClick={handleDateSearch}
                  className="px-4 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-primary to-primary-600 text-white rounded-lg text-sm sm:text-base font-semibold hover:shadow-lg transition-all"
                >
                  🔍 <span className="hidden xs:inline">Search / অনুসন্ধান</span><span className="xs:hidden">Search</span>
                </button>
                <button
                  onClick={() => { setEventDate(''); setSelectedTimeSlot('all'); fetchHalls(); }}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-200 text-gray-700 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-300 transition-all"
                >
                  <span className="hidden xs:inline">Clear / মুছুন</span><span className="xs:hidden">Clear</span>
                </button>
              </div>
            </div>
          </div>

          {/* Convention Halls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
            {filteredHalls.map((hall: any) => (
              <div 
                key={hall.id} 
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                {/* Image Carousel */}
                <div className="h-64 relative overflow-hidden group">
                  {hall.images && hall.images.length > 0 ? (
                    <>
                      <img
                        src={`http://localhost:3001${hall.images[currentImageIndex[hall.id] || 0]}`}
                        alt={hall.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      {hall.images.length > 1 && (
                        <>
                          <button
                            onClick={() => prevImage(hall.id, hall.images.length)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ❮
                          </button>
                          <button
                            onClick={() => nextImage(hall.id, hall.images.length)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ❯
                          </button>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                            {hall.images.map((_: any, idx: number) => (
                              <div
                                key={idx}
                                className={`w-2 h-2 rounded-full ${
                                  idx === (currentImageIndex[hall.id] || 0) 
                                    ? 'bg-white' 
                                    : 'bg-white/50'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                      <span className="text-white text-lg font-semibold">🏛️ Convention Hall</span>
                    </div>
                  )}
                </div>

                {/* Hall Details */}
                <div className="p-6">
                  <h3 className="text-2xl font-heading font-bold mb-2 text-primary-700">
                    {hall.name}
                  </h3>
                  <p className="text-gray-700 mb-4 line-clamp-3">{hall.description}</p>
                  
                  {/* Capacity & Dimensions */}
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600 font-semibold">👥 Capacity:</span>
                      <span className="text-gray-800 font-bold">{hall.maxCapacity} guests</span>
                    </div>
                    {hall.dimensions && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 font-semibold">📐 Size:</span>
                        <span className="text-gray-800 font-medium">{hall.dimensions}</span>
                      </div>
                    )}
                  </div>

                  {/* Amenities */}
                  {hall.amenities && hall.amenities.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2 font-semibold">✨ Amenities:</p>
                      <div className="flex flex-wrap gap-2">
                        {hall.amenities.slice(0, 3).map((amenity: string, idx: number) => (
                          <span 
                            key={idx} 
                            className="bg-accent-50 text-accent-700 border border-accent-200 px-2 py-1 rounded text-xs font-medium"
                          >
                            {amenity}
                          </span>
                        ))}
                        {hall.amenities.length > 3 && (
                          <span className="text-xs text-gray-500 font-medium">
                            +{hall.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Event Types */}
                  {hall.eventTypes && hall.eventTypes.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2 font-semibold">🎉 Suitable For:</p>
                      <div className="flex flex-wrap gap-2">
                        {hall.eventTypes.slice(0, 3).map((type: string, idx: number) => (
                          <span 
                            key={idx} 
                            className="bg-primary-50 text-primary-700 border border-primary-200 px-2 py-1 rounded text-xs font-medium"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Time Slots */}
                  {hall.timeSlots && hall.timeSlots.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2 font-semibold">🕐 Available Slots:</p>
                      <div className="flex flex-wrap gap-2">
                        {hall.timeSlots.map((slot: string, idx: number) => (
                          <span 
                            key={idx} 
                            className="bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded text-xs font-medium capitalize"
                          >
                            {slot}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="mb-4 pb-4 border-t border-b border-gray-200 pt-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary-600">৳{hall.pricePerDay}</p>
                      <p className="text-sm text-gray-600">per day / প্রতি দিন</p>
                    </div>
                  </div>

                  {/* Booking Button */}
                  <a 
                    href={`tel:+880-XXX-XXXXXX`}
                    className="block text-center bg-gradient-to-r from-primary to-primary-600 text-white py-3 rounded-lg hover:shadow-lg transition font-semibold"
                  >
                    📞 Call to Book / বুক করতে কল করুন
                  </a>
                </div>
              </div>
            ))}
          </div>

          {filteredHalls.length === 0 && (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">
                No convention halls available for selected criteria.
              </p>
            </div>
          )}

          {/* Add-Ons Section */}
          <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-heading font-bold text-center mb-8 text-primary-700">
              🎊 Available Add-On Services / অতিরিক্ত সেবা
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-accent-50 to-accent-100 rounded-lg">
                <div className="text-4xl mb-3">🍽️</div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">Catering</h3>
                <p className="text-gray-700">Full catering services with customizable menu</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg">
                <div className="text-4xl mb-3">🎵</div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">Sound System</h3>
                <p className="text-gray-700">Professional audio & lighting equipment</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg">
                <div className="text-4xl mb-3">🎀</div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">Decoration</h3>
                <p className="text-gray-700">Event decoration & theme setup services</p>
              </div>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="mt-16 bg-gradient-to-r from-primary to-primary-600 text-white p-8 rounded-lg text-center">
            <h2 className="text-3xl font-heading font-bold mb-4">
              Ready to Book Your Event? / ইভেন্ট বুক করতে প্রস্তুত?
            </h2>
            <p className="text-lg mb-6">
              Contact our hotline for reservations and inquiries
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="tel:+880-XXX-XXXXXX" 
                className="bg-accent text-dark px-8 py-3 rounded-lg font-bold hover:bg-yellow-500 transition inline-block"
              >
                📞 Call Now: +880-XXX-XXXXXX
              </a>
              <a 
                href="https://wa.me/880XXXXXXXXX" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-green-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-600 transition inline-block"
              >
                💬 WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
