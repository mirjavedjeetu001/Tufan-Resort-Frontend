'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function InstallPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    resortName: 'Tufan Resort',
    resortTagline: 'Your Perfect Getaway',
  });

  useEffect(() => {
    checkInstallStatus();
  }, []);

  const checkInstallStatus = async () => {
    try {
      const response = await axios.get('http://localhost:3001/system/install-status');
      if (response.data.installed) {
        router.push('/admin');
      }
    } catch (error) {
      console.error('Error checking install status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setInstalling(true);

    try {
      const response = await axios.post('http://localhost:3001/system/install', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        resortName: formData.resortName,
        resortTagline: formData.resortTagline,
      });

      if (response.data.success) {
        router.push('/admin');
      } else {
        setError(response.data.message);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Installation failed');
    } finally {
      setInstalling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-yellow-500">
        <div className="text-white text-2xl">Checking installation status...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 via-green-700 to-yellow-600 p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🏞️ Welcome to Tufan Resort CMS</h1>
          <p className="text-gray-600">Let's set up your resort management system</p>
        </div>

        <form onSubmit={handleInstall} className="space-y-6">
          {error && (
            <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-green-50 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-green-800 mb-4">👤 Super Admin Account</h2>
            
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                placeholder="admin@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                placeholder="Minimum 6 characters"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Confirm Password *</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
                placeholder="Re-enter password"
                required
              />
            </div>
          </div>

          <div className="bg-yellow-50 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-yellow-800 mb-4">🏨 Resort Information</h2>
            
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Resort Name *</label>
              <input
                type="text"
                value={formData.resortName}
                onChange={(e) => setFormData({ ...formData, resortName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-600 focus:border-yellow-600"
                placeholder="Your Resort Name"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Tagline</label>
              <input
                type="text"
                value={formData.resortTagline}
                onChange={(e) => setFormData({ ...formData, resortTagline: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-600 focus:border-yellow-600"
                placeholder="A catchy tagline for your resort"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={installing}
            className="w-full bg-gradient-to-r from-green-600 to-yellow-500 text-white py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-yellow-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {installing ? '🔄 Installing...' : '🚀 Install & Create Super Admin'}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            This will create your super admin account and set up the system
          </p>
        </form>
      </div>
    </div>
  );
}
