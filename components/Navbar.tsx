'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import axios from 'axios';

interface ResortInfo {
  resortName?: string;
  navbarTitle?: string;
  logoUrl?: string;
}

interface NavbarLink {
  id: number;
  label: string;
  url: string;
  displayOrder: number;
  isActive: boolean;
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [resortInfo, setResortInfo] = useState<ResortInfo>({ resortName: 'Tufan Resort' });
  const [navLinks, setNavLinks] = useState<NavbarLink[]>([]);

  useEffect(() => {
    fetchResortInfo();
    fetchNavLinks();
  }, []);

  const fetchResortInfo = async () => {
    try {
      const response = await axios.get('http://localhost:3001/resort-info');
      if (response.data) {
        setResortInfo(response.data);
      }
    } catch (error) {
      console.error('Error fetching resort info:', error);
    }
  };

  const fetchNavLinks = async () => {
    try {
      const response = await axios.get('http://localhost:3001/navbar/active');
      if (response.data && Array.isArray(response.data)) {
        setNavLinks(response.data);
      }
    } catch (error) {
      console.error('Error fetching navbar links:', error);
      // Fallback to default links if API fails
      setNavLinks([
        { id: 1, label: 'Home', url: '/', displayOrder: 1, isActive: true },
        { id: 2, label: 'Rooms', url: '/rooms', displayOrder: 2, isActive: true },
        { id: 3, label: 'Convention Hall', url: '/convention-hall', displayOrder: 3, isActive: true },
        { id: 4, label: 'About', url: '/about', displayOrder: 4, isActive: true },
      ]);
    }
  };

  const displayName = resortInfo.navbarTitle || resortInfo.resortName || 'Tufan Resort';
  const words = displayName.split(' ');
  const firstWord = words[0];
  const restWords = words.slice(1).join(' ');

  return (
    <nav className="bg-gradient-to-r from-primary-700 to-primary-900 text-white shadow-lg fixed w-full z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="flex items-center gap-3 hover:scale-105 transition-transform duration-300">
            {resortInfo.logoUrl && (
              <img 
                src={`http://localhost:3001${resortInfo.logoUrl}`}
                alt={displayName}
                className="h-12 w-12 object-contain rounded-lg bg-white/10 p-1.5 shadow-md"
              />
            )}
            <span className="text-3xl font-heading font-bold tracking-wide text-accent">
              {displayName}
            </span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link 
                key={link.id}
                href={link.url} 
                className="px-4 py-2 rounded-lg hover:bg-white/10 hover:text-accent-400 transition-all duration-300 font-medium"
              >
                {link.label}
              </Link>
            ))}
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
              {navLinks.map((link) => (
                <Link 
                  key={link.id}
                  href={link.url} 
                  className="block py-3 px-4 rounded-lg hover:bg-white/10 hover:text-accent-400 transition-all duration-300"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
