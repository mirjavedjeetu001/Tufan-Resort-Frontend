'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resortName, setResortName] = useState('Tufan Resort');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/admin');
    } else {
      setUser(JSON.parse(userData));
      fetchResortInfo();
    }
  }, []);

  const fetchResortInfo = async () => {
    try {
      const response = await axios.get('http://localhost:3001/resort-info');
      if (response.data) {
        setResortName(response.data.resortName || 'Tufan Resort');
      }
    } catch (error) {
      console.error('Error fetching resort info:', error);
    }
  };

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/admin');
  };

  const menuItems = [
    {
      name: 'Dashboard',
      icon: '📊',
      path: '/admin/dashboard',
      permission: 'dashboard.view',
    },
    {
      name: "Today's Summary",
      icon: '📅',
      path: '/admin/dashboard/todays-summary',
      permission: 'dashboard.view',
    },
    { divider: true },
    {
      name: 'Room Booking',
      icon: '➕',
      path: '/admin/dashboard/premium-booking',
      permission: 'bookings.manage',
    },
    {
      name: 'Rooms',
      icon: '🏠',
      path: '/admin/dashboard/rooms',
      permission: 'rooms.manage',
    },
    {
      name: 'Room Types',
      icon: '🏷️',
      path: '/admin/dashboard/room-types',
      permission: 'rooms.manage',
    },
    {
      name: 'Room Bookings',
      icon: '📝',
      path: '/admin/dashboard/bookings',
      permission: 'bookings.manage',
    },
    {
      name: 'Room Bookings Report',
      icon: '📊',
      path: '/admin/dashboard/reports/room-bookings',
      permission: 'bookings.manage',
    },
    { divider: true },
    {
      name: 'Convention Halls',
      icon: '🏛️',
      path: '/admin/dashboard/convention',
      permission: 'convention.manage',
    },
    {
      name: 'New Convention Booking',
      icon: '📝',
      path: '/admin/dashboard/premium-convention',
      permission: 'convention-bookings.manage',
    },
    {
      name: 'Convention Bookings',
      icon: '🎫',
      path: '/admin/dashboard/convention-bookings',
      permission: 'convention-bookings.manage',
    },
    {
      name: 'Convention Report',
      icon: '📈',
      path: '/admin/dashboard/reports/convention-bookings',
      permission: 'convention-bookings.manage',
    },
    {
      name: 'Add-on Services',
      icon: '➕',
      path: '/admin/dashboard/addon-services',
      permission: 'addon-services.manage',
    },
    {
      name: 'Food Packages',
      icon: '🍽️',
      path: '/admin/dashboard/food-packages',
      permission: 'food-packages.manage',
    },
    { divider: true },
    {
      name: 'Hero Slides',
      icon: '🖼️',
      path: '/admin/dashboard/hero-slides',
      permission: 'hero-slides.manage',
    },
    {
      name: 'Resort Settings',
      icon: '⚙️',
      path: '/admin/dashboard/settings',
      permission: 'resort-settings.manage',
    },
    {
      name: 'Users',
      icon: '👥',
      path: '/admin/dashboard/users',
      permission: 'users.manage',
    },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Navigation Bar */}
      <nav className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-700 text-white shadow-xl sticky top-0 z-50">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-white p-2 hover:bg-white/10 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold">🏞️ {resortName}</h1>
              <p className="text-xs text-green-100 hidden sm:block">Resort & Convention Hall Management System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="hidden md:flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="font-semibold">View Website</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-3 bg-white/10 px-4 py-2 rounded-lg">
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center font-bold text-white text-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-xs text-green-100 capitalize">{user.role}</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="bg-secondary-600 hover:bg-secondary-700 px-3 sm:px-4 py-2 rounded-lg font-semibold shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 w-64 bg-white shadow-2xl transition-transform duration-300 ease-in-out z-40 top-16 lg:top-0`}
        >
          <div className="p-4 h-full overflow-y-auto pt-6">
            <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-green-50 rounded-xl border-2 border-primary/20">
              <p className="text-xs font-bold text-gray-600 mb-1">ADMIN PANEL</p>
              <p className="text-lg font-bold text-primary">Full Access ✓</p>
            </div>
            
            <nav className="space-y-2">
              {menuItems
                .filter((item) => {
                  if (item.divider) return true;
                  if (!user) return false;
                  if (user.role === 'owner') return true;
                  if (!item.permission) return true;
                  // allow legacy users without permissions defined
                  if (!user.permissions || user.permissions.length === 0) return true;
                  return user.permissions.includes(item.permission);
                })
                .map((item, index) => {
                if (item.divider) {
                  return (
                    <div key={`divider-${index}`} className="py-2">
                      <div className="border-t-2 border-gray-200"></div>
                    </div>
                  );
                }
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-primary to-primary-600 text-white shadow-lg transform scale-105'
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 hover:text-primary'
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span>{item.name}</span>
                    {isActive && (
                      <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen lg:ml-0">
          <div className="p-0">{children}</div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 top-16"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
