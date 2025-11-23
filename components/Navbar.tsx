'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Activity, Menu, X, User, LogOut, MapPin } from 'lucide-react';
import Image from 'next/image';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userLocation, setUserLocation] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  // Mock location data based on role
  const getLocationByRole = (role: string) => {
    if (role === 'nakes') {
      return 'Puskesmas Sungai Raya, Kalimantan Barat';
    } else if (role === 'doctor') {
      return 'RSUD Dr. Soetomo, Surabaya';
    }
    return '';
  };

  useEffect(() => {
    // Check if user is logged in
    const checkAuthState = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (token && user) {
        setIsLoggedIn(true);
        try {
          const userData = JSON.parse(user);
          setUserName(userData.name);
          setUserRole(userData.role);
          setUserLocation(getLocationByRole(userData.role));
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      } else {
        setIsLoggedIn(false);
        setUserName('');
        setUserRole('');
        setUserLocation('');
      }
    };

    // Check on mount
    checkAuthState();

    // Listen for login/logout events
    window.addEventListener('userLoggedIn', checkAuthState);
    window.addEventListener('userLoggedOut', checkAuthState);

    return () => {
      window.removeEventListener('userLoggedIn', checkAuthState);
      window.removeEventListener('userLoggedOut', checkAuthState);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUserName('');
    setUserRole('');
    setUserLocation('');
    window.dispatchEvent(new Event('userLoggedOut'));
    router.push('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative h-10 w-auto">
                <Image 
                  src="/images/djaja-horizontal-notext.png" 
                  alt="Djaja Logo" 
                  height={40} 
                  width={80}
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            { !isLoggedIn && (
            <Link href="/">
              <Button variant="ghost" className={pathname === '/' ? 'bg-primary/10 text-primary' : ''}>Home</Button>
            </Link>)
            }
            {isLoggedIn && (
              <>
                {userRole !== 'doctor' && (
                  <Link href="/device-simulator">
                    <Button variant="ghost" className={pathname === '/device-simulator/' ? 'bg-primary/10 text-primary' : ''}>Device Simulator</Button>
                  </Link>
                )}
                {userRole !== 'nakes' && (
                  <Link href="/dashboard">
                    <Button variant="ghost" className={pathname === '/dashboard/' ? 'bg-primary/10 text-primary' : ''}>Dashboard</Button>
                  </Link>
                )}
                <Link href="/patients">
                  <Button variant="ghost" className={pathname === '/patients/' ? 'bg-primary/10 text-primary' : ''}>Medical Records</Button>
                </Link>
                <Link href="/teleconsultation">
                  <Button variant="ghost" className={pathname === '/teleconsultation/' ? 'bg-primary/10 text-primary' : ''}>Teleconsultation</Button>
                </Link>
              </>
            )}

            {/* Auth Buttons */}
            {isLoggedIn ? (
              <div className="flex items-center gap-2 ml-4">
                {(userRole === 'nakes' || userRole === 'doctor') && userLocation && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-lg max-w-xs">
                    <MapPin className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                    <span className="text-xs font-medium text-green-700 truncate" title={userLocation}>
                      {userLocation}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{userName}</span>
                </div>
                <Button onClick={handleLogout} variant="outline" size="sm">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-4">
                <Link href="/auth/login">
                  <Button variant="outline">Login</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Register</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/" onClick={() => setIsOpen(false)}>
              <Button variant="ghost" className={`w-full justify-start ${pathname === '/' ? 'bg-primary/10 text-primary' : ''}`}>
                Home
              </Button>
            </Link>
            {isLoggedIn && (
              <>
                {userRole !== 'doctor' && (
                  <Link href="/device-simulator" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className={`w-full justify-start ${pathname === '/device-simulator/' ? 'bg-primary/10 text-primary' : ''}`}>
                      Device Simulator
                    </Button>
                  </Link>
                )}
                {userRole !== 'nakes' && (
                  <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className={`w-full justify-start ${pathname === '/dashboard/' ? 'bg-primary/10 text-primary' : ''}`}>
                      Dashboard
                    </Button>
                  </Link>
                )}
                <Link href="/patients" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className={`w-full justify-start ${pathname === '/patients/' ? 'bg-primary/10 text-primary' : ''}`}>
                    Medical Records
                  </Button>
                </Link>
                <Link href="/teleconsultation" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className={`w-full justify-start ${pathname === '/teleconsultation/' ? 'bg-primary/10 text-primary' : ''}`}>
                    Teleconsultation
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Auth */}
            <div className="pt-4 border-t border-gray-200 mt-4">
              {isLoggedIn ? (
                <div className="space-y-2">
                  {(userRole === 'nakes' || userRole === 'doctor') && userLocation && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                      <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-green-700">
                        {userLocation}
                      </span>
                    </div>
                  )}
                  <div className="px-3 py-2 bg-primary/10 rounded-lg flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{userName}</span>
                  </div>
                  <Button 
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }} 
                    variant="outline" 
                    className="w-full"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link href="/auth/register" onClick={() => setIsOpen(false)}>
                    <Button className="w-full">Register</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
