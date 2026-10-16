import React, { useState } from 'react';
import { AlertTriangle, MapPin, Send, PhoneCall, ShieldAlert, CheckCircle2 } from 'lucide-react';
import apiClient from '../api/client';
import { BLOOD_GROUPS } from '../utils/bloodCompatibility';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export default function EmergencySos() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    patientName: '',
    bloodGroup: 'A+',
    unitsNeeded: 1,
    urgency: 'URGENT',
    city: 'Bhopal',
    latitude: 23.2599,
    longitude: 77.4126,
    radiusKm: 25,
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm((prev) => ({
            ...prev,
            latitude: parseFloat(pos.coords.latitude.toFixed(4)),
            longitude: parseFloat(pos.coords.longitude.toFixed(4)),
          }));
        },
        () => {
          setError('Could not access device location. Using default coordinates.');
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!isAuthenticated) {
      setError('Please sign in as a Recipient to broadcast an official blood request.');
      setLoading(false);
      return;
    }

    try {
      const res = await apiClient.post('/api/recipient/requests', form);
      const data = res.data?.data;
      setSuccess(`Emergency request broadcasted successfully! Notified ${data?.matchedDonorCount || 0} compatible nearby donor(s).`);
      setTimeout(() => {
        navigate('/requests');
      }, 2500);
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Rate limit exceeded: A recipient may create at most 3 requests per 24 hours.');
      } else {
        setError(err.response?.data?.message || 'Failed to broadcast request. Please ensure you are logged in as a RECIPIENT.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 bg-slate-50 min-h-[calc(100vh-160px)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Urgent Header Banner */}
        <div className="bg-gradient-to-r from-[#991B1B] via-[#C62828] to-[#DC2626] rounded-2xl p-6 sm:p-8 text-white shadow-sos mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <AlertTriangle className="w-8 h-8 text-amber-300 animate-bounce" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full inline-block mb-1">
                Priority Dispatch
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Emergency SOS Broadcast
              </h1>
              <p className="text-red-100 text-xs sm:text-sm mt-0.5">
                Immediately trigger alerts to nearby voluntary donors within up to 25 km radius.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center sm:items-end">
            <span className="text-[10px] uppercase font-bold text-red-200">National Ambulance</span>
            <a
              href="tel:108"
              className="text-white hover:text-red-100 text-lg font-black flex items-center gap-1.5 underline"
            >
              <PhoneCall className="w-4 h-4" /> 108 / 112
            </a>
          </div>
        </div>

        {/* Auth warning if not signed in */}
        {!isAuthenticated && (
          <div className="p-4 mb-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              <span>You must be signed in as a Recipient to post an emergency request.</span>
            </div>
            <Link
              to="/login"
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-lg shrink-0"
            >
              Sign In First
            </Link>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="p-4 mb-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Patient Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Patient Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.patientName}
                  onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                  placeholder="e.g. Ramesh Verma"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                />
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Blood Group Required *
                </label>
                <select
                  value={form.bloodGroup}
                  onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold text-navy-900"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              {/* Units Needed */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Units Needed (Pints) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={form.unitsNeeded}
                  onChange={(e) => setForm({ ...form, unitsNeeded: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                />
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Urgency Level *
                </label>
                <select
                  value={form.urgency}
                  onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold text-red-600"
                >
                  <option value="URGENT">URGENT (25 km dispatch radius)</option>
                  <option value="NORMAL">NORMAL (10 km dispatch radius)</option>
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  City / Hospital Location *
                </label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. AIIMS Bhopal, MP Nagar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold"
                />
              </div>

              {/* Coordinates */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Coordinates (Lat, Lng)
                  </label>
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    className="text-xs font-bold text-primary-600 hover:text-primary-800 flex items-center gap-1"
                  >
                    <MapPin className="w-3.5 h-3.5" /> Use GPS
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-semibold"
                    required
                  />
                  <input
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-semibold"
                    required
                  />
                </div>
              </div>

            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Emergency Notes / Hospital Details
              </label>
              <textarea
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Mention hospital ward, contact person, or urgent requirement..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-normal"
              />
            </div>

            {/* Notice */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
              <strong className="text-navy-900">Safety Notice:</strong> LifeDrop limits recipients to 3 requests per 24-hour period to eliminate automated spam and protect volunteer donors.
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#DC2626] to-[#991B1B] hover:from-[#EF4444] hover:to-[#B91C1C] text-white font-black py-4 px-6 rounded-xl shadow-sos hover:shadow-sos-hover transition-all duration-200 flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50"
            >
              <Send className="w-5 h-5 text-amber-200" />
              <span>{loading ? 'Broadcasting SOS...' : 'Broadcast Emergency SOS'}</span>
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}
