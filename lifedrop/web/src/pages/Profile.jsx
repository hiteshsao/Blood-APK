import React, { useState, useEffect } from 'react';
import {
  User,
  Droplet,
  Calendar,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Clock,
  Navigation,
  Edit2,
  Save,
  Phone,
  Mail,
  ShieldCheck
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BLOOD_GROUPS } from '../utils/bloodCompatibility';
import { Skeleton } from '../components/Skeleton';

export default function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    city: '',
    age: 25,
    gender: 'MALE',
    bloodGroup: 'A+',
  });

  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  async function loadProfileData() {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/users/me');
      if (res.data?.data) {
        const data = res.data.data;
        setProfile(data);
        setAvailable(data.available ?? true);
        setEditForm({
          name: data.name || '',
          phone: data.phone || '',
          city: data.city || 'Indore',
          age: data.age || 25,
          gender: data.gender || 'MALE',
          bloodGroup: data.bloodGroup?.replace('_POSITIVE', '+').replace('_NEGATIVE', '-') || 'A+',
        });

        if (data.role === 'DONOR') {
          const eligRes = await axiosInstance.get('/api/donor/eligibility').catch(() => null);
          if (eligRes?.data?.data) {
            setEligibility(eligRes.data.data);
          }
        }
      }
    } catch (err) {
      toast.error('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  }

  const handleToggleAvailability = async () => {
    const nextState = !available;
    try {
      await axiosInstance.put('/api/donor/availability', { available: nextState });
      setAvailable(nextState);
      toast.success(`Availability status updated to ${nextState ? 'AVAILABLE' : 'OFFLINE'}.`);
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update availability.');
    }
  };

  const handleUpdateLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocating(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lng = parseFloat(pos.coords.longitude.toFixed(4));
        try {
          await axiosInstance.put('/api/users/location', {
            latitude: lat,
            longitude: lng,
          });
          toast.success(`Location updated to (${lat}, ${lng})!`);
          loadProfileData();
          refreshUser();
        } catch (err) {
          toast.error('Failed to save updated location coordinates.');
        }
      },
      () => {
        setLocating(false);
        toast.warning('Unable to access current GPS coordinates.');
      },
      { timeout: 10000 }
    );
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        city: editForm.city.trim(),
        age: parseInt(editForm.age, 10),
        gender: editForm.gender,
        bloodGroup: profile?.role === 'DONOR' ? editForm.bloodGroup : null,
      };

      await axiosInstance.put('/api/users/me', payload);
      toast.success('Profile details updated successfully!');
      setIsEditing(false);
      loadProfileData();
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 bg-slate-50 min-h-[calc(100vh-160px)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-slate-50 min-h-[calc(100vh-160px)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* User Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#991B1B] to-[#C62828] text-white flex items-center justify-center font-black text-2xl shadow-md">
              {profile?.bloodGroup ? profile.bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-') : <User className="w-8 h-8" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-navy-900">{profile?.name}</h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 uppercase tracking-wider">
                  {profile?.role}
                </span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{profile?.email}</span>
                <span>•</span>
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{profile?.phone}</span>
              </p>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{profile?.city || 'Indore'}</span>
                <span>({profile?.latitude?.toFixed(3)}, {profile?.longitude?.toFixed(3)})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <button
              type="button"
              onClick={handleUpdateLocation}
              disabled={locating}
              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Navigation className={`w-3.5 h-3.5 text-red-600 ${locating ? 'animate-spin' : ''}`} />
              <span>{locating ? 'Updating...' : 'Sync GPS'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
            </button>
          </div>
        </div>

        {/* Edit Profile Form */}
        {isEditing && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-navy-900 mb-4 pb-2 border-b border-slate-100">
              Update Personal Details
            </h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-navy-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number (10 digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-navy-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-navy-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Age *
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="65"
                    required
                    value={editForm.age}
                    onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-navy-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Gender *
                  </label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-navy-900"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {profile?.role === 'DONOR' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Blood Group *
                    </label>
                    <select
                      value={editForm.bloodGroup}
                      onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-red-700"
                    >
                      {BLOOD_GROUPS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-navy-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Donor Operations (Availability & Eligibility) */}
        {profile?.role === 'DONOR' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-lg font-bold text-navy-900">Donor Availability</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  When enabled, verified recipients within 15 km can locate and notify you for emergency blood needs.
                </p>
              </div>
              <button
                type="button"
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

            {/* Medical Eligibility Panel */}
            {eligibility && (
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Clinical Eligibility
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
                    Mandatory Gap Remaining
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
