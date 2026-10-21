import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  MapPin,
  Send,
  Phone,
  PhoneCall,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Radio
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function EmergencySos() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect guests to Register
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/register', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [form, setForm] = useState({
    patientName: user?.name || '',
    bloodGroup: user?.bloodGroup || 'O+',
    city: user?.city || 'Indore',
    latitude: 22.7196,
    longitude: 75.8577,
    message: '',
  });

  const [locationStatus, setLocationStatus] = useState('detecting');
  const [loading, setLoading] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [pollingLoading, setPollingLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Auto-detect browser location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      setLocationStatus('detecting');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm((prev) => ({
            ...prev,
            latitude: parseFloat(pos.coords.latitude.toFixed(4)),
            longitude: parseFloat(pos.coords.longitude.toFixed(4)),
          }));
          setLocationStatus('detected');
        },
        () => {
          setLocationStatus('fallback');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setLocationStatus('fallback');
    }
  }, []);

  // Check active SOS on mount
  const fetchActiveSos = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'RECIPIENT') return;
    try {
      const res = await axiosInstance.get('/api/recipient/sos/active');
      if (res.data?.data) {
        setActiveRequest(res.data.data);
      }
    } catch {
      // ignore
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    fetchActiveSos();
  }, [fetchActiveSos]);

  // Poll request details every 10 seconds if active
  const pollRequestDetails = useCallback(async (requestId) => {
    if (!requestId) return;
    try {
      setPollingLoading(true);
      const res = await axiosInstance.get(`/api/recipient/requests/${requestId}`);
      if (res.data?.data) {
        setActiveRequest(res.data.data);
      }
    } catch (err) {
      console.warn('[SOS Poll Error]', err?.response?.data || err?.message);
    } finally {
      setPollingLoading(false);
    }
  }, []);

  useEffect(() => {
    let intervalId = null;
    const reqId = activeRequest?.id;

    if (reqId && activeRequest?.status !== 'CANCELLED' && activeRequest?.status !== 'COMPLETED') {
      intervalId = setInterval(() => {
        pollRequestDetails(reqId);
      }, 10000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeRequest?.id, activeRequest?.status, pollRequestDetails]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientName.trim()) {
      toast.error('Please enter the patient name.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        patientName: form.patientName.trim(),
        bloodGroup: form.bloodGroup,
        city: form.city.trim() || 'Indore',
        latitude: form.latitude || 22.7196,
        longitude: form.longitude || 75.8577,
        message: form.message.trim() || 'Emergency SOS broadcast: Voluntary donors required immediately.',
      };

      const res = await axiosInstance.post('/api/recipient/sos', payload);
      const data = res.data?.data;
      toast.success(`SOS broadcasted! ${data.donorsNotified || 0} compatible donors notified.`);

      setActiveRequest({
        id: data.requestId,
        status: data.status || 'PENDING',
        matchedDonorCount: data.donorsNotified,
        radiusKm: data.radiusKm,
        bloodGroup: form.bloodGroup,
        patientName: form.patientName,
        city: form.city,
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to broadcast SOS alert.';
      toast.error(msg);

      if (err.response?.status === 400 && msg.toLowerCase().includes('active')) {
        fetchActiveSos();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSos = async () => {
    if (!activeRequest?.id) return;
    if (!window.confirm('Are you sure you want to cancel this emergency SOS broadcast?')) return;

    setCancelling(true);
    try {
      await axiosInstance.put(`/api/recipient/requests/${activeRequest.id}/cancel`);
      toast.info('Emergency SOS broadcast has been cancelled.');
      setActiveRequest(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel SOS.');
    } finally {
      setCancelling(false);
    }
  };

  const isAccepted = activeRequest?.status === 'ACCEPTED' || Boolean(activeRequest?.acceptedDonor);
  const acceptedDonor = activeRequest?.acceptedDonor;

  return (
    <div className="py-12 bg-slate-50 min-h-[calc(100vh-160px)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Urgent Header Banner */}
        <div className="bg-gradient-to-r from-[#991B1B] via-[#C62828] to-[#DC2626] rounded-3xl p-6 sm:p-8 text-white shadow-sos mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/30">
              <AlertTriangle className="w-8 h-8 text-amber-300 animate-bounce" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest bg-white/25 px-2.5 py-0.5 rounded-full inline-block mb-1 border border-white/20">
                High Priority Dispatch
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Emergency SOS Broadcast
              </h1>
              <p className="text-red-100 text-xs sm:text-sm mt-0.5">
                Instant 25 km priority push alerts sent to verified voluntary donors (auto-expands to 50 km if needed).
              </p>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center sm:items-end">
            <span className="text-[10px] uppercase font-bold text-red-200">National Emergency Dials</span>
            <div className="flex items-center gap-2 mt-1">
              <a
                href="tel:112"
                className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-white text-xs font-black flex items-center gap-1 border border-white/20"
              >
                <PhoneCall className="w-3.5 h-3.5" /> 112
              </a>
              <a
                href="tel:108"
                className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-white text-xs font-black flex items-center gap-1 border border-white/20"
              >
                <PhoneCall className="w-3.5 h-3.5" /> 108
              </a>
            </div>
          </div>
        </div>

        {/* ACTIVE SOS STATUS VIEW */}
        {activeRequest ? (
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-red-200 space-y-6">
            
            {/* Pulsing Radar Circle */}
            <div className="py-8 flex flex-col items-center justify-center relative">
              <div className="relative flex items-center justify-center">
                <div className={`absolute w-52 h-52 rounded-full ${isAccepted ? 'bg-emerald-500/20' : 'bg-red-500/20 animate-ping'} pointer-events-none`} />
                <div className={`absolute w-36 h-36 rounded-full ${isAccepted ? 'bg-emerald-500/30' : 'bg-red-500/30'} pointer-events-none`} />
                <div
                  className={`relative z-10 w-28 h-28 rounded-full flex flex-col items-center justify-center text-white shadow-sos transition-transform duration-300 ${
                    isAccepted
                      ? 'bg-gradient-to-tr from-emerald-600 to-emerald-500 shadow-emerald-500/50 scale-105'
                      : 'bg-gradient-to-tr from-[#991B1B] to-[#EF4444]'
                  }`}
                >
                  {isAccepted ? (
                    <CheckCircle2 className="w-12 h-12 text-white" />
                  ) : (
                    <Radio className="w-10 h-10 text-white animate-pulse" />
                  )}
                  <span className="text-[10px] font-black uppercase tracking-wider mt-1">
                    {isAccepted ? 'Matched!' : 'Pulsing'}
                  </span>
                </div>
              </div>

              <div className="text-center mt-6">
                <h3 className="text-xl font-black text-slate-900">
                  {isAccepted ? 'Donor Has Accepted Your SOS!' : 'Broadcasting Live to Nearby Donors'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  {isAccepted
                    ? 'Please call the donor immediately to coordinate blood donation.'
                    : `${activeRequest.matchedDonorCount || 0} eligible donor(s) notified within ${activeRequest.radiusKm || 25} km radius.`}
                </p>
                {!isAccepted && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3.5 py-1.5 rounded-full mt-3">
                    <RefreshCw className={`w-3.5 h-3.5 ${pollingLoading ? 'animate-spin' : ''}`} />
                    <span>Live status polling every 10 seconds</span>
                  </div>
                )}
              </div>
            </div>

            {/* Donor Accepted Card */}
            {isAccepted && acceptedDonor && (
              <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 shadow-lg animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                      {acceptedDonor.bloodGroup || activeRequest.bloodGroup}
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-black tracking-widest text-emerald-800">
                        Accepted Voluntary Donor
                      </div>
                      <h4 className="text-2xl font-black text-emerald-950 leading-tight">
                        {acceptedDonor.name}
                      </h4>
                      <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                        📍 {acceptedDonor.city || activeRequest.city || 'Indore'} • Compatible Group: {acceptedDonor.bloodGroup}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`tel:${acceptedDonor.phone}`}
                    className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-black px-8 py-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-wider shrink-0"
                  >
                    <PhoneCall className="w-5 h-5" />
                    <span>Call {acceptedDonor.name.split(' ')[0]} Now ({acceptedDonor.phone})</span>
                  </a>
                </div>
              </div>
            )}

            {/* Request Summary */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Patient Name:</span>
                <span className="font-extrabold text-navy-900">{activeRequest.patientName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Blood Group Required:</span>
                <span className="font-extrabold text-red-600">{activeRequest.bloodGroup}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Broadcast Radius:</span>
                <span className="font-bold text-slate-800">{activeRequest.radiusKm || 25} km</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Live Status:</span>
                <span className={`font-black uppercase px-2.5 py-0.5 rounded-full text-xs ${
                  isAccepted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'
                }`}>
                  {activeRequest.status || 'PENDING'}
                </span>
              </div>
            </div>

            {/* Cancel & Refresh */}
            {!isAccepted && (
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleCancelSos}
                  disabled={cancelling}
                  className="text-xs font-bold text-red-600 hover:text-red-800 underline disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling SOS...' : 'Cancel SOS Broadcast'}
                </button>
                <button
                  type="button"
                  onClick={() => pollRequestDetails(activeRequest.id)}
                  disabled={pollingLoading}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${pollingLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Status</span>
                </button>
              </div>
            )}

          </div>
        ) : (
          /* FORM VIEW */
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Patient Name */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.patientName}
                    onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                    placeholder="e.g. Ramesh Verma"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                    City / Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. AIIMS Bhopal, MP Nagar"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold"
                  />
                </div>
              </div>

              {/* Blood Group Picker */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Blood Group Required *
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {BLOOD_GROUPS.map((bg) => {
                    const isSelected = form.bloodGroup === bg;
                    return (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => setForm({ ...form, bloodGroup: bg })}
                        className={`py-3.5 rounded-xl font-black text-sm transition-all duration-150 flex flex-col items-center justify-center border ${
                          isSelected
                            ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-sos scale-105'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <span>{bg}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Coordinates */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    GPS Coordinates
                  </label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    locationStatus === 'detected'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {locationStatus === 'detected' ? '📍 GPS Auto-detected' : 'Manual Coordinates'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
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

              {/* Message Note */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Emergency Notes / Location Details (Optional)
                </label>
                <textarea
                  rows={2}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Mention location landmark, contact person, or urgent surgical requirement..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-normal"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#DC2626] via-[#B91C1C] to-[#991B1B] hover:from-[#EF4444] hover:to-[#B91C1C] text-white font-black py-4 px-6 rounded-2xl shadow-sos hover:shadow-sos-hover transition-all duration-300 flex items-center justify-center gap-3 uppercase tracking-wider disabled:opacity-50 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Send className="w-5 h-5 text-amber-200 animate-pulse" />
                <span>{loading ? 'Broadcasting SOS Alert...' : 'Send Emergency SOS'}</span>
              </button>

            </form>
          </div>
        )}

        {/* Quick Emergency Hotlines */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="tel:112"
            className="py-4 px-5 rounded-2xl bg-white border border-slate-200 hover:border-red-300 shadow-sm flex items-center justify-between text-slate-900 transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-black">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase">National Helpline</div>
                <div className="text-base font-black text-navy-900">Call 112</div>
              </div>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">
              Instant Dial
            </span>
          </a>

          <a
            href="tel:108"
            className="py-4 px-5 rounded-2xl bg-white border border-slate-200 hover:border-red-300 shadow-sm flex items-center justify-between text-slate-900 transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-black">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase">Ambulance Emergency</div>
                <div className="text-base font-black text-navy-900">Call 108</div>
              </div>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full">
              Instant Dial
            </span>
          </a>
        </div>

        {/* Mandatory Medical Emergency Disclaimer */}
        <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-extrabold block text-amber-950 mb-0.5">Medical Safety Notice:</strong>
            LifeDrop connects donors and recipients. In a medical emergency, contact a hospital or call 112.
          </div>
        </div>

      </div>
    </div>
  );
}
