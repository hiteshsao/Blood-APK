import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AlertTriangle,
  X,
  MapPin,
  Send,
  Phone,
  PhoneCall,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Clock,
  Radio,
  UserCheck,
  Building,
  HeartPulse
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useToast } from '../context/ToastContext';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function SosModal({
  isOpen,
  onClose,
  activeSos,
  onSosCreated,
  onSosCancelled,
  user
}) {
  const { toast } = useToast();

  // Form State
  const [patientName, setPatientName] = useState(user?.name || '');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || 'O+');
  const [city, setCity] = useState(user?.city || 'Indore');
  const [latitude, setLatitude] = useState(22.7196);
  const [longitude, setLongitude] = useState(75.8577);
  const [message, setMessage] = useState('');
  const [locationStatus, setLocationStatus] = useState('detecting'); // 'detecting' | 'detected' | 'fallback'

  // Submitting & Polling State
  const [submitting, setSubmitting] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(activeSos);
  const [pollingLoading, setPollingLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Auto-detect browser location when modal opens in confirmation mode
  useEffect(() => {
    if (isOpen && !activeSos) {
      if (user?.name) setPatientName(user.name);
      if (user?.bloodGroup) setBloodGroup(user.bloodGroup);
      if (user?.city) setCity(user.city);

      if (navigator.geolocation) {
        setLocationStatus('detecting');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLatitude(parseFloat(pos.coords.latitude.toFixed(4)));
            setLongitude(parseFloat(pos.coords.longitude.toFixed(4)));
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
    }
  }, [isOpen, activeSos, user]);

  // Keep currentRequest in sync when activeSos changes from parent
  useEffect(() => {
    setCurrentRequest(activeSos);
  }, [activeSos]);

  // Poll request details every 10 seconds when in STATUS view
  const pollRequestDetails = useCallback(async (requestId) => {
    if (!requestId) return;
    try {
      setPollingLoading(true);
      const res = await axiosInstance.get(`/api/recipient/requests/${requestId}`);
      if (res.data?.data) {
        setCurrentRequest(res.data.data);
      }
    } catch (err) {
      console.warn('[SOS Poll Error]', err?.response?.data || err?.message);
    } finally {
      setPollingLoading(false);
    }
  }, []);

  useEffect(() => {
    let intervalId = null;
    const reqId = currentRequest?.id || activeSos?.id;

    if (isOpen && reqId && currentRequest?.status !== 'CANCELLED' && currentRequest?.status !== 'COMPLETED') {
      // Immediate poll
      pollRequestDetails(reqId);

      // 10-second polling interval
      intervalId = setInterval(() => {
        pollRequestDetails(reqId);
      }, 10000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen, currentRequest?.id, currentRequest?.status, activeSos?.id, pollRequestDetails]);

  // Handle Send SOS
  const handleSendSos = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) {
      toast.error('Please enter the patient name.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        patientName: patientName.trim(),
        bloodGroup,
        city: city.trim() || 'Indore',
        latitude: latitude || 22.7196,
        longitude: longitude || 75.8577,
        message: message.trim() || 'Emergency SOS broadcast: Immediate voluntary blood donors needed.',
      };

      const res = await axiosInstance.post('/api/recipient/sos', payload);
      const sosData = res.data?.data;
      toast.success(`SOS broadcasted! ${sosData.donorsNotified || 0} compatible donors alerted.`);

      if (onSosCreated) {
        onSosCreated(sosData);
      }
      setCurrentRequest({
        id: sosData.requestId,
        status: sosData.status || 'PENDING',
        matchedDonorCount: sosData.donorsNotified,
        radiusKm: sosData.radiusKm,
        bloodGroup,
        patientName,
        city,
      });
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to dispatch SOS alert. Please try again.';
      toast.error(errorMsg);

      // If active SOS exists already (limit reached), fetch the active one
      if (err.response?.status === 400 && errorMsg.toLowerCase().includes('active')) {
        try {
          const activeRes = await axiosInstance.get('/api/recipient/sos/active');
          if (activeRes.data?.data) {
            setCurrentRequest(activeRes.data.data);
          }
        } catch {
          // ignore
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Cancel SOS
  const handleCancelSos = async () => {
    const reqId = currentRequest?.id;
    if (!reqId) return;

    if (!window.confirm('Are you sure you want to cancel this emergency SOS broadcast?')) {
      return;
    }

    setCancelling(true);
    try {
      await axiosInstance.put(`/api/recipient/requests/${reqId}/cancel`);
      toast.info('Emergency SOS broadcast has been cancelled.');
      if (onSosCancelled) onSosCancelled();
      setCurrentRequest(null);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel SOS.');
    } finally {
      setCancelling(false);
    }
  };

  if (!isOpen) return null;

  const isStatusView = Boolean(currentRequest?.id);
  const isAccepted = currentRequest?.status === 'ACCEPTED' || Boolean(currentRequest?.acceptedDonor);
  const acceptedDonor = currentRequest?.acceptedDonor;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 transition-all duration-300 animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-red-200 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glowing Header */}
        <div className="bg-gradient-to-r from-[#991B1B] via-[#C62828] to-[#DC2626] p-6 text-white relative overflow-hidden shadow-sos">
          {/* Subtle decorative circles */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-black/20 blur-lg pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                <AlertTriangle className="w-6 h-6 text-amber-300 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white/25 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 border border-white/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
                    High Priority Dispatch
                  </span>
                  {isStatusView && (
                    <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/80 px-2 py-0.5 rounded-full text-white">
                      Live Broadcast
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                  {isStatusView ? 'EMERGENCY SOS LIVE STATUS' : 'EMERGENCY SOS BROADCAST'}
                </h2>
                <p className="text-red-100 text-xs sm:text-sm mt-0.5 font-medium">
                  {isStatusView
                    ? `Tracking Request #${currentRequest.id} in real time`
                    : 'Instant 25 km priority push alerts sent to verified voluntary donors'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none"
              aria-label="Close SOS Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">

          {/* VIEW 1: ACTIVE STATUS VIEW */}
          {isStatusView ? (
            <div className="space-y-6">

              {/* Pulsing Radar Animation Circle */}
              <div className="py-6 flex flex-col items-center justify-center relative">
                <div className="relative flex items-center justify-center">
                  {/* Outer Ripple 1 */}
                  <div className={`absolute w-44 h-44 rounded-full ${isAccepted ? 'bg-emerald-500/20' : 'bg-red-500/20 animate-ping'} pointer-events-none`} />
                  {/* Outer Ripple 2 */}
                  <div className={`absolute w-32 h-32 rounded-full ${isAccepted ? 'bg-emerald-500/30' : 'bg-red-500/30'} pointer-events-none`} />
                  {/* Center Circle */}
                  <div
                    className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center text-white shadow-sos transition-transform duration-300 ${
                      isAccepted
                        ? 'bg-gradient-to-tr from-emerald-600 to-emerald-500 shadow-emerald-500/50 scale-105'
                        : 'bg-gradient-to-tr from-[#991B1B] to-[#EF4444]'
                    }`}
                  >
                    {isAccepted ? (
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    ) : (
                      <Radio className="w-9 h-9 text-white animate-pulse" />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-wider mt-1">
                      {isAccepted ? 'Matched!' : 'Pulsing'}
                    </span>
                  </div>
                </div>

                {/* Subtext info */}
                <div className="text-center mt-5">
                  <h3 className="text-lg font-black text-slate-900">
                    {isAccepted ? 'Donor Has Accepted Your SOS!' : 'Broadcasting to Nearby Donors'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                    {isAccepted
                      ? 'Please call the donor immediately to coordinate donation.'
                      : `${currentRequest.matchedDonorCount || 0} eligible donor(s) notified within ${currentRequest.radiusKm || 25} km radius.`}
                  </p>
                  {!isAccepted && (
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full mt-2.5">
                      <RefreshCw className={`w-3 h-3 ${pollingLoading ? 'animate-spin' : ''}`} />
                      <span>Live status refreshing every 10 seconds</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Donor Accepted Card (Show when donor accepts) */}
              {isAccepted && acceptedDonor && (
                <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 shadow-lg animate-fadeIn">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                        {acceptedDonor.bloodGroup || currentRequest.bloodGroup}
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-black tracking-widest text-emerald-800">
                          Matched Voluntary Donor
                        </div>
                        <h4 className="text-xl font-black text-emerald-950 leading-tight">
                          {acceptedDonor.name}
                        </h4>
                        <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                          📍 {acceptedDonor.city || currentRequest.city || 'Indore'} • Compatible Group: {acceptedDonor.bloodGroup}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-emerald-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-700" />
                      <span className="text-sm font-black text-emerald-950 font-mono tracking-wide">
                        {acceptedDonor.phone}
                      </span>
                    </div>

                    <a
                      href={`tel:${acceptedDonor.phone}`}
                      className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-wider"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Call {acceptedDonor.name.split(' ')[0]} Now</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Broadcast Request Metadata */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Patient Name:</span>
                  <span className="font-extrabold text-navy-900">{currentRequest.patientName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Required Blood Group:</span>
                  <span className="font-extrabold text-red-600">{currentRequest.bloodGroup}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Dispatch Radius:</span>
                  <span className="font-bold text-slate-800">{currentRequest.radiusKm || 25} km</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Live Status:</span>
                  <span className={`font-black uppercase px-2 py-0.5 rounded-full text-[10px] ${
                    isAccepted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'
                  }`}>
                    {currentRequest.status || 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Action buttons (Cancel) */}
              {!isAccepted && (
                <div className="pt-1 flex items-center justify-between">
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
                    onClick={() => pollRequestDetails(currentRequest.id)}
                    disabled={pollingLoading}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${pollingLoading ? 'animate-spin' : ''}`} />
                    <span>Check Live Status</span>
                  </button>
                </div>
              )}

            </div>
          ) : (
            /* VIEW 2: CONFIRMATION FORM VIEW */
            <form onSubmit={handleSendSos} className="space-y-5">
              
              {/* Patient Name */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Patient Name *
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold text-slate-900"
                />
              </div>

              {/* Blood Group Picker */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  Blood Group Required *
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {BLOOD_GROUPS.map((bg) => {
                    const isSelected = bloodGroup === bg;
                    return (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => setBloodGroup(bg)}
                        className={`py-3 rounded-xl font-black text-sm transition-all duration-150 flex flex-col items-center justify-center border ${
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

              {/* Auto-detected Location & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                      Location / City *
                    </label>
                  </div>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Indore, MP"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                      GPS Coordinates
                    </label>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      locationStatus === 'detected'
                        ? 'bg-emerald-100 text-emerald-800'
                        : locationStatus === 'detecting'
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {locationStatus === 'detected'
                        ? '📍 GPS Auto-detected'
                        : locationStatus === 'detecting'
                        ? 'Detecting GPS...'
                        : 'Default Coordinates'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(parseFloat(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-semibold text-slate-700"
                      required
                    />
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(parseFloat(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-semibold text-slate-700"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Note Line */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Emergency Notes / Location Details (Optional)
                </label>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Room 304, Near City Center. Surgery scheduled in 2 hours."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900"
                />
              </div>

              {/* Send SOS Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-[#DC2626] via-[#B91C1C] to-[#991B1B] hover:from-[#EF4444] hover:to-[#B91C1C] text-white font-black py-4 px-6 rounded-2xl shadow-sos hover:shadow-sos-hover transition-all duration-300 flex items-center justify-center gap-3 uppercase tracking-wider disabled:opacity-50 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Send className="w-5 h-5 text-amber-200 animate-pulse" />
                <span>{submitting ? 'Broadcasting SOS Alert...' : 'Send Emergency SOS'}</span>
              </button>

            </form>
          )}

          {/* Quick-Call Buttons: "Call 112" and "Call 108" */}
          <div className="pt-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2.5 text-center">
              Emergency Hotlines (One-Tap Dial)
            </div>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="tel:112"
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors duration-150"
              >
                <PhoneCall className="w-4 h-4 text-red-600" />
                <span>Call 112 (National Emergency)</span>
              </a>
              <a
                href="tel:108"
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-900 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors duration-150"
              >
                <PhoneCall className="w-4 h-4 text-red-600" />
                <span>Call 108 (Ambulance)</span>
              </a>
            </div>
          </div>

          {/* Mandatory Medical Emergency Disclaimer */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-xs leading-relaxed flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="font-medium">
              <strong className="font-extrabold block text-amber-950 mb-0.5">Important Safety Disclaimer:</strong>
              LifeDrop connects donors and recipients. In a medical emergency, contact a hospital or call 112.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
