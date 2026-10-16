import React, { useState } from 'react';
import { Search, MapPin, Droplet, User, Phone, AlertCircle } from 'lucide-react';
import apiClient from '../api/client';
import { BLOOD_GROUPS } from '../utils/bloodCompatibility';

export default function FindDonors() {
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [latitude, setLatitude] = useState('23.2599'); // Bhopal center default
  const [longitude, setLongitude] = useState('77.4126');
  const [radiusKm, setRadiusKm] = useState('15');
  const [loading, setLoading] = useState(false);
  const [donors, setDonors] = useState([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(4));
          setLongitude(pos.coords.longitude.toFixed(4));
        },
        () => {
          setError('Could not access current location. Please enter coordinates or use Bhopal default.');
        }
      );
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      // Backend expects bloodGroup label or enum, let's pass label
      const res = await apiClient.get('/api/donors/nearby', {
        params: {
          bloodGroup,
          lat: parseFloat(latitude),
          lng: parseFloat(longitude),
          radiusKm: parseFloat(radiusKm),
        },
      });
      if (res.data?.data) {
        setDonors(res.data.data);
      } else {
        setDonors([]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search nearby donors. Please check coordinates and backend connection.');
      setDonors([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 bg-slate-50 min-h-[calc(100vh-160px)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-black tracking-widest uppercase text-primary-600 bg-primary-100 px-3 py-1 rounded-full inline-block mb-2">
            Nearby Donor Search
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
            Find Compatible Donors
          </h1>
          <p className="mt-2 text-slate-600 text-sm sm:text-base">
            Search active and eligible voluntary donors within radius using geospatial matching.
          </p>
        </div>

        {/* Search Filter Box */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 mb-10">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            
            {/* Blood Group */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Blood Group Needed
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-navy-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Latitude / Longitude */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Location (Lat / Lng)
                </label>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  className="text-[11px] font-bold text-primary-600 hover:text-primary-800 flex items-center gap-0.5"
                >
                  <MapPin className="w-3 h-3" /> GPS
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Lat"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-semibold text-navy-900"
                  required
                />
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Lng"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-semibold text-navy-900"
                  required
                />
              </div>
            </div>

            {/* Radius */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Search Radius: {radiusKm} km
              </label>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-navy-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="5">5 km (Immediate Local)</option>
                <option value="10">10 km (Standard Normal)</option>
                <option value="15">15 km (Metro Bhopal Area)</option>
                <option value="25">25 km (Emergency Urgent)</option>
                <option value="50">50 km (Extended Region)</option>
              </select>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
                <span>{loading ? 'Searching...' : 'Search Donors'}</span>
              </button>
            </div>

          </form>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2 mb-8">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Results */}
        {searched && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-navy-900">
                Found {donors.length} Compatible Donor{donors.length !== 1 ? 's' : ''}
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                Sorted by distance (closest first)
              </span>
            </div>

            {donors.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <Droplet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-navy-900 mb-1">No Donors Found in this Area</h4>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                  Try expanding the search radius or post a Blood Request so voluntary donors get notified.
                </p>
                <a
                  href="/emergency-sos"
                  className="inline-flex items-center gap-2 bg-[#991B1B] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm"
                >
                  Post Blood Request
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {donors.map((donor) => (
                  <div
                    key={donor.id}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center font-black text-red-700 text-sm">
                          {donor.bloodGroup?.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')}
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {donor.distanceKm !== undefined ? `${donor.distanceKm.toFixed(1)} km away` : 'Available'}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-navy-900 text-lg mb-1">{donor.name}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{donor.city || 'Nearby'}</span>
                      </p>

                      <div className="text-xs text-slate-500 space-y-1">
                        <div>Gender: <strong className="text-slate-700">{donor.gender || 'Not specified'}</strong></div>
                        <div>Age: <strong className="text-slate-700">{donor.age || '—'}</strong></div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <p className="text-[11px] text-slate-400 italic">
                        Phone contact unlocks when blood request is posted & accepted.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
