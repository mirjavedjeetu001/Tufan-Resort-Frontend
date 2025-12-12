'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { conventionHallAPI } from '@/lib/api';

export default function ConventionHallPage() {
  const [halls, setHalls] = useState([]);
  const [selectedHall, setSelectedHall] = useState<any>(null);

  useEffect(() => {
    fetchHalls();
  }, []);

  const fetchHalls = async () => {
    try {
      const response = await conventionHallAPI.getAll();
      setHalls(response.data);
      if (response.data.length > 0) {
        setSelectedHall(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching halls:', error);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-heading font-bold text-center mb-4">Convention Hall</h1>
          <p className="text-center text-gray-600 mb-12">Perfect venue for your events</p>

          {selectedHall ? (
            <div className="max-w-6xl mx-auto">
              {/* Hero Image Carousel */}
              <div className="h-96 bg-gradient-to-r from-primary to-blue-600 rounded-lg mb-8"></div>

              {/* Hall Details */}
              <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                <h2 className="text-4xl font-heading font-bold mb-6">{selectedHall.name}</h2>
                <p className="text-lg text-gray-700 mb-8">{selectedHall.description}</p>

                {/* Key Stats */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-secondary p-6 rounded-lg text-center">
                    <p className="text-4xl font-bold text-primary">{selectedHall.dimensions}</p>
                    <p className="text-gray-600 mt-2">Square Feet</p>
                  </div>
                  <div className="bg-secondary p-6 rounded-lg text-center">
                    <p className="text-4xl font-bold text-primary">{selectedHall.maxCapacity}</p>
                    <p className="text-gray-600 mt-2">Max Capacity</p>
                  </div>
                  <div className="bg-secondary p-6 rounded-lg text-center">
                    <p className="text-4xl font-bold text-primary">{selectedHall.eventTypes?.length || 0}</p>
                    <p className="text-gray-600 mt-2">Event Types</p>
                  </div>
                </div>

                {/* Amenities */}
                <div className="mb-8">
                  <h3 className="text-2xl font-heading font-bold mb-4">Amenities</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {selectedHall.amenities?.map((amenity: string, idx: number) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <span className="text-primary text-xl">✓</span>
                        <span className="text-gray-700">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Event Types */}
                <div className="mb-8">
                  <h3 className="text-2xl font-heading font-bold mb-4">Event Types We Host</h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedHall.eventTypes?.map((type: string, idx: number) => (
                      <span key={idx} className="bg-primary text-white px-4 py-2 rounded-full">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Time Slots */}
                <div className="mb-8">
                  <h3 className="text-2xl font-heading font-bold mb-4">Available Time Slots</h3>
                  <div className="grid md:grid-cols-4 gap-3">
                    {selectedHall.timeSlots?.map((slot: string, idx: number) => (
                      <div key={idx} className="bg-secondary p-3 rounded-lg text-center">
                        {slot}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Add-Ons Section */}
              <div className="bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg p-8 mb-8">
                <h3 className="text-3xl font-heading font-bold mb-4">Additional Services</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                    <h4 className="font-bold text-xl mb-2">🍽️ Catering</h4>
                    <p>Full-service catering with customizable menus</p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                    <h4 className="font-bold text-xl mb-2">🎵 Sound System</h4>
                    <p>Professional audio and lighting equipment</p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                    <h4 className="font-bold text-xl mb-2">🎨 Decoration</h4>
                    <p>Custom decoration services for your event</p>
                  </div>
                </div>
              </div>

              {/* Contact CTA */}
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <h3 className="text-3xl font-heading font-bold mb-4">Ready to Book?</h3>
                <p className="text-lg text-gray-700 mb-6">
                  Contact us to check availability and get a custom quote for your event
                </p>
                <div className="flex justify-center gap-4">
                  <a 
                    href="tel:+880-XXX-XXXXXX"
                    className="bg-primary text-white px-8 py-4 rounded-lg font-bold hover:bg-teal-700 transition"
                  >
                    📞 Call Now
                  </a>
                  <a 
                    href="https://wa.me/880XXXXXXXXX"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-500 text-white px-8 py-4 rounded-lg font-bold hover:bg-green-600 transition"
                  >
                    💬 WhatsApp
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">No convention hall information available.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
