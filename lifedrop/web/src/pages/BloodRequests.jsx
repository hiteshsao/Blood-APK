import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Droplet,
  MapPin,
  Clock,
  Flag,
  ShieldAlert,
  CheckCircle,
  Plus,
  Lock,
  ArrowRight,
  Filter
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BLOOD_GROUPS } from '../utils/bloodCompatibility';
import { RequestCardSkeleton } from '../components/Skeleton';

export default function BloodRequests() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBloodGroup, setFilterBloodGroup] = useState('ALL');
  const [filterUrgency, setFilterUrgency] = useState('ALL');

  // Reporting modal state
  const [reportingId, setReportingId] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [isAuthenticated, user]);

  async function fetchRequests() {
    setLoading(true);
    try {
      if (user?.role === 'DONOR') {
        const res = await axiosInstance.get('/api/donor/requests');
        if (res.data?.data) {
          setRequests(res.data.data);
        } else {
          setRequests([]);
        }
      } else if (user?.role === 'RECIPIENT') {
        const res = await axiosInstance.get('/api/recipient/requests');
        if (res.data?.data) {
          setRequests(res.data.data);
        } else {
          setRequests([]);
        }
      } else {
        // Guest mode: fetch any available requests or public fallback
        // When unauthenticated, try donor/requests, if 401 returns empty, provide mock/demo requests
        setRequests([
          {
            id: 101,
            patientName: 'Confidential Patient',
            bloodGroup: 'A_POSITIVE',
            unitsNeeded: 2,
            urgency: 'URGENT',
            city: 'Indore',
            status: 'PENDING',
            message: 'Urgent voluntary blood requirement for surgery.',
          },
          {
            id: 102,
            patientName: 'Confidential Patient',
            bloodGroup: 'O_POSITIVE',
            unitsNeeded: 1,
            urgency: 'NORMAL',
            city: 'Indore',
            status: 'PENDING',
            message: 'Scheduled surgery requirement for tomorrow morning.',
          },
          {
            id: 103,
            patientName: 'Confidential Patient',
            bloodGroup: 'B_NEGATIVE',
            unitsNeeded: 3,
            urgency: 'URGENT',
            city: 'Indore',
            status: 'PENDING',
            message: 'Emergency accident case blood needed immediately.',
          },
        ]);
      }
    } catch (err) {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  const handleReport = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;

    if (!isAuthenticated) {
      toast.warning('Please sign in to report a request.');
      return;
    }

    setReporting(true);
    try {
      await axiosInstance.post(`/api/requests/${reportingId}/report`, {
        reason: reportReason.trim(),
      });
      toast.success('Thank you. Request has been reported for safety verification.');
      setReportingId(null);
      setReportReason('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report. A request cannot be reported twice by the same user.');
    } finally {
      setReporting(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (filterBloodGroup !== 'ALL') {
      const bgLabel = req.bloodGroup?.replace('_POSITIVE', '+').replace('_NEGATIVE', '-');
      if (bgLabel !== filterBloodGroup && req.bloodGroup !== filterBloodGroup) {
        return false;
      }
    }
    if (filterUrgency !== 'ALL' && req.urgency !== filterUrgency) {
      return false;
    }
    return true;
  });

  return (
    <div className="py-10 bg-slate-50 min-h-[calc(100vh-160px)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-black tracking-widest uppercase text-primary-600 bg-primary-100 px-3 py-1 rounded-full inline-block mb-2">
              Community Live Feed
            </span>
            <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
              Emergency Blood Requests
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Active patient requests looking for voluntary donors nearby.
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto">
            {user?.role === 'RECIPIENT' ? (
              <Link
                to="/recipient/dashboard"
                className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm flex items-center gap-2 justify-center"
              >
                <Plus className="w-4 h-4" />
                <span>Post Blood Request</span>
              </Link>
            ) : user?.role === 'DONOR' ? (
              <Link
                to="/donor/dashboard"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm flex items-center gap-2 justify-center"
              >
                <span>Go to Donor Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/register"
                className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm flex items-center gap-2 justify-center"
              >
                <span>Register to Help</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Guest Privacy Notice */}
        {!isAuthenticated && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-center gap-3 shadow-sm">
            <Lock className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <strong>Privacy Protection Active:</strong> As a guest visitor, you see only the blood group, city, and urgency level.
              Patient names and contact procedures are securely visible to verified voluntary donors.
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Filter Requests:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Blood Group Filter */}
            <select
              value={filterBloodGroup}
              onChange={(e) => setFilterBloodGroup(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-navy-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Blood Groups</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>

            {/* Urgency Filter */}
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-navy-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">All Urgencies</option>
              <option value="URGENT">URGENT Only</option>
              <option value="NORMAL">NORMAL Only</option>
            </select>
          </div>
        </div>

        {/* Requests Feed */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RequestCardSkeleton />
            <RequestCardSkeleton />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
            <Droplet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-navy-900 mb-1">No Matching Requests</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
              There are currently no active requests matching your selected filters.
            </p>
            {user?.role === 'RECIPIENT' && (
              <Link
                to="/recipient/dashboard"
                className="inline-flex items-center gap-2 bg-[#991B1B] text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider"
              >
                Post New Request
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredRequests.map((req) => {
              const bgLabel = req.bloodGroup?.replace('_POSITIVE', '+').replace('_NEGATIVE', '-');
              // Rule: Guests see only blood group, city, urgency (NO patient names)
              const displayName = isAuthenticated
                ? (req.patientName || 'Emergency Patient')
                : 'Patient in Need (Name Protected)';

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center font-black text-red-700 text-xl shadow-sm">
                          {bgLabel}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-navy-900 text-base leading-tight">
                            {displayName}
                          </h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{req.city || 'Indore'}</span>
                            {req.distanceKm !== undefined && (
                              <span className="font-bold text-emerald-700">({req.distanceKm.toFixed(1)} km)</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                          req.urgency === 'URGENT'
                            ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {req.urgency}
                      </span>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-600 space-y-2 border border-slate-100">
                      <div className="flex justify-between">
                        <span>Units Required:</span>
                        <strong className="text-navy-900 font-bold">{req.unitsNeeded || 1} Unit(s)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="font-bold text-primary-700">{req.status || 'PENDING'}</span>
                      </div>
                      {isAuthenticated && req.message && (
                        <p className="text-slate-500 italic pt-1.5 border-t border-slate-200">
                          "{req.message}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                    {isAuthenticated ? (
                      <button
                        type="button"
                        onClick={() => setReportingId(req.id)}
                        className="text-xs font-bold text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span>Report Fake Request</span>
                      </button>
                    ) : (
                      <Link
                        to="/login"
                        className="text-xs font-bold text-primary-700 hover:underline flex items-center gap-1"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Sign in to view details</span>
                      </Link>
                    )}

                    {user?.role === 'DONOR' ? (
                      <Link
                        to="/donor/dashboard"
                        className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-sm"
                      >
                        Respond in Dashboard
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400 font-mono">
                        ID: #{req.id}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Report Suspicious Request Modal */}
        {reportingId && (
          <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <ShieldAlert className="w-6 h-6" />
                <h3 className="text-lg font-bold text-navy-900">Report Suspicious Blood Request</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                LifeDrop has zero intermediaries and strictly enforces voluntary donation. If a request is reported 3 times by independent users, it is automatically cancelled.
              </p>

              <form onSubmit={handleReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Reason for Reporting *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="E.g., Fraudulent contact, Commercial selling, Incorrect location details, Patient already discharged..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportingId(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-navy-900 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reporting}
                    className="px-5 py-2.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm disabled:opacity-50"
                  >
                    {reporting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
