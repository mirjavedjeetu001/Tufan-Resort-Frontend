'use client';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-dot-pattern opacity-5"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <h3 className="text-3xl font-heading font-bold mb-4 bg-gradient-to-r from-accent-400 to-accent-500 bg-clip-text text-transparent">
              Tufan Resort
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Experience luxury and tranquility in the heart of nature. Where every moment becomes a cherished memory.
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-primary-500 flex items-center justify-center transition-all duration-300 hover:scale-110">
                <span>📘</span>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-pink-500 flex items-center justify-center transition-all duration-300 hover:scale-110">
                <span>📷</span>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-blue-400 flex items-center justify-center transition-all duration-300 hover:scale-110">
                <span>🐦</span>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-heading font-bold mb-4 text-accent-400">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-400 hover:text-accent-400 transition-colors duration-300 flex items-center group">
                  <span className="mr-2 group-hover:translate-x-1 transition-transform">→</span> Home
                </Link>
              </li>
              <li>
                <Link href="/rooms" className="text-gray-400 hover:text-accent-400 transition-colors duration-300 flex items-center group">
                  <span className="mr-2 group-hover:translate-x-1 transition-transform">→</span> Rooms
                </Link>
              </li>
              <li>
                <Link href="/convention-hall" className="text-gray-400 hover:text-accent-400 transition-colors duration-300 flex items-center group">
                  <span className="mr-2 group-hover:translate-x-1 transition-transform">→</span> Convention Hall
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-accent-400 transition-colors duration-300 flex items-center group">
                  <span className="mr-2 group-hover:translate-x-1 transition-transform">→</span> About
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-heading font-bold mb-4 text-accent-400">Services</h4>
            <ul className="space-y-3 text-gray-400">
              <li className="hover:text-accent-400 transition-colors cursor-pointer">🛏️ Luxury Rooms</li>
              <li className="hover:text-accent-400 transition-colors cursor-pointer">🎭 Convention Hall</li>
              <li className="hover:text-accent-400 transition-colors cursor-pointer">🍽️ Fine Dining</li>
              <li className="hover:text-accent-400 transition-colors cursor-pointer">🏊 Swimming Pool</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-heading font-bold mb-4 text-accent-400">Contact Us</h4>
            <div className="space-y-3">
              <p className="text-gray-400 flex items-start group cursor-pointer hover:text-accent-400 transition-colors">
                <span className="mr-2 text-accent-500">📞</span>
                <span>+880-XXX-XXXXXX</span>
              </p>
              <p className="text-gray-400 flex items-start group cursor-pointer hover:text-accent-400 transition-colors">
                <span className="mr-2 text-accent-500">📧</span>
                <span>info@tufanresort.com</span>
              </p>
              <p className="text-gray-400 flex items-start group cursor-pointer hover:text-accent-400 transition-colors">
                <span className="mr-2 text-accent-500">📍</span>
                <span>Location, City, Country</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-10 pt-8 text-center">
          <p className="text-gray-400">
            &copy; 2025 <span className="text-accent-400 font-semibold">Tufan Resort</span>. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Developed with ❤️ by <span className="text-primary-400 font-semibold">Mir Javed Jahanger</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
