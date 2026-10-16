import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Phone,
  User,
  MapPin,
  Calendar,
  XCircle,
  Droplet,
  Send,
  Navigation,
  Check,
  ChevronRight
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BLOOD_GROUPS } from '../utils/bloodCompatibility';
import { Skeleton, RequestCardSkeleton } from '../components/Skeleton';

export default function RecipientDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Request Blood Form state
  const [form, setForm] = useState({
    patientName: '',
    bloodGroup: 'A+',
    unitsNeeded: 1,
    urgency: 'NORMAL',
    city: user?.city || 'Indore',
    latitude: 22.7196,
    longitude: 75.8577,
    requiredBy: '',
    message: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    fetchMyRequests();

    // Default requiredBy to 24 hours from now
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setForm((prev) => ({
      ...prev,
      requiredBy: tomorrow.toISOString().slice(0, 16),
    }));
  }, []);

  async function fetchMyRequests() {
    setLoadingRequests(true);
    try {
      const res = await axiosInstance.get('/api/recipient/requests');
      if (res.data?.data) {
        setRequests(res.data.data);
      } else {
        setRequests([]);
      }
    } catch (err) {
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }

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
        setForm((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        toast.success(`Coordinates updated: ${lat}, ${lng}`);
      },
      () => {
        setLocating(false);
        toast.warning('Could not access current location.');
      },
      { timeout: 10000 }
    );
  };

  const validateForm = () => {
    const errors = {};
    if (!form.patientName.trim()) {
      errors.patientName = 'Patient name is required';
    }
    if (!form.bloodGroup) {
      errors.bloodGroup = 'Blood group is required';
    }
    if (!form.unitsNeeded || parseInt(form.unitsNeeded, 10) < 1) {
      errors.unitsNeeded = 'At least 1 unit is required';
    }
    if (!form.city.trim()) {
      errors.city = 'City is required';
    }
    if (!form.latitude || isNaN(form.latitude)) {
      errors.latitude = 'Valid latitude is required';
    }
    if (!form.longitude || isNaN(form.longitude)) {
      errors.longitude = 'Valid longitude is required';
    }
    if (!form.requiredBy) {
      errors.requiredBy = 'Date & time required is needed';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setFormErrors({});

    if (!validateForm()) {
      toast.error('Please correct the highlighted form errors.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        patientName: form.patientName.trim(),
        bloodGroup: form.bloodGroup,
        unitsNeeded: parseInt(form.unitsNeeded, 10),
        urgency: form.urgency,
        city: form.city.trim(),
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        message: form.message.trim() || undefined,
        requiredBy: form.requiredBy ? new Date(form.requiredBy).toISOString() : undefined,
      };

      const res = await axiosInstance.post('/api/recipient/requests', payload);
      const created = res.data?.data;
      const matched = created?.matchedDonorCount || 0;

      toast.success(`Request created! ${matched} nearby compatible donor(s) notified.`);
      
      // Reset form fields
      setForm((prev) => ({
        ...prev,
        patientName: '',
        message: '',
        unitsNeeded: 1,
      }));

      fetchMyRequests();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create blood request.';
      toast.error(msg);
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteRequest = async (requestId) => {
    setActionId(requestId);
    try {
      await axiosInstance.post(`/api/recipient/requests/${requestId}/complete`);
      toast.success('Request marked as COMPLETED. Thank you for using LifeDrop!');
      fetchMyRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete request.');
    } finally {
      setActionId(null);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this blood request?')) return;
    setActionId(requestId);
    try {
      await axiosInstance.put(`/api/recipient/requests/${requestId}/cancel`);
      toast.info('Blood request has been cancelled.');
      fetchMyRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel request.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="py-10 bg-slate-50 min-h-[calc(100vh-160px)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Welcome Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#991B1B] to-[#C62828] flex items-center justify-center text-white font-black text-xl shadow-md">
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-navy-900 tracking-tight">
                  Recipient Portal
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 uppercase tracking-wider">
                  Recipient
                </span>
              </div>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                {user?.name} • {user?.email} • {user?.city || 'Indore'}
              </p>
            </div>
          </div>

          <a
            href="#request-form-section"
            className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm flex items-center gap-2 self-stretch sm:self-auto justify-center"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Request</span>
          </a>
        </div>

        {/* Section: My Requests with Status Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
                My Blood Requests
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Track status updates, donor acceptance, and call information.
              </p>
            </div>
            <span className="text-xs font-bold bg-slate-200 text-slate-700 px-3 py-1 rounded-full">
              {requests.length} Total
            </span>
          </div>

          {loadingRequests ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RequestCardSkeleton />
              <RequestCardSkeleton />
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm">
              <Droplet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-navy-900 mb-1">No Blood Requests Created Yet</h3>
              <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto mb-6">
                When you need blood units for yourself or a family member, submit a request below to notify nearby compatible donors.
              </p>
              <a
                href="#request-form-section"
                className="inline-flex items-center gap-2 bg-[#991B1B] text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit Request</span>
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => {
                const isAccepted = req.status === 'ACCEPTED';
                const isCompleted = req.status === 'COMPLETED';
                const isPending = req.status === 'PENDING';
                const isCancelled = req.status === 'CANCELLED';

                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6"
                  >
                    {/* Top Row: Info + Badges */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center font-black text-red-700 text-xl">
                          {req.bloodGroup?.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-navy-900 text-lg leading-tight">
                              Patient: {req.patientName}
                            </h3>
                            <span className="text-xs text-slate-400 font-mono">#{req.id}</span>
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{req.city}</span>
                            <span>•</span>
                            <span>{req.unitsNeeded} Unit(s)</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span
                          className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                            req.urgency === 'URGENT'
                              ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {req.urgency}
                        </span>
                        <span
                          className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : isAccepted
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : isCancelled
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                    </div>

                    {/* Status Timeline */}
                    <div className="py-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-3">
                        Status Timeline
                      </span>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold relative">
                        {/* Step 1: Pending */}
                        <div className={`p-3 rounded-2xl border transition-all ${
                          isPending || isAccepted || isCompleted
                            ? 'bg-amber-50 border-amber-300 text-amber-900'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}>
                          <div className="flex items-center justify-center gap-1.5 mb-1">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span>1. Pending</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-normal">
                            Notifying donors ({req.matchedDonorCount || 0} notified)
                          </span>
                        </div>

                        {/* Step 2: Accepted */}
                        <div className={`p-3 rounded-2xl border transition-all ${
                          isAccepted || isCompleted
                            ? 'bg-purple-50 border-purple-300 text-purple-950'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}>
                          <div className="flex items-center justify-center gap-1.5 mb-1">
                            <CheckCircle2 className={`w-4 h-4 ${isAccepted || isCompleted ? 'text-purple-600' : 'text-slate-300'}`} />
                            <span>2. Accepted</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-normal">
                            {isAccepted || isCompleted ? 'Donor connected' : 'Awaiting donor'}
                          </span>
                        </div>

                        {/* Step 3: Completed */}
                        <div className={`p-3 rounded-2xl border transition-all ${
                          isCompleted
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}>
                          <div className="flex items-center justify-center gap-1.5 mb-1">
                            <Check className={`w-4 h-4 ${isCompleted ? 'text-emerald-600' : 'text-slate-300'}`} />
                            <span>3. Completed</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-normal">
                            {isCompleted ? 'Donation finished' : 'Pending completion'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Accepted Donor Contact Card (ONLY when ACCEPTED or COMPLETED) */}
                    {(isAccepted || isCompleted) && req.acceptedDonor && (
                      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 shadow-sm space-y-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black">
                              <User className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-navy-900 text-base">
                                  {req.acceptedDonor.name}
                                </span>
                                <span className="bg-emerald-200/80 text-emerald-900 font-black text-xs px-2 py-0.5 rounded-full">
                                  {req.acceptedDonor.bloodGroup?.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')} Donor
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span>{req.acceptedDonor.city || 'Local area'}</span>
                                {req.acceptedDonor.phone && (
                                  <>
                                    <span>•</span>
                                    <span className="font-bold text-navy-900">{req.acceptedDonor.phone}</span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Call Donor Button */}
                          {req.acceptedDonor.phone && (
                            <a
                              href={`tel:${req.acceptedDonor.phone}`}
                              id={`call-donor-btn-${req.id}`}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
                            >
                              <Phone className="w-4 h-4" />
                              <span>Call Donor ({req.acceptedDonor.phone})</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions & Notes Footer */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                      <div className="text-slate-500">
                        {req.message && (
                          <span className="italic">"{req.message}"</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {isPending && (
                          <button
                            type="button"
                            disabled={actionId === req.id}
                            onClick={() => handleCancelRequest(req.id)}
                            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:text-red-600 hover:border-red-300 font-bold transition-colors"
                          >
                            Cancel Request
                          </button>
                        )}

                        {isAccepted && (
                          <button
                            type="button"
                            disabled={actionId === req.id}
                            onClick={() => handleCompleteRequest(req.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-colors flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            <span>Mark as Completed</span>
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section: "Request Blood" Form */}
        <div id="request-form-section" className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200">
          <div className="mb-8">
            <span className="text-xs font-black tracking-widest uppercase text-red-600 bg-red-100 px-3 py-1 rounded-full inline-block mb-2">
              New Request
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              Request Blood Units
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              Submit patient details. Our matching engine will immediately calculate nearby compatible voluntary donors within radius.
            </p>
          </div>

          <form onSubmit={handleCreateRequest} noValidate className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              
              {/* Patient Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Patient Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.patientName}
                  onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                  placeholder="e.g. Manoj Sharma"
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-semibold text-navy-900 focus:outline-none focus:ring-2 ${
                    formErrors.patientName ? 'border-red-400 focus:ring-red-400 bg-red-50/30' : 'border-slate-200 focus:ring-primary-500'
                  }`}
                />
                {formErrors.patientName && (
                  <p className="text-xs text-red-600 font-bold mt-1">{formErrors.patientName}</p>
                )}
              </div>

              {/* Blood Group */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Blood Group Needed *
                </label>
                <select
                  value={form.bloodGroup}
                  onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-red-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {BLOOD_GROUPS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                {formErrors.bloodGroup && (
                  <p className="text-xs text-red-600 font-bold mt-1">{formErrors.bloodGroup}</p>
                )}
              </div>

              {/* Units Needed */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Units Needed *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={form.unitsNeeded}
                  onChange={(e) => setForm({ ...form, unitsNeeded: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-navy-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {formErrors.unitsNeeded && (
                  <p className="text-xs text-red-600 font-bold mt-1">{formErrors.unitsNeeded}</p>
                )}
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Urgency Level *
                </label>
                <select
                  value={form.urgency}
                  onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                  className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-extrabold focus:outline-none focus:ring-2 ${
                    form.urgency === 'URGENT' ? 'text-red-700' : 'text-blue-700'
                  }`}
                >
                  <option value="NORMAL">NORMAL (Standard search within 10 km)</option>
                  <option value="URGENT">URGENT (Emergency search within 25 km)</option>
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  City / Hospital Locality *
                </label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Indore"
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-semibold text-navy-900 focus:outline-none focus:ring-2 ${
                    formErrors.city ? 'border-red-400 focus:ring-red-400 bg-red-50/30' : 'border-slate-200 focus:ring-primary-500'
                  }`}
                />
                {formErrors.city && (
                  <p className="text-xs text-red-600 font-bold mt-1">{formErrors.city}</p>
                )}
              </div>

              {/* Required By */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Required By (Date & Time) *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={form.requiredBy}
                  onChange={(e) => setForm({ ...form, requiredBy: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold text-navy-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {formErrors.requiredBy && (
                  <p className="text-xs text-red-600 font-bold mt-1">{formErrors.requiredBy}</p>
                )}
              </div>

            </div>

            {/* Location Picker Section */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                <div>
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Hospital / Destination Coordinates
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Used to calculate proximity to nearby donors.
                  </span>
                </div>
                <button
                  type="button"
                  id="recipient-use-location-btn"
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
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) })}
                    placeholder="Latitude"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-navy-900"
                  />
                  {formErrors.latitude && (
                    <p className="text-xs text-red-600 font-bold mt-1">{formErrors.latitude}</p>
                  )}
                </div>
                <div>
                  <input
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) })}
                    placeholder="Longitude"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-navy-900"
                  />
                  {formErrors.longitude && (
                    <p className="text-xs text-red-600 font-bold mt-1">{formErrors.longitude}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Hospital Details / Note to Donors (Optional)
              </label>
              <textarea
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="e.g. Patient admitted at City Hospital ICU, Ward 3. Please call as soon as you arrive."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-semibold text-navy-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <button
              type="submit"
              id="submit-blood-request-btn"
              disabled={submitting}
              className="w-full bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-extrabold py-4 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-base"
            >
              <Send className="w-5 h-5" />
              <span>{submitting ? 'Submitting & Dispatching...' : 'Submit Blood Request & Alert Donors'}</span>
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}
