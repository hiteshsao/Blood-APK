import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Droplet,
  AlertTriangle,
  Menu,
  X,
  User,
  LogOut,
  Bell,
  Check,
  CheckCheck,
  Clock,
  LayoutDashboard,
  ShieldAlert
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSos } from '../context/SosContext';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { openSos } = useSos();

  // Navigation Links
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Find Donors', path: '/find-donors' },
    { name: 'Blood Requests', path: '/requests' },
  ];

  // Add Dashboard link based on role
  if (user?.role === 'DONOR') {
    navLinks.splice(1, 0, { name: 'Donor Dashboard', path: '/donor/dashboard' });
  } else if (user?.role === 'RECIPIENT') {
    navLinks.splice(1, 0, { name: 'Recipient Dashboard', path: '/recipient/dashboard' });
  }

  // Poll unread notification count every 30 seconds
  useEffect(() => {
    let isMounted = true;
    async function fetchUnreadCount() {
      if (!isAuthenticated) return;
      try {
        const res = await axiosInstance.get('/api/notifications/unread-count');
        if (res.data?.data && isMounted) {
          setUnreadCount(res.data.data.unreadCount || 0);
        }
      } catch {
        // silent fail on poll
      }
    }

    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => {
        isMounted = false;
        clearInterval(interval);
      };
    } else {
      setUnreadCount(0);
      setNotifications([]);
    }
  }, [isAuthenticated]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const res = await axiosInstance.get('/api/notifications', {
        params: { page: 0, size: 8 },
      });
      if (res.data?.data?.content) {
        setNotifications(res.data.data.content);
      } else {
        setNotifications([]);
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleToggleNotifications = () => {
    if (!notificationOpen) {
      fetchNotifications();
    }
    setNotificationOpen(!notificationOpen);
  };

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await axiosInstance.put(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axiosInstance.put('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read.');
    } catch {
      toast.error('Failed to mark all as read.');
    }
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* LifeDrop Logo */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none rounded-lg">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#991B1B] via-[#B91C1C] to-[#C62828] p-2 flex items-center justify-center text-white shadow-md shadow-red-900/10 group-hover:scale-105 transition-transform">
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
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-sm font-bold px-3.5 py-2 rounded-full transition-all duration-200 ${
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
            
            {/* Emergency SOS Button */}
            <button
              type="button"
              onClick={openSos}
              className="bg-gradient-to-r from-[#DC2626] to-[#991B1B] hover:from-[#EF4444] hover:to-[#B91C1C] text-white text-xs font-black px-4 py-2.5 rounded-full shadow-sos hover:shadow-sos-hover transition-all duration-300 flex items-center gap-2 tracking-wider uppercase transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <AlertTriangle className="w-4 h-4 animate-bounce text-amber-200" />
              <span>EMERGENCY SOS</span>
            </button>

            <div className="w-px h-6 bg-slate-200 mx-1"></div>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                
                {/* Notifications Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    id="notifications-bell-btn"
                    onClick={handleToggleNotifications}
                    className="relative p-2.5 rounded-full text-slate-500 hover:text-navy-900 hover:bg-slate-100 transition-colors focus:outline-none"
                    aria-label="View notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center animate-pulse shadow-sm">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {notificationOpen && (
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-50">
                      <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-red-600" />
                          <h4 className="font-extrabold text-navy-900 text-sm">Notifications</h4>
                          {unreadCount > 0 && (
                            <span className="text-[10px] font-black bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                              {unreadCount} unread
                            </span>
                          )}
                        </div>

                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllAsRead}
                            className="text-xs font-bold text-primary-700 hover:text-primary-900 flex items-center gap-1"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Mark all read</span>
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {loadingNotifications ? (
                          <div className="p-8 text-center text-xs text-slate-400 font-semibold">
                            Loading notifications...
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="p-8 text-center text-xs text-slate-400">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                if (user?.role === 'DONOR') navigate('/donor/dashboard');
                                else navigate('/recipient/dashboard');
                                setNotificationOpen(false);
                              }}
                              className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${
                                !n.isRead ? 'bg-red-50/40' : ''
                              }`}
                            >
                              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.isRead ? 'bg-red-600' : 'bg-transparent'}`} />
                              <div className="flex-1">
                                <h5 className="font-bold text-navy-900 text-xs">{n.title}</h5>
                                <p className="text-slate-600 text-xs mt-0.5 line-clamp-2">{n.body}</p>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              {!n.isRead && (
                                <button
                                  type="button"
                                  onClick={(e) => handleMarkAsRead(n.id, e)}
                                  title="Mark as read"
                                  className="text-slate-400 hover:text-slate-700 p-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile & Logout */}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-navy-900 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
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
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-slate-700 hover:text-navy-900 font-bold text-sm px-3 py-2 transition-colors"
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
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleToggleNotifications}
                className="relative p-2 rounded-lg text-slate-600"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-600 rounded-full" />
                )}
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
                  className={`px-4 py-2.5 rounded-xl text-base font-bold transition-colors ${
                    active ? 'bg-[#FEE2E2] text-[#991B1B]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                openSos();
              }}
              className="w-full bg-gradient-to-r from-[#DC2626] to-[#991B1B] text-white text-xs font-black py-3 px-4 rounded-xl shadow-sos flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <AlertTriangle className="w-4 h-4 text-amber-200 animate-bounce" />
              <span>EMERGENCY SOS BROADCAST</span>
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            {isAuthenticated ? (
              <div className="flex items-center justify-between pt-2">
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-bold text-navy-900 text-sm"
                >
                  {user?.name || 'My Profile'}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-red-600 font-bold"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-xl font-bold border border-slate-200 text-slate-800 text-sm"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-xl font-bold bg-[#991B1B] text-white text-sm"
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
