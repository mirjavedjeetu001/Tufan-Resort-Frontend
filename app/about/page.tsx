'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { resortInfoAPI } from '@/lib/api';

export default function AboutPage() {
  const [resortInfo, setResortInfo] = useState<any>(null);

  useEffect(() => {
    fetchResortInfo();
  }, []);

  const fetchResortInfo = async () => {
    try {
      const response = await resortInfoAPI.get();
      setResortInfo(response.data);
    } catch (error) {
      console.error('Error fetching resort info:', error);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-heading font-bold text-center mb-4">About Tufan Resort</h1>
          <p className="text-center text-gray-600 mb-12">Your sanctuary of luxury and tranquility</p>

          <div className="max-w-4xl mx-auto">
            {/* About Section */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-3xl font-heading font-bold mb-4">Our Story</h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                {resortInfo?.aboutText || 'Welcome to Tufan Resort, where luxury meets nature. Experience world-class hospitality in our premium accommodations and state-of-the-art convention facilities.'}
              </p>
              {resortInfo?.missionText && (
                <>
                  <h3 className="text-2xl font-heading font-bold mb-3">Our Mission</h3>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {resortInfo.missionText}
                  </p>
                </>
              )}
            </div>

            {/* Facilities */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-3xl font-heading font-bold mb-6">Facilities & Amenities</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {resortInfo?.facilities?.length > 0 ? resortInfo.facilities.map((facility: string, idx: number) => (
                  <div key={idx} className="flex items-center space-x-3 bg-secondary p-4 rounded-lg">
                    <span className="text-primary text-2xl">✓</span>
                    <span className="text-lg">{facility}</span>
                  </div>
                )) : (
                  <>
                    <div className="flex items-center space-x-3 bg-secondary p-4 rounded-lg">
                      <span className="text-primary text-2xl">✓</span>
                      <span className="text-lg">Swimming Pool</span>
                    </div>
                    <div className="flex items-center space-x-3 bg-secondary p-4 rounded-lg">
                      <span className="text-primary text-2xl">✓</span>
                      <span className="text-lg">Spa & Wellness Center</span>
                    </div>
                    <div className="flex items-center space-x-3 bg-secondary p-4 rounded-lg">
                      <span className="text-primary text-2xl">✓</span>
                      <span className="text-lg">Fine Dining Restaurant</span>
                    </div>
                    <div className="flex items-center space-x-3 bg-secondary p-4 rounded-lg">
                      <span className="text-primary text-2xl">✓</span>
                      <span className="text-lg">Conference Facilities</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-3xl font-heading font-bold mb-6">Location</h2>
              <div className="mb-6">
                <p className="text-lg text-gray-700">
                  📍 {resortInfo?.address || 'Location, City, Country'}
                </p>
              </div>
              {resortInfo?.mapEmbedUrl && (
                <div className="h-96 bg-gray-200 rounded-lg">
                  <iframe
                    src={resortInfo.mapEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="rounded-lg"
                  ></iframe>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="bg-primary text-white rounded-lg shadow-lg p-8 text-center">
              <h2 className="text-3xl font-heading font-bold mb-6">Contact Us</h2>
              <div className="space-y-4 text-lg">
                <p>📞 Hotline: {resortInfo?.phone || '+880-XXX-XXXXXX'}</p>
                <p>📧 Email: {resortInfo?.email || 'info@tufanresort.com'}</p>
                <p>📍 Address: {resortInfo?.address || 'Location, City, Country'}</p>
              </div>
              {resortInfo?.socialLinks && (
                <div className="flex justify-center gap-4 mt-6">
                  {resortInfo.socialLinks.facebook && (
                    <a href={resortInfo.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition">
                      Facebook
                    </a>
                  )}
                  {resortInfo.socialLinks.instagram && (
                    <a href={resortInfo.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition">
                      Instagram
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
