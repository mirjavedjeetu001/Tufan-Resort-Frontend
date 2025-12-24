'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import axios from 'axios';

interface ResortInfo {
  resortName?: string;
  footerDescription?: string;
  email?: string;
  phone?: string;
  address?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  copyrightText?: string;
}

interface FooterSection {
  id: number;
  title: string;
  displayOrder: number;
  isActive: boolean;
  links: FooterLink[];
}

interface FooterLink {
  id: number;
  label: string;
  url: string;
  displayOrder: number;
  isActive: boolean;
}

export default function Footer() {
  const [resortInfo, setResortInfo] = useState<ResortInfo>({
    resortName: 'Tufan Resort',
    footerDescription: 'Experience luxury and tranquility in the heart of nature. Where every moment becomes a cherished memory.',
    email: 'info@tufanresort.com',
    phone: '+880-XXX-XXXXXX',
    address: 'Location, City, Country',
    copyrightText: '© ২০২৫ Tufan Resort. সর্বস্বত্ব সংরক্ষিত / All rights reserved.\n\nMade in Bangladesh 🇧🇩 with ❤️'
  });
  const [footerSections, setFooterSections] = useState<FooterSection[]>([]);

  useEffect(() => {
    fetchResortInfo();
    fetchFooterSections();
  }, []);

  const fetchResortInfo = async () => {
    try {
      const response = await axios.get('http://localhost:3001/resort-info');
      if (response.data) {
        setResortInfo(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Error fetching resort info:', error);
    }
  };

  const fetchFooterSections = async () => {
    try {
      const response = await axios.get('http://localhost:3001/footer/sections/active');
      if (response.data && Array.isArray(response.data)) {
        setFooterSections(response.data);
      }
    } catch (error) {
      console.error('Error fetching footer sections:', error);
    }
  };

  return (
    <footer className="bg-gradient-to-br from-primary-900 via-primary-800 to-gray-900 text-white py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-dot-pattern opacity-5"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className={`grid gap-8 ${footerSections.length === 0 ? 'md:grid-cols-1' : footerSections.length === 1 ? 'md:grid-cols-2' : footerSections.length === 2 ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
          {/* Resort Info Column - Always First */}
          <div>
            <h3 className="text-3xl font-heading font-bold mb-4 text-white">
              {resortInfo.resortName}
            </h3>
            <p className="text-white leading-relaxed">
              {resortInfo.footerDescription}
            </p>
            <div className="flex space-x-4 mt-6">
              {resortInfo.facebookUrl && (
                <a 
                  href={resortInfo.facebookUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-primary-600 flex items-center justify-center transition-all duration-300 hover:scale-110"
                  title="Facebook"
                >
                  <span>📘</span>
                </a>
              )}
              {resortInfo.instagramUrl && (
                <a 
                  href={resortInfo.instagramUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-pink-500 flex items-center justify-center transition-all duration-300 hover:scale-110"
                  title="Instagram"
                >
                  <span>📷</span>
                </a>
              )}
              {resortInfo.twitterUrl && (
                <a 
                  href={resortInfo.twitterUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-blue-400 flex items-center justify-center transition-all duration-300 hover:scale-110"
                  title="Twitter"
                >
                  <span>🐦</span>
                </a>
              )}
            </div>
          </div>
          
          {/* Dynamic Footer Sections - Quick Links, Services, Contact, etc. */}
          {footerSections.map((section) => (
            <div key={section.id}>
              <h4 className="text-lg font-heading font-bold mb-4 text-accent-400">{section.title}</h4>
              <ul className="space-y-3">
                {section.links && section.links.map((link) => (
                  <li key={link.id}>
                    {link.url.startsWith('http') ? (
                      <a 
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-accent transition-colors duration-300 flex items-center group"
                      >
                        <span className="mr-2 group-hover:translate-x-1 transition-transform">→</span> {link.label}
                      </a>
                    ) : link.url.startsWith('tel:') ? (
                      <a 
                        href={link.url}
                        className="text-white hover:text-accent transition-colors duration-300 flex items-start group"
                      >
                        <span className="mr-2 text-accent">📞</span>
                        <span>{link.label}</span>
                      </a>
                    ) : link.url.startsWith('mailto:') ? (
                      <a 
                        href={link.url}
                        className="text-white hover:text-accent transition-colors duration-300 flex items-start group"
                      >
                        <span className="mr-2 text-accent">📧</span>
                        <span>{link.label}</span>
                      </a>
                    ) : link.url === '#address' ? (
                      <div className="text-white flex items-start">
                        <span className="mr-2 text-accent">📍</span>
                        <span>{link.label}</span>
                      </div>
                    ) : (
                      <Link 
                        href={link.url} 
                        className="text-white hover:text-accent transition-colors duration-300 flex items-center group"
                      >
                        <span className="mr-2 group-hover:translate-x-1 transition-transform">→</span> {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-700 mt-10 pt-8 text-center">
          {resortInfo.copyrightText ? (
            <div className="text-white whitespace-pre-line">
              {resortInfo.copyrightText}
            </div>
          ) : (
            <>
              <p className="text-white">
                &copy; ২০২৫ <span className="text-white font-semibold">{resortInfo.resortName}</span>. সর্বস্বত্ব সংরক্ষিত / All rights reserved.
              </p>
              <p className="text-white text-sm mt-2">
                Made in Bangladesh 🇧🇩 with ❤️
              </p>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
