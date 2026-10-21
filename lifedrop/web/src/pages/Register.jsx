import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Droplet, UserPlus, MapPin, AlertCircle, CheckCircle, Navigation } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BLOOD_GROUPS } from '../utils/bloodCompatibility';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();

  const [role, setRole] = useState('DONOR'); // 'DONOR' or 'RECIPIENT'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    bloodGroup: 'A+',
    age: '25',
    gender: 'MALE',
    city: 'Indore',
    latitude: 22.7196,
    longitude: 75.8577,
  });

  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lng = parseFloat(pos.coords.longitude.toFixed(4));
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        toast.success(`Location set: ${lat}, ${lng}`);
      },
      (err) => {
        setLocating(false);
        toast.warning('Unable to retrieve your location. You can enter coordinates manually.');
      },
      { timeout: 10000 }
    );
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      errors.phone = 'Phone must be a valid 10-digit number';
    }

    if (role === 'DONOR') {
      const parsedAge = parseInt(formData.age, 10);
      if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 65) {
        errors.age = 'Donors must be between 18 and 65 years old';
      }
      if (!formData.bloodGroup) {
        errors.bloodGroup = 'Blood group is required for donors';
      }
    }

    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }

    if (formData.latitude === undefined || isNaN(formData.latitude)) {
      errors.latitude = 'Valid latitude is required';
    }
    if (formData.longitude === undefined || isNaN(formData.longitude)) {
      errors.longitude = 'Valid longitude is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    if (!validateForm()) {
      toast.error('Please fix the errors in the form.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        role,
        city: formData.city.trim(),
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        gender: formData.gender,
        age: parseInt(formData.age, 10) || 25,
        bloodGroup: role === 'DONOR' ? formData.bloodGroup : null,
      };

      const result = await register(payload);
      toast.success(`Welcome to LifeDrop, ${formData.name.split(' ')[0]}!`);
      
      if (role === 'DONOR') {
        navigate('/donor/dashboard');
      } else {
        navigate('/recipient/dashboard');
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors && typeof data.errors === 'object') {
        // Backend returned field-level errors (Map<String, String>)
        setFieldErrors(data.errors);
        toast.error('Please resolve the field errors highlighted below.');
      } else if (data?.message) {
        setGeneralError(data.message);
        toast.error(data.message);
      } else {
        setGeneralError('Registration failed. Please try again.');
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 bg-slate-50 min-h-[calc(100vh-160px)] flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#991B1B] to-[#C62828] p-2 flex items-center justify-center text-white mx-auto shadow-md mb-3">
            <Heart className="w-6 h-6 fill-white stroke-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
            Join the LifeDrop Network
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Connect directly with verified donors and recipients with zero intermediaries.
          </p>
        </div>

        {generalError && (
          <div className="p-4 mb-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            
            {/* Role Toggle Switcher */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Your Role *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="role-donor-toggle"
                  onClick={() => {
                    setRole('DONOR');
                    setFieldErrors({});
                  }}
                  className={`py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 border-2 transition-all ${
                    role === 'DONOR'
                      ? 'bg-red-50/70 border-red-600 text-red-900 shadow-sm ring-1 ring-red-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Droplet className={`w-4 h-4 ${role === 'DONOR' ? 'fill-red-600 text-red-600' : 'text-slate-400'}`} />
                  <span>I am a Donor</span>
                </button>

                <button
                  type="button"
                  id="role-recipient-toggle"
                  onClick={() => {
                    setRole('RECIPIENT');
                    setFieldErrors({});
                  }}
                  className={`py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 border-2 transition-all ${
                    role === 'RECIPIENT'
                      ? 'bg-red-50/70 border-red-600 text-red-900 shadow-sm ring-1 ring-red-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <UserPlus className={`w-4 h-4 ${role === 'RECIPIENT' ? 'text-red-600' : 'text-slate-400'}`} />
                  <span>I need blood</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Patel"
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-semibold text-navy-900 focus:outline-none focus:ring-2 ${
                    fieldErrors.name ? 'border-red-400 focus:ring-red-400 bg-red-50/30' : 'border-slate-200 focus:ring-primary-500'
                  }`}
                />
                {fieldErrors.name && (
                  <p className="text-xs text-red-600 font-bold mt-1">{fieldErrors.name}</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. ramesh@example.com"
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-semibold text-navy-900 focus:outline-none focus:ring-2 ${
                    fieldErrors.email ? 'border-red-400 focus:ring-red-400 bg-red-50/30' : 'border-slate-200 focus:ring-primary-500'
                  }`}
                />
                {fieldErrors.email && (
                  <p className="text-xs text-red-600 font-bold mt-1">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password (min 8 characters) *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Password@123"
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-semibold text-navy-900 focus:outline-none focus:ring-2 ${
                    fieldErrors.password ? 'border-red-400 focus:ring-red-400 bg-red-50/30' : 'border-slate-200 focus:ring-primary-500'
                  }`}
                />
                {fieldErrors.password && (
                  <p className="text-xs text-red-600 font-bold mt-1">{fieldErrors.password}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone (10-digit mobile) *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                  placeholder="10-digit mobile number"
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-semibold text-navy-900 focus:outline-none focus:ring-2 ${
                    fieldErrors.phone ? 'border-red-400 focus:ring-red-400 bg-red-50/30' : 'border-slate-200 focus:ring-primary-500'
                  }`}
                />
                {fieldErrors.phone && (
                  <p className="text-xs text-red-600 font-bold mt-1">{fieldErrors.phone}</p>
                )}
              </div>

              {/* Blood Group (Required for Donor) */}
              {role === 'DONOR' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Blood Group *
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-red-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {BLOOD_GROUPS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  {fieldErrors.bloodGroup && (
                    <p className="text-xs text-red-600 font-bold mt-1">{fieldErrors.bloodGroup}</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Preferred Blood Group (Optional)
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {BLOOD_GROUPS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Age */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Age {role === 'DONOR' ? '(18 to 65 for Donors) *' : '*'}
                </label>
                <input
                  type="number"
                  min={role === 'DONOR' ? 18 : 1}
                  max={role === 'DONOR' ? 65 : 120}
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-semibold text-navy-900 focus:outline-none focus:ring-2 ${
                    fieldErrors.age ? 'border-red-400 focus:ring-red-400 bg-red-50/30' : 'border-slate-200 focus:ring-primary-500'
                  }`}
                />
                {fieldErrors.age && (
                  <p className="text-xs text-red-600 font-bold mt-1">{fieldErrors.age}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-navy-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Indore"
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-semibold text-navy-900 focus:outline-none focus:ring-2 ${
                    fieldErrors.city ? 'border-red-400 focus:ring-red-400 bg-red-50/30' : 'border-slate-200 focus:ring-primary-500'
                  }`}
                />
                {fieldErrors.city && (
                  <p className="text-xs text-red-600 font-bold mt-1">{fieldErrors.city}</p>
                )}
              </div>

            </div>

            {/* Geolocation Coordinate Section */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                <div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Geospatial Location (Lat / Lng)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Used to calculate proximity to nearby requests and donors within 15 km.
                  </span>
                </div>
                <button
                  type="button"
                  id="use-current-location-btn"
                  onClick={handleUseMyLocation}
                  disabled={locating}
                  className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 hover:text-red-700 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Navigation className={`w-3.5 h-3.5 text-red-600 ${locating ? 'animate-spin' : ''}`} />
                  <span>{locating ? 'Locating...' : 'Use my current location'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    placeholder="Latitude"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-navy-900"
                  />
                  {fieldErrors.latitude && (
                    <p className="text-xs text-red-600 font-bold mt-1">{fieldErrors.latitude}</p>
                  )}
                </div>
                <div>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    placeholder="Longitude"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-navy-900"
                  />
                  {fieldErrors.longitude && (
                    <p className="text-xs text-red-600 font-bold mt-1">{fieldErrors.longitude}</p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-extrabold py-4 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-base"
            >
              <Heart className="w-5 h-5 fill-white" />
              <span>{loading ? 'Creating Your Account...' : `Register as ${role === 'DONOR' ? 'Voluntary Donor' : 'Blood Recipient'}`}</span>
            </button>

            <p className="text-center text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-700 font-bold hover:underline">
                Sign In
              </Link>
            </p>

          </form>
        </div>

      </div>
    </div>
  );
}
