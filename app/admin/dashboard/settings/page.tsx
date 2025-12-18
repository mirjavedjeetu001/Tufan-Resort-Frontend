'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';

interface ResortInfo {
  id?: number;
  resortName?: string;
  resortTagline?: string;
  logoUrl?: string;
  navbarTitle?: string;
  aboutText: string;
  missionText?: string;
  footerDescription?: string;
  email: string;
  phone: string;
  address: string;
  mapEmbedUrl?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  copyrightText?: string;
  facilities?: string[];
  vatEnabled?: boolean;
  vatPercentage?: number;
  checkInCheckOutMode?: 'fixed' | 'automatic';
  defaultCheckInTime?: string;
  defaultCheckOutTime?: string;
}

interface NavbarLink {
  id: number;
  label: string;
  url: string;
  displayOrder: number;
  isActive: boolean;
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
  sectionId: number;
}

export default function ResortInfoManagement() {
  const { modalState, showModal, closeModal } = useModal();
  const [resortInfo, setResortInfo] = useState<ResortInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [navbarLinks, setNavbarLinks] = useState<NavbarLink[]>([]);
  const [footerSections, setFooterSections] = useState<FooterSection[]>([]);
  const [navbarLoading, setNavbarLoading] = useState(false);
  const [footerLoading, setFooterLoading] = useState(false);
  const [formData, setFormData] = useState<ResortInfo>({
    resortName: '',
    resortTagline: '',
    logoUrl: '',
    navbarTitle: '',
    aboutText: '',
    missionText: '',
    footerDescription: '',
    email: '',
    phone: '',
    address: '',
    mapEmbedUrl: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
    },
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    copyrightText: '',
    facilities: [],
    vatEnabled: false,
    vatPercentage: 0,
    checkInCheckOutMode: 'automatic',
    defaultCheckInTime: '14:00',
    defaultCheckOutTime: '12:00',
  });

  useEffect(() => {
    fetchResortInfo();
    fetchNavbarLinks();
    fetchFooterSections();
  }, []);

  const fetchNavbarLinks = async () => {
    try {
      setNavbarLoading(true);
      const response = await api.get('/navbar');
      if (response.data && Array.isArray(response.data)) {
        setNavbarLinks(response.data.sort((a: NavbarLink, b: NavbarLink) => a.displayOrder - b.displayOrder));
      }
    } catch (error) {
      console.error('Error fetching navbar links:', error);
    } finally {
      setNavbarLoading(false);
    }
  };

  const fetchFooterSections = async () => {
    try {
      setFooterLoading(true);
      const response = await api.get('/footer/sections');
      if (response.data && Array.isArray(response.data)) {
        setFooterSections(response.data.sort((a: FooterSection, b: FooterSection) => a.displayOrder - b.displayOrder));
      }
    } catch (error) {
      console.error('Error fetching footer sections:', error);
    } finally {
      setFooterLoading(false);
    }
  };

  const fetchResortInfo = async () => {
    try {
      const response = await api.get('/resort-info');
      if (response.data) {
        // Ensure socialLinks is an object and convert time format from HH:mm:ss to HH:mm
        const data = {
          ...response.data,
          socialLinks: response.data.socialLinks || { facebook: '', instagram: '', twitter: '' },
          facilities: response.data.facilities || [],
          defaultCheckInTime: response.data.defaultCheckInTime ? response.data.defaultCheckInTime.substring(0, 5) : '14:00',
          defaultCheckOutTime: response.data.defaultCheckOutTime ? response.data.defaultCheckOutTime.substring(0, 5) : '12:00',
        };
        setResortInfo(data);
        setFormData(data);
      }
    } catch (error) {
      console.error('Error fetching resort info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Convert time format from HH:mm to HH:mm:ss for MySQL
      const dataToSend = {
        ...formData,
        defaultCheckInTime: formData.defaultCheckInTime ? `${formData.defaultCheckInTime}:00` : '14:00:00',
        defaultCheckOutTime: formData.defaultCheckOutTime ? `${formData.defaultCheckOutTime}:00` : '12:00:00',
      };
      
      await api.put('/resort-info', dataToSend);
      showModal('Resort information updated successfully!', 'success');
      fetchResortInfo();
    } catch (error) {
      console.error('Error saving resort info:', error);
      showModal('Error saving resort information. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Resort Information</h1>
        <p className="text-gray-600 mt-1">Manage your resort's global settings and information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Branding & Identity */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 border-2 border-purple-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Branding & Identity
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🏨 Resort Name
              </label>
              <input
                type="text"
                value={formData.resortName || ''}
                onChange={(e) => setFormData({ ...formData, resortName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all"
                placeholder="Tufan Resort"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                ✨ Resort Tagline
              </label>
              <input
                type="text"
                value={formData.resortTagline || ''}
                onChange={(e) => setFormData({ ...formData, resortTagline: e.target.value })}
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all"
                placeholder="Your Lakeside Paradise"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                📱 Navbar Title
              </label>
              <input
                type="text"
                value={formData.navbarTitle || ''}
                onChange={(e) => setFormData({ ...formData, navbarTitle: e.target.value })}
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all"
                placeholder="Tufan Resort"
              />
              <p className="text-xs text-gray-600 mt-1">Displayed in website navigation bar</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🖼️ Logo URL
              </label>
              <input
                type="url"
                value={formData.logoUrl || ''}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all"
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-gray-600 mt-1">Full URL to your logo image</p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Basic Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                About Text *
              </label>
              <textarea
                required
                rows={4}
                value={formData.aboutText}
                onChange={(e) => setFormData({ ...formData, aboutText: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="Describe your resort, its features, and what makes it special..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Mission Text
              </label>
              <textarea
                rows={3}
                value={formData.missionText || ''}
                onChange={(e) => setFormData({ ...formData, missionText: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="Your resort's mission statement..."
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="info@tufanresort.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="+91 1234567890"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Address *
              </label>
              <textarea
                required
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="123 Lakeside Road, City, State - 123456"
              />
            </div>
          </div>
        </div>

        {/* Footer Content */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-6 border-2 border-blue-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Footer Content
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                📝 Footer Description
              </label>
              <textarea
                rows={3}
                value={formData.footerDescription || ''}
                onChange={(e) => setFormData({ ...formData, footerDescription: e.target.value })}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                placeholder="Experience luxury and tranquility in the heart of nature. Where every moment becomes a cherished memory."
              />
              <p className="text-xs text-gray-600 mt-1">Appears in the footer of your website</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                © Copyright Text
              </label>
              <textarea
                rows={2}
                value={formData.copyrightText || ''}
                onChange={(e) => setFormData({ ...formData, copyrightText: e.target.value })}
                className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                placeholder="© ২০২৫ Tufan Resort. সর্বস্বত্ব সংরক্ষিত / All rights reserved."
              />
              <p className="text-xs text-gray-600 mt-1">Copyright notice for footer (supports multiple lines)</p>
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            Social Media Links
          </h2>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook URL
              </label>
              <input
                type="url"
                value={formData.facebookUrl || ''}
                onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="https://facebook.com/tufanresort"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram URL
              </label>
              <input
                type="url"
                value={formData.instagramUrl || ''}
                onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="https://instagram.com/tufanresort"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Twitter URL
              </label>
              <input
                type="url"
                value={formData.twitterUrl || ''}
                onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="https://twitter.com/tufanresort"
              />
            </div>
          </div>
        </div>

        {/* Additional Settings */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Additional Settings
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Map Embed URL
              </label>
              <input
                type="url"
                value={formData.mapEmbedUrl || ''}
                onChange={(e) => setFormData({ ...formData, mapEmbedUrl: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="Google Maps embed URL"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.vatEnabled || false}
                  onChange={(e) => setFormData({ ...formData, vatEnabled: e.target.checked })}
                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                Enable VAT
              </label>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                VAT Percentage (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.vatPercentage || 0}
                onChange={(e) => setFormData({ ...formData, vatPercentage: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="0.00"
                disabled={!formData.vatEnabled}
              />
            </div>
          </div>
        </div>

        {/* Check-In/Check-Out Settings */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Check-In / Check-Out Settings
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Time Mode
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary hover:bg-primary/5 ${
                  formData.checkInCheckOutMode === 'fixed' ? 'border-primary bg-primary/10' : 'border-gray-200'
                }">
                  <input
                    type="radio"
                    name="checkInCheckOutMode"
                    value="fixed"
                    checked={formData.checkInCheckOutMode === 'fixed'}
                    onChange={(e) => setFormData({ ...formData, checkInCheckOutMode: 'fixed' })}
                    className="w-5 h-5 text-primary focus:ring-primary"
                  />
                  <div className="ml-3">
                    <div className="font-bold text-gray-800">📌 Fixed Default Time</div>
                    <div className="text-sm text-gray-600">Use default check-in/out times for all bookings</div>
                  </div>
                </label>
                
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary hover:bg-primary/5 ${
                  formData.checkInCheckOutMode === 'automatic' ? 'border-primary bg-primary/10' : 'border-gray-200'
                }">
                  <input
                    type="radio"
                    name="checkInCheckOutMode"
                    value="automatic"
                    checked={formData.checkInCheckOutMode === 'automatic'}
                    onChange={(e) => setFormData({ ...formData, checkInCheckOutMode: 'automatic' })}
                    className="w-5 h-5 text-primary focus:ring-primary"
                  />
                  <div className="ml-3">
                    <div className="font-bold text-gray-800">⚡ Automatic</div>
                    <div className="text-sm text-gray-600">Let users choose their preferred times</div>
                  </div>
                </label>
              </div>
            </div>

            {formData.checkInCheckOutMode === 'fixed' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Default Check-In Time
                  </label>
                  <input
                    type="time"
                    value={formData.defaultCheckInTime || '14:00'}
                    onChange={(e) => setFormData({ ...formData, defaultCheckInTime: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-lg font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Default Check-Out Time
                  </label>
                  <input
                    type="time"
                    value={formData.defaultCheckOutTime || '12:00'}
                    onChange={(e) => setFormData({ ...formData, defaultCheckOutTime: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-lg font-semibold"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navbar Menu Management - FULL CRUD */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl shadow-lg p-6 border-2 border-indigo-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Navbar Menu Links
            </h2>
            <button
              onClick={() => {
                const label = prompt('Enter link label (e.g., "Home")');
                if (!label) return;
                const url = prompt('Enter link URL (e.g., "/")');
                if (!url) return;
                const displayOrder = navbarLinks.length + 1;
                
                api.post('/navbar', {
                  label,
                  url,
                  displayOrder,
                  isActive: true
                })
                .then(() => {
                  fetchNavbarLinks();
                  alert('✅ Navbar link added successfully!');
                })
                .catch(err => {
                  console.error('Error adding navbar link:', err);
                  alert('❌ Error adding navbar link');
                });
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              ➕ Add Link
            </button>
          </div>
          
          {navbarLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {navbarLinks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No navbar links found. Click "Add Link" to create one.</p>
              ) : (
                navbarLinks.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-indigo-600">#{link.displayOrder}</span>
                      <div>
                        <div className="font-bold text-gray-800">{link.label}</div>
                        <div className="text-sm text-gray-500">{link.url}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {link.isActive ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">Active</span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold">Inactive</span>
                      )}
                      <button
                        onClick={() => {
                          const label = prompt('Edit label:', link.label);
                          if (!label) return;
                          const url = prompt('Edit URL:', link.url);
                          if (!url) return;
                          
                          api.put(`/navbar/${link.id}`, {
                            label,
                            url,
                            displayOrder: link.displayOrder,
                            isActive: link.isActive
                          })
                          .then(() => {
                            fetchNavbarLinks();
                            alert('✅ Link updated!');
                          })
                          .catch(err => alert('❌ Error updating link'));
                        }}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm font-semibold"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => {
                          if (!confirm(`Delete "${link.label}"?`)) return;
                          
                          api.delete(`/navbar/${link.id}`)
                          .then(() => {
                            fetchNavbarLinks();
                            alert('✅ Link deleted!');
                          })
                          .catch(err => alert('❌ Error deleting link'));
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Menu Management - FULL CRUD */}
        <div className="bg-gradient-to-r from-teal-50 to-green-50 rounded-2xl shadow-lg p-6 border-2 border-teal-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Footer Sections & Links
            </h2>
            <button
              onClick={() => {
                const title = prompt('Enter section title (e.g., "Quick Links"):');
                if (!title) return;
                const displayOrder = footerSections.length + 1;
                
                api.post('/footer/sections', {
                  title,
                  displayOrder,
                  isActive: true
                })
                .then(() => {
                  fetchFooterSections();
                  alert('✅ Footer section added successfully!');
                })
                .catch(err => {
                  console.error('Error adding footer section:', err);
                  alert('❌ Error adding footer section');
                });
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              ➕ Add Section
            </button>
          </div>
          
          {footerLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {footerSections.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No footer sections found. Click "Add Section" to create one.</p>
              ) : (
                footerSections.map((section) => (
                  <div key={section.id} className="p-4 bg-white rounded-lg border-2 border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-teal-600">#{section.displayOrder}</span>
                        <h3 className="font-bold text-lg text-gray-800">{section.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {section.isActive ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">Active</span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold">Inactive</span>
                        )}
                        <button
                          onClick={() => {
                            const label = prompt('Enter link label:');
                            if (!label) return;
                            const url = prompt('Enter link URL:');
                            if (!url) return;
                            const displayOrder = (section.links?.length || 0) + 1;
                            
                            api.post('/footer/links', {
                              sectionId: section.id,
                              label,
                              url,
                              displayOrder,
                              isActive: true
                            })
                            .then(() => {
                              fetchFooterSections();
                              alert('✅ Link added to section!');
                            })
                            .catch(err => alert('❌ Error adding link'));
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold"
                        >
                          ➕ Add Link
                        </button>
                        <button
                          onClick={() => {
                            const title = prompt('Edit section title:', section.title);
                            if (!title) return;
                            
                            api.put(`/footer/sections/${section.id}`, {
                              title,
                              displayOrder: section.displayOrder,
                              isActive: section.isActive
                            })
                            .then(() => {
                              fetchFooterSections();
                              alert('✅ Section updated!');
                            })
                            .catch(err => alert('❌ Error updating section'));
                          }}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm font-semibold"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => {
                            if (!confirm(`Delete "${section.title}" section?`)) return;
                            
                            api.delete(`/footer/sections/${section.id}`)
                            .then(() => {
                              fetchFooterSections();
                              alert('✅ Section deleted!');
                            })
                            .catch(err => alert('❌ Error deleting section'));
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                    <div className="ml-8 space-y-2">
                      {section.links && section.links.length > 0 ? (
                        section.links.map((link) => (
                          <div key={link.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-teal-500">→</span>
                              <span className="font-medium text-gray-700">{link.label}</span>
                              <span className="text-gray-400">({link.url})</span>
                            </div>
                            <button
                              onClick={() => {
                                if (!confirm(`Delete link "${link.label}"?`)) return;
                                
                                api.delete(`/footer/links/${link.id}`)
                                .then(() => {
                                  fetchFooterSections();
                                  alert('✅ Link deleted!');
                                })
                                .catch(err => alert('❌ Error deleting link'));
                              }}
                              className="bg-red-400 hover:bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold"
                            >
                              🗑️
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-sm">No links in this section. Click "Add Link" above.</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-primary to-teal-600 hover:from-primary/90 hover:to-teal-700 text-white px-8 py-4 rounded-lg font-bold text-lg shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Resort Information
              </span>
            )}
          </button>
        </div>
      </form>

      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
      />
    </div>
  );
}
