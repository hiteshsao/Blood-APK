import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, MapPin, Droplet, Flag, ShieldAlert, CheckCircle, Plus } from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function BloodRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportingId, setReportingId] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportSuccess, setReportSuccess] = useState(null);
  const [reportError, setReportError] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setLoading(true);
    try {
      // If user is donor/recipient, fetch their relevant requests, or mock/public feed
      const res = await apiClient.get('/api/donor/requests').catch(() => null);
      if (res?.data?.data) {
        setRequests(res.data.data);
      } else {
        setRequests([]);
      }
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  const handleReport = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;

    setReportError(null);
    setReportSuccess(null);

    try {
      await apiClient.post(`/api/requests/${reportingId}/report`, {
        reason: reportReason,
      });
      setReportSuccess('Thank you. Request has been reported for safety verification.');
      setTimeout(() => {
        setReportingId(null);
        setReportReason('');
        setReportSuccess(null);
      }, 2000);
    } catch (err) {
      setReportError(err.response?.data?.message || 'Failed to report request. (Note: A request cannot be reported twice by the same user)');
    }
  };

  return (
    <div className="py-12 bg-slate-50 min-h-[calc(100vh-160px)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-black tracking-widest uppercase text-primary-600 bg-primary-100 px-3 py-1 rounded-full inline-block mb-2">
              Community Feed
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
              Emergency Blood Requests
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Active patient requests looking for voluntary donors nearby.
            </p>
          </div>

          <Link
            to="/emergency-sos"
            className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white px-5 py-3 rounded-xl font-bold text-sm shadow-md flex items-center gap-2 self-stretch sm:self-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Request</span>
          </Link>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="py-20 text-center text-slate-500 font-semibold">
            Loading active blood requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <Droplet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-navy-900 mb-1">No Active Blood Requests</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
              There are currently no urgent pending requests in your area, or you may sign in to see requests targeted to your blood group.
            </p>
            <Link
              to="/emergency-sos"
              className="inline-flex items-center gap-2 bg-[#991B1B] text-white px-5 py-2.5 rounded-xl font-bold text-sm"
            >
              Post Emergency Request
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center font-black text-red-700 text-lg">
                      {req.bloodGroup?.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-navy-900 text-lg leading-tight">
                        {req.patientName || 'Emergency Patient'}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{req.city || 'Local Hospital Area'}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-black px-2.5 py-1 rounded-full uppercase ${
                      req.urgency === 'URGENT'
                        ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {req.urgency}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-600 mb-6 bg-slate-50 p-4 rounded-xl">
                  <div className="flex justify-between">
                    <span>Units Required:</span>
                    <strong className="text-navy-900 font-bold">{req.unitsNeeded || 1} Unit(s)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-bold text-primary-700">{req.status}</span>
                  </div>
                  {req.message && (
                    <p className="text-xs text-slate-500 italic pt-1 border-t border-slate-200">
                      "{req.message}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setReportingId(req.id);
                      setReportError(null);
                      setReportSuccess(null);
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Report Fake Request</span>
                  </button>

                  <span className="text-xs text-slate-400 font-medium">
                    ID: #{req.id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Report Modal */}
        {reportingId && (
          <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <ShieldAlert className="w-6 h-6" />
                <h3 className="text-lg font-bold text-navy-900">Report Fake or Suspicious Request</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                LifeDrop maintains a zero-tolerance policy against fraudulent requests. A request with 3 reports is automatically marked CANCELLED.
              </p>

              {reportSuccess && (
                <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{reportSuccess}</span>
                </div>
              )}

              {reportError && (
                <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold">
                  {reportError}
                </div>
              )}

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
                    placeholder="E.g., Fraudulent contact, Commercial selling, Incorrect hospital info, Patient not admitted..."
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
                    className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm"
                  >
                    Submit Report
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
