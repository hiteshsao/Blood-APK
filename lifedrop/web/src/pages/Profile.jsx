import React, { useState, useEffect } from 'react';
import { User, Droplet, Calendar, MapPin, CheckCircle, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isAuthenticated]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/users/me');
      if (res.data?.data) {
        setProfile(res.data.data);
        setAvailable(res.data.data.available);

        if (res.data.data.role === 'DONOR') {
          const eligRes = await apiClient.get('/api/donor/eligibility').catch(() => null);
          if (eligRes?.data?.data) {
            setEligibility(eligRes.data.data);
          }
        }
      }
    } catch (err) {
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }

  const handleToggleAvailability = async () => {
    setUpdating(true);
    setError(null);
    setMessage(null);
    try {
      const newStatus = !available;
      await apiClient.put('/api/donor/availability', { available: newStatus });
      setAvailable(newStatus);
      setMessage(`Availability successfully set to ${newStatus ? 'AVAILABLE' : 'OFFLINE'}.`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update availability.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500 font-semibold">
        Loading profile details...
      </div>
    );
  }

  return (
    <div className="py-12 bg-slate-50 min-h-[calc(100vh-160px)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center text-red-700 font-black text-2xl">
              {profile?.bloodGroup ? profile.bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-') : <User className="w-8 h-8 text-primary-700" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-navy-900">{profile?.name}</h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                  {profile?.role}
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-0.5">{profile?.email} • {profile?.phone}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" /> {profile?.city || 'Bhopal'} ({profile?.latitude?.toFixed(3)}, {profile?.longitude?.toFixed(3)})
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="text-xs font-bold text-red-600 hover:text-red-800 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50"
          >
            Sign Out
          </button>
        </div>

        {message && (
          <div className="p-4 mb-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Donor Eligibility & Availability Panel */}
        {profile?.role === 'DONOR' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 mb-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <h3 className="text-lg font-bold text-navy-900">Donor Availability Status</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Control whether nearby recipients can find and alert you for emergency blood requests.
                </p>
              </div>

              <button
                type="button"
                disabled={updating}
                onClick={handleToggleAvailability}
                className={`px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-wider transition-all shadow-sm ${
                  available
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                    : 'bg-slate-300 hover:bg-slate-400 text-slate-700'
                }`}
              >
                {available ? '🟢 AVAILABLE' : '⚪ OFFLINE'}
              </button>
            </div>

            {/* Eligibility Widget */}
            {eligibility && (
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Medical Eligibility
                  </span>
                  <span className={`inline-flex items-center gap-1.5 font-extrabold text-sm ${
                    eligibility.eligible ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {eligibility.eligible ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    {eligibility.eligible ? 'Eligible to Donate' : 'Waiting Period Active'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Last Donation Date
                  </span>
                  <span className="font-bold text-navy-900 text-sm">
                    {eligibility.lastDonatedDate || 'Never / No record'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Days Remaining
                  </span>
                  <span className="font-bold text-navy-900 text-sm">
                    {eligibility.daysRemaining ? `${eligibility.daysRemaining} day(s)` : '0 (Ready now)'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
