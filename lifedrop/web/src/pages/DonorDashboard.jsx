import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Droplet,
  Heart,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  AlertTriangle,
  Phone,
  ShieldCheck,
  Activity,
  History,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Skeleton, RequestCardSkeleton } from '../components/Skeleton';

export default function DonorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [available, setAvailable] = useState(user?.available ?? true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [eligibility, setEligibility] = useState(null);
  const [loadingEligibility, setLoadingEligibility] = useState(true);

  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchEligibility();
    fetchIncomingRequests();
    fetchHistory();
  }, []);

  async function fetchEligibility() {
    setLoadingEligibility(true);
    try {
      const res = await axiosInstance.get('/api/donor/eligibility');
      if (res.data?.data) {
        setEligibility(res.data.data);
      }
    } catch (err) {
      // ignore or default
    } finally {
      setLoadingEligibility(false);
    }
  }

  async function fetchIncomingRequests() {
    setLoadingRequests(true);
    try {
      const res = await axiosInstance.get('/api/donor/requests');
      if (res.data?.data) {
        setIncomingRequests(res.data.data);
      } else {
        setIncomingRequests([]);
      }
    } catch (err) {
      setIncomingRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }

  async function fetchHistory() {
    setLoadingHistory(true);
    try {
      const res = await axiosInstance.get('/api/donor/history');
      if (res.data?.data) {
        setHistory(res.data.data);
      } else {
        setHistory([]);
      }
    } catch (err) {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  const handleToggleAvailability = async () => {
    setUpdatingAvailability(true);
    const nextState = !available;
    try {
      await axiosInstance.put('/api/donor/availability', { available: nextState });
      setAvailable(nextState);
      toast.success(`You are now ${nextState ? 'AVAILABLE for blood donations' : 'OFFLINE'}.`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update availability status.';
      toast.error(msg);
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    setProcessingId(requestId);
    try {
      const res = await axiosInstance.post(`/api/donor/requests/${requestId}/accept`);
      const details = res.data?.data;
      toast.success('You have accepted this blood request! Recipient contact unlocked.');
      // Refresh requests and history
      fetchIncomingRequests();
      fetchHistory();
    } catch (err) {
      if (err.response?.status === 409) {
        toast.warning('Another donor has already accepted this request. Thank you for your readiness!');
      } else {
        toast.error(err.response?.data?.message || 'Failed to accept request.');
      }
      fetchIncomingRequests();
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (requestId) => {
    setProcessingId(requestId);
    try {
      await axiosInstance.post(`/api/donor/requests/${requestId}/reject`);
      toast.info('Request removed from your incoming list.');
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject request.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="py-10 bg-slate-50 min-h-[calc(100vh-160px)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-black text-2xl shadow-md">
              {user?.bloodGroup?.replace('_POSITIVE', '+').replace('_NEGATIVE', '-') || <Droplet className="w-8 h-8" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
                  Welcome, {user?.name || 'Donor'}
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 uppercase tracking-wider">
                  Voluntary Donor
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{user?.city || 'Indore'}</span>
                <span>•</span>
                <span>{user?.email}</span>
              </p>
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="text-left">
              <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                Availability Status
              </span>
              <span className="text-[11px] text-slate-500">
                {available ? 'Visible to nearby patients' : 'Hidden from emergency alerts'}
              </span>
            </div>
            <button
              type="button"
              id="donor-availability-toggle"
              disabled={updatingAvailability}
              onClick={handleToggleAvailability}
              className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 ${
                available
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  : 'bg-slate-300 hover:bg-slate-400 text-slate-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${available ? 'bg-white animate-ping' : 'bg-slate-500'}`} />
              <span>{updatingAvailability ? 'Updating...' : available ? 'AVAILABLE' : 'OFFLINE'}</span>
            </button>
          </div>
        </div>

        {/* Eligibility Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-bold text-navy-900">Medical Donation Eligibility</h2>
            </div>
            <span className="text-xs font-bold text-slate-400">90-Day Clinical Recovery Rule</span>
          </div>

          {loadingEligibility ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Status */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Status
                </span>
                <div className="flex items-center gap-2">
                  {eligibility?.eligible ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span className="font-extrabold text-emerald-700 text-base">Eligible to Donate</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-amber-600" />
                      <span className="font-extrabold text-amber-700 text-base">In Recovery Period</span>
                    </>
                  )}
                </div>
              </div>

              {/* Days Remaining */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Days Remaining
                </span>
                <span className="text-2xl font-black text-navy-900">
                  {eligibility?.daysRemaining || 0}
                  <span className="text-xs font-bold text-slate-500 ml-1">days remaining</span>
                </span>
              </div>

              {/* Last Donation Date */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Last Donation Date
                </span>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-navy-900 text-sm">
                    {eligibility?.lastDonatedDate || 'Never / No recent record'}
                  </span>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Incoming Requests Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
                Incoming Emergency Requests
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Compatible patient blood requests dispatched to your location.
              </p>
            </div>
            <span className="text-xs font-black bg-red-100 text-red-800 px-3 py-1 rounded-full">
              {incomingRequests.length} Pending
            </span>
          </div>

          {loadingRequests ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RequestCardSkeleton />
              <RequestCardSkeleton />
            </div>
          ) : incomingRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm">
              <Droplet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-navy-900 mb-1">No Pending Incoming Requests</h3>
              <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
                You're all caught up! When a nearby recipient posts a request compatible with your blood group, it will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incomingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center font-black text-red-700 text-lg">
                          {req.bloodGroup?.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-navy-900 text-base">
                            {req.patientName || 'Emergency Patient'}
                          </h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{req.city || 'Nearby'}</span>
                            {req.distanceKm !== undefined && (
                              <span className="font-bold text-primary-700">({req.distanceKm.toFixed(1)} km away)</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-black px-2.5 py-1 rounded-full uppercase ${
                          req.urgency === 'URGENT'
                            ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {req.urgency}
                      </span>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3.5 text-xs text-slate-600 space-y-1.5">
                      <div className="flex justify-between">
                        <span>Units Needed:</span>
                        <strong className="text-navy-900 font-bold">{req.unitsNeeded || 1} Unit(s)</strong>
                      </div>
                      {req.message && (
                        <p className="text-slate-500 italic pt-1 border-t border-slate-200/80">
                          "{req.message}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-4 mt-4 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={processingId === req.id}
                      onClick={() => handleRejectRequest(req.id)}
                      className="py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4 text-slate-400" />
                      <span>Decline</span>
                    </button>

                    <button
                      type="button"
                      id={`accept-request-${req.id}`}
                      disabled={processingId === req.id}
                      onClick={() => handleAcceptRequest(req.id)}
                      className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4 fill-white" />
                      <span>{processingId === req.id ? 'Accepting...' : 'Accept Request'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Donation History Section */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-600" />
            <h2 className="text-xl font-bold text-navy-900">Donation History</h2>
          </div>

          {loadingHistory ? (
            <div className="space-y-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <Heart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-xs sm:text-sm font-semibold">
                You haven't accepted any donation requests yet.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-100">
                {history.map((record) => (
                  <div key={record.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm">
                        {record.bloodGroup?.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')}
                      </div>
                      <div>
                        <h4 className="font-bold text-navy-900 text-sm">
                          {record.patientName || 'Patient Request'}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {record.city} • {record.unitsNeeded || 1} Unit(s)
                          {record.recipientPhone && (
                            <span className="font-bold text-navy-900 ml-2">Phone: {record.recipientPhone}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        {record.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
