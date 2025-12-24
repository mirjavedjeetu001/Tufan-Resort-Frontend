'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { conventionHallAPI } from '@/lib/api';
import axios from 'axios';

export default function ConventionHallPage() {
  const [halls, setHalls] = useState([]);
  const [filteredHalls, setFilteredHalls] = useState([]);
  const [eventDate, setEventDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('all');
  const [customStartTime, setCustomStartTime] = useState('');
  const [customEndTime, setCustomEndTime] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: number]: number }>({});
  const [resortInfo, setResortInfo] = useState<any>(null);

  useEffect(() => {
    fetchHalls();
    fetchResortInfo();
  }, []);

  const fetchHalls = async () => {
    try {
      const response = await conventionHallAPI.getAll();
      setHalls(response.data);
      setFilteredHalls(response.data);
    } catch (error) {
      console.error('Error fetching convention halls:', error);
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

  const handleDateSearch = async () => {
    // Validate custom time slot
    if (selectedTimeSlot === 'custom') {
      if (!customStartTime || !customEndTime) {
        alert('Please select start time and end time for custom slot / কাস্টম স্লটের জন্য শুরু এবং শেষ সময় নির্বাচন করুন');
        return;
      }
      if (customStartTime >= customEndTime) {
        alert('End time must be after start time / শেষ সময় শুরুর সময়ের পরে হতে হবে');
        return;
      }
    }

    // Check if date is selected
    if (!eventDate) {
      alert('Please select event date / ইভেন্টের তারিখ নির্বাচন করুন');
      return;
    }

    // Check if time slot is selected
    if (!selectedTimeSlot || selectedTimeSlot === 'all') {
      // Show all halls if no specific time slot selected
      setFilteredHalls(halls);
      return;
    }

    try {
      // Call the public API to get available halls based on actual bookings
      const response = await axios.get('http://localhost:3001/convention-bookings/public/available-halls', {
        params: {
          date: eventDate,
          timeSlot: selectedTimeSlot,
        }
      });

      const { availableHalls, bookedHallIds } = response.data;

      // Filter halls by both time slot support AND availability (not booked)
      const filtered = halls.filter((hall: any) => {
        // First check if hall is not booked for this date/time
        const isNotBooked = !bookedHallIds.includes(hall.id);
        
        // Then check if hall supports the time slot
        const supportsTimeSlot = !hall.timeSlots || hall.timeSlots.length === 0 || hall.timeSlots.includes(selectedTimeSlot);
        
        return isNotBooked && supportsTimeSlot;
      });

      setFilteredHalls(filtered);

      // Show message if no halls available
      if (filtered.length === 0) {
        alert('No halls available for the selected date and time slot / নির্বাচিত তারিখ এবং সময় স্লটের জন্য কোন হল উপলব্ধ নেই');
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      // If API fails, fall back to filtering by time slot only
      const filtered = halls.filter((hall: any) => {
        if (!hall.timeSlots || hall.timeSlots.length === 0) {
          return true;
        }
        return hall.timeSlots.includes(selectedTimeSlot);
      });
      setFilteredHalls(filtered);
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
                  <option value="morning">Morning / সকাল (9 AM - 3 PM)</option>
                  <option value="night">Night / রাত (6 PM - 12 AM)</option>
                  <option value="custom">Custom Time / কাস্টম সময়</option>
                  <option value="full-day">Full Day / সারাদিন</option>
                </select>
              </div>
              
              {/* Custom Time Inputs - Show only when custom is selected */}
              {selectedTimeSlot === 'custom' && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 bg-accent-50 p-3 sm:p-4 rounded-lg border-2 border-accent-200">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                      Start Time / শুরুর সময় <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={customStartTime}
                      onChange={(e) => setCustomStartTime(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                      End Time / শেষ সময় <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={customEndTime}
                      onChange={(e) => setCustomEndTime(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <span>ℹ️</span>
                      <span>Select your preferred start and end time for the event / ইভেন্টের জন্য আপনার পছন্দের শুরু এবং শেষ সময় নির্বাচন করুন</span>
                    </p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  onClick={handleDateSearch}
                  className="px-4 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-primary-600 to-primary-800 text-white rounded-lg text-sm sm:text-base font-semibold hover:shadow-xl hover:from-primary-700 hover:to-primary-900 transition-all"
                >
                  🔍 <span className="hidden xs:inline">Search / অনুসন্ধান</span><span className="xs:hidden">Search</span>
                </button>
                <button
                  onClick={() => { 
                    setEventDate(''); 
                    setSelectedTimeSlot('all');
                    setCustomStartTime('');
                    setCustomEndTime('');
                    setFilteredHalls(halls);
                  }}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white border-2 border-primary-600 text-primary-700 rounded-lg text-sm sm:text-base font-semibold hover:bg-primary-50 transition-all"
                >
                  <span className="hidden xs:inline">Clear / মুছুন</span><span className="xs:hidden">Clear</span>
                </button>
              </div>
            </div>
          </div>

          {/* Availability Notice */}
          {eventDate && (
            <div className="max-w-4xl mx-auto mb-6 bg-accent-50 border-l-4 border-accent-500 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-accent-700">📞 Note:</span> Showing halls that support the selected time slot. 
                Please <span className="font-bold">call us</span> to confirm exact availability for {new Date(eventDate).toLocaleDateString('en-GB')} 
                {selectedTimeSlot === 'custom' && customStartTime && customEndTime && (
                  <span className="font-semibold"> ({customStartTime} - {customEndTime})</span>
                )}
                {selectedTimeSlot !== 'all' && selectedTimeSlot !== 'custom' && ` (${selectedTimeSlot} slot)`}.
              </p>
            </div>
          )}

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
                    href={`tel:${resortInfo?.phone || '+8801811480222'}`}
                    className="block text-center bg-gradient-to-r from-primary-600 to-primary-800 text-white py-3 rounded-lg hover:shadow-xl hover:from-primary-700 hover:to-primary-900 transition font-semibold"
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
          <div className="mt-16 bg-gradient-to-r from-primary-600 to-primary-800 text-white p-8 rounded-lg text-center shadow-xl">
            <h2 className="text-3xl font-heading font-bold mb-4">
              Ready to Book Your Event? / ইভেন্ট বুক করতে প্রস্তুত?
            </h2>
            <p className="text-lg mb-6">
              Contact our hotline for reservations and inquiries
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href={`tel:${resortInfo?.phone || '+8801811480222'}`}
                className="bg-white text-primary-700 px-8 py-3 rounded-lg font-bold inline-block shadow-md"
              >
                📞 Call Now: {resortInfo?.phone || '+8801811480222'}
              </a>
              <a 
                href={`https://wa.me/${resortInfo?.phone?.replace(/[^0-9]/g, '') || '8801811480222'}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition inline-block shadow-md"
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
