import React, { useState, useEffect } from 'react';
import { Search, MapPin, Droplet, User, Navigation, AlertCircle, ShieldAlert, Sparkles, SlidersHorizontal } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BLOOD_GROUPS } from '../utils/bloodCompatibility';
import { DonorCardSkeleton } from '../components/Skeleton';

// Fix Leaflet default marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Crimson Pin for Donors
const donorPinIcon = L.divIcon({
  className: 'custom-donor-pin',
  html: `<div style="background-color:#991B1B; color:white; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:11px; border:2px solid white; box-shadow:0 3px 6px rgba(0,0,0,0.3);">🩸</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Custom Blue Pin for User Location
const userPinIcon = L.divIcon({
  className: 'custom-user-pin',
  html: `<div style="background-color:#2563EB; color:white; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:12px; border:2px solid white; box-shadow:0 3px 6px rgba(0,0,0,0.3);">📍</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, 12);
    }
  }, [center, map]);
  return null;
}

export default function FindDonors() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [bloodGroup, setBloodGroup] = useState('A+');
  const [latitude, setLatitude] = useState(user?.latitude ? String(user.latitude) : '22.7196');
  const [longitude, setLongitude] = useState(user?.longitude ? String(user.longitude) : '75.8577');
  const [radiusKm, setRadiusKm] = useState('15');

  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Perform initial nearby search on page load
    executeSearch();
  }, []);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lat = pos.coords.latitude.toFixed(4);
        const lng = pos.coords.longitude.toFixed(4);
        setLatitude(lat);
        setLongitude(lng);
        toast.success(`Current location updated: ${lat}, ${lng}`);
      },
      () => {
        setLocating(false);
        toast.warning('Unable to retrieve location. Using current inputs.');
      },
      { timeout: 10000 }
    );
  };

  const executeSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await axiosInstance.get('/api/recipient/donors/nearby', {
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
      const msg = err.response?.data?.message || 'Failed to search nearby donors.';
      setError(msg);
      setDonors([]);
    } finally {
      setLoading(false);
    }
  };

  const currentCenter = [parseFloat(latitude) || 22.7196, parseFloat(longitude) || 75.8577];

  return (
    <div className="py-10 bg-slate-50 min-h-[calc(100vh-160px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-black tracking-widest uppercase text-primary-600 bg-primary-100 px-3 py-1 rounded-full inline-block mb-2">
              Recipient Geospatial Discovery
            </span>
            <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
              Find Compatible Donors
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Live map of eligible voluntary donors within reach. Privacy shielded: phone numbers are locked until a request is accepted.
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Strict Privacy Shield Active</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <form onSubmit={executeSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            
            {/* Blood Group */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Patient Blood Group
              </label>
              <select
                id="search-blood-group-select"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-red-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Coordinates with GPS */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Center Coordinates
                </label>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={locating}
                  className="text-[11px] font-bold text-primary-600 hover:text-primary-800 flex items-center gap-1"
                >
                  <Navigation className={`w-3 h-3 ${locating ? 'animate-spin' : ''}`} />
                  <span>GPS</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Lat"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-navy-900"
                  required
                />
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Lng"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-navy-900"
                  required
                />
              </div>
            </div>

            {/* Radius */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Radius Filter: {radiusKm} km
              </label>
              <select
                id="search-radius-select"
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-navy-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="5">5 km (Immediate Local)</option>
                <option value="10">10 km (Standard)</option>
                <option value="15">15 km (City Metro Area)</option>
                <option value="25">25 km (Urgent / Extended)</option>
                <option value="50">50 km (Regional)</option>
              </select>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                id="find-donors-search-btn"
                disabled={loading}
                className="w-full bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-extrabold py-3.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
              >
                <Search className="w-4 h-4" />
                <span>{loading ? 'Searching...' : 'Filter Donors'}</span>
              </button>
            </div>

          </form>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Map and Donors List Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Interactive Map (Leaflet + OpenStreetMap) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-2">
            <div className="h-[450px] w-full rounded-2xl overflow-hidden relative z-10">
              <MapContainer
                center={currentCenter}
                zoom={12}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <MapUpdater center={currentCenter} />

                {/* Recipient / Search Center Pin */}
                <Marker position={currentCenter} icon={userPinIcon}>
                  <Popup>
                    <div className="text-xs font-sans">
                      <strong className="block text-navy-900 font-extrabold">Your Search Center</strong>
                      <span className="text-slate-500">Radius: {radiusKm} km</span>
                    </div>
                  </Popup>
                </Marker>

                {/* Donor Pins */}
                {donors.map((donor) => {
                  if (!donor.latitude || !donor.longitude) return null;
                  return (
                    <Marker
                      key={donor.id}
                      position={[donor.latitude, donor.longitude]}
                      icon={donorPinIcon}
                    >
                      <Popup>
                        <div className="text-xs font-sans space-y-1 p-1">
                          <div className="flex items-center gap-1.5 font-extrabold text-navy-900">
                            <span className="text-red-700 bg-red-100 px-1.5 py-0.5 rounded text-[10px]">
                              {donor.bloodGroup?.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')}
                            </span>
                            <span>{donor.name}</span>
                          </div>
                          <p className="text-slate-500">
                            {donor.city} • <strong className="text-emerald-700">{donor.distanceKm !== undefined ? `${donor.distanceKm.toFixed(1)} km away` : 'Nearby'}</strong>
                          </p>
                          <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100">
                            Phone hidden until request is accepted.
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>

          {/* Donor List Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy-900">
                Found {donors.length} Compatible Donor{donors.length !== 1 ? 's' : ''}
              </h2>
              <span className="text-xs text-slate-500 font-semibold">
                Within {radiusKm} km
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                <DonorCardSkeleton />
                <DonorCardSkeleton />
              </div>
            ) : donors.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm">
                <Droplet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-navy-900 text-sm mb-1">No Compatible Donors in this Range</h3>
                <p className="text-slate-500 text-xs max-w-xs mx-auto mb-4">
                  Expand your search radius or create a blood request on your dashboard so alerts are broadcast to donors.
                </p>
                <a
                  href="/recipient/dashboard"
                  className="inline-block bg-[#991B1B] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm"
                >
                  Create Blood Request
                </a>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {donors.map((donor) => (
                  <div
                    key={donor.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-black text-sm shrink-0">
                        {donor.bloodGroup?.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-navy-900 text-sm">
                          {donor.name}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{donor.city || 'Nearby'}</span>
                        </p>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Age: <span className="font-semibold text-slate-600">{donor.age || '—'}</span> • Gender: <span className="font-semibold text-slate-600">{donor.gender || '—'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full block">
                        {donor.distanceKm !== undefined ? `${donor.distanceKm.toFixed(1)} km away` : 'Nearby'}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Phone hidden
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
