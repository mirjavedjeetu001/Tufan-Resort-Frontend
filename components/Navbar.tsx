'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 text-white shadow-premium-lg fixed w-full z-50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="text-3xl font-heading font-bold tracking-wide hover:scale-105 transition-transform duration-300">
            <span className="bg-gradient-to-r from-accent-400 to-accent-500 bg-clip-text text-transparent">Tufan</span>
            <span className="text-white"> Resort</span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            <Link href="/" className="px-4 py-2 rounded-lg hover:bg-white/10 hover:text-accent-400 transition-all duration-300 font-medium">
              Home
            </Link>
            <Link href="/rooms" className="px-4 py-2 rounded-lg hover:bg-white/10 hover:text-accent-400 transition-all duration-300 font-medium">
              Rooms
            </Link>
            <Link href="/convention-hall" className="px-4 py-2 rounded-lg hover:bg-white/10 hover:text-accent-400 transition-all duration-300 font-medium">
              Convention Hall
            </Link>
            <Link href="/about" className="px-4 py-2 rounded-lg hover:bg-white/10 hover:text-accent-400 transition-all duration-300 font-medium">
              About
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 animate-fade-in">
            <div className="space-y-2 bg-white/10 backdrop-blur-lg rounded-lg p-4">
              <Link href="/" className="block py-3 px-4 rounded-lg hover:bg-white/10 hover:text-accent-400 transition-all duration-300">
                Home
              </Link>
              <Link href="/rooms" className="block py-3 px-4 rounded-lg hover:bg-white/10 hover:text-accent-400 transition-all duration-300">
                Rooms
              </Link>
              <Link href="/convention-hall" className="block py-3 px-4 rounded-lg hover:bg-white/10 hover:text-accent-400 transition-all duration-300">
                Convention Hall
              </Link>
              <Link href="/about" className="block py-3 px-4 rounded-lg hover:bg-white/10 hover:text-accent-400 transition-all duration-300">
                About
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
