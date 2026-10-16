import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Droplet, AlertTriangle, Menu, X, HeartHandshake, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'How It Works', path: '/#how-it-works' },
    { name: 'Find Donors', path: '/find-donors' },
    { name: 'Blood Requests', path: '/requests' },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' && !location.hash;
    }
    if (path.startsWith('/#')) {
      return location.hash === path.substring(1);
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Left: LifeDrop Logo */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#991B1B] via-[#B91C1C] to-[#C62828] p-2 flex items-center justify-center text-white shadow-md shadow-red-900/10 group-hover:scale-105 transition-transform">
              <Droplet className="w-6 h-6 fill-white stroke-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline text-2xl font-black tracking-tight leading-none">
                <span className="text-[#0F172A]">Life</span>
                <span className="text-[#DC2626]">Drop</span>
              </div>
              <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">
                Blood Donation Network
              </span>
            </div>
          </Link>

          {/* Center Links (Desktop) */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-sm font-semibold px-4 py-2 rounded-full transition-all duration-200 ${
                    active
                      ? 'bg-[#FEE2E2] text-[#991B1B] shadow-sm'
                      : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/70'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {/* EMERGENCY SOS Button */}
            <Link
              to="/emergency-sos"
              className="bg-gradient-to-r from-[#DC2626] to-[#991B1B] hover:from-[#EF4444] hover:to-[#B91C1C] text-white text-xs font-black px-4 py-2.5 rounded-full shadow-sos hover:shadow-sos-hover transition-all duration-300 flex items-center gap-2 tracking-wider uppercase transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <AlertTriangle className="w-4 h-4 animate-bounce text-amber-200" />
              <span>EMERGENCY SOS</span>
            </Link>

            <div className="w-px h-6 bg-slate-200 mx-1"></div>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-navy-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <User className="w-4 h-4 text-primary-600" />
                  <span>{user?.name?.split(' ')[0] || 'My Account'}</span>
                  {user?.bloodGroup && (
                    <span className="bg-primary-100 text-primary-800 text-xs px-2 py-0.5 rounded-full font-bold">
                      {user.bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')}
                    </span>
                  )}
                </Link>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-slate-700 hover:text-navy-900 font-semibold text-sm px-3 py-2 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow hover:scale-[1.02] active:scale-[0.98]"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              to="/emergency-sos"
              className="bg-gradient-to-r from-[#DC2626] to-[#991B1B] text-white text-[11px] font-black px-2.5 py-1.5 rounded-full shadow-sos flex items-center gap-1 uppercase"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />
              <span>SOS</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 shadow-xl space-y-3">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-base font-semibold transition-colors ${
                    active
                      ? 'bg-[#FEE2E2] text-[#991B1B]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <Link
              to="/emergency-sos"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full bg-gradient-to-r from-[#DC2626] to-[#991B1B] text-white font-black py-3 rounded-xl shadow-sos flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
            >
              <AlertTriangle className="w-4 h-4 text-amber-200" />
              <span>EMERGENCY SOS</span>
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center justify-between pt-2">
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-bold text-navy-900"
                >
                  {user?.name || 'My Profile'}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-red-600 font-semibold"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-xl font-bold border border-slate-200 text-slate-800 hover:bg-slate-50 text-sm"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-xl font-bold bg-[#991B1B] text-white hover:bg-[#7F1D1D] text-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
