import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Star, CheckCircle2, MapPin, Smartphone, LogIn, Users } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import Reveal from '../components/Reveal';
import { SERVICE_CATEGORIES, iconFor, formatPrice } from '../data/serviceCategories';

/**
 * Services directory. Everyone sees the categories; signed-in users also see the verified
 * providers from the API (phone numbers are never shown here, bookings happen in the app).
 */
export default function Services() {
  const { isAuthenticated, user } = useAuth();
  const [params, setParams] = useSearchParams();
  const activeName = params.get('category') || '';
  const [q, setQ] = useState(params.get('q') || '');
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Real categories (with ids) for signed-in users; the static list otherwise.
  useEffect(() => {
    if (!isAuthenticated) return;
    axiosInstance
      .get('/api/services/categories')
      .then((res) => setCategories(res.data?.data || []))
      .catch(() => setCategories([]));
  }, [isAuthenticated]);

  const shownCategories = useMemo(() => {
    if (categories.length) return categories.map((c) => ({ ...c, iconCmp: iconFor(c.name) }));
    return SERVICE_CATEGORIES.map((c) => ({ name: c.name, iconCmp: c.icon }));
  }, [categories]);

  const activeId = categories.find((c) => c.name === activeName)?.id;

  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeName && categories.length && !activeId) return; // wait for ids
    let cancelled = false;
    setLoading(true);
    setError('');
    axiosInstance
      .get('/api/services/providers', {
        params: {
          sort: 'rating',
          size: 24,
          ...(activeId ? { categoryId: activeId } : {}),
          ...(params.get('q') ? { q: params.get('q') } : {}),
          ...(user?.cityId ? { cityId: user.cityId } : {}),
        },
      })
      .then((res) => !cancelled && setProviders(res.data?.data?.content || []))
      .catch((err) => !cancelled && setError(err?.response?.data?.message || 'Could not load providers.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, activeId, activeName, categories.length, params, user?.cityId]);

  const selectCategory = (name) => {
    const next = new URLSearchParams(params);
    if (!name || name === activeName) next.delete('category');
    else next.set('category', name);
    setParams(next);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (q.trim()) next.set('q', q.trim());
    else next.delete('q');
    setParams(next);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      {/* Header */}
      <section className="bg-gradient-brand text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="animate-fade-up text-3xl sm:text-5xl font-extrabold tracking-tight">Home services</h1>
          <p className="animate-fade-up text-blue-100 mt-2" style={{ animationDelay: '100ms' }}>
            Trusted, verified professionals near you
          </p>
          <form
            onSubmit={submitSearch}
            className="animate-fade-up mt-6 max-w-xl flex items-center bg-white rounded-2xl p-1.5"
            style={{ animationDelay: '200ms' }}
          >
            <Search className="w-5 h-5 text-slate-400 ml-3" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search electrician, plumber..."
              className="flex-1 min-w-0 px-3 py-2.5 text-slate-800 outline-none bg-transparent font-medium"
              aria-label="Search services"
            />
            <button type="submit" className="bg-brand-700 hover:bg-brand-800 text-white font-bold px-5 py-2.5 rounded-xl">
              Search
            </button>
          </form>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => selectCategory('')}
            className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
              !activeName ? 'bg-brand-700 border-brand-700 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
            }`}
          >
            All
          </button>
          {shownCategories.map((c, i) => {
            const Icon = c.iconCmp;
            const on = c.name === activeName;
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => selectCategory(c.name)}
                className={`animate-pop-in flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
                  on ? 'bg-brand-700 border-brand-700 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                }`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <Icon className="w-4 h-4" />
                {c.name}
              </button>
            );
          })}
        </div>

        {/* Providers */}
        <div className="mt-8">
          {!isAuthenticated ? (
            <Reveal className="bg-white rounded-3xl border border-slate-100 shadow-card-soft p-8 sm:p-10 text-center max-w-2xl mx-auto">
              <span className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center mx-auto">
                <Users className="w-7 h-7" />
              </span>
              <h2 className="text-2xl font-extrabold text-navy-900 mt-4">See verified pros near you</h2>
              <p className="text-slate-500 mt-2">
                Sign in to browse ratings, experience and prices{activeName ? ` for ${activeName}` : ''}.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mt-6">
                <Link to="/login" className="bg-brand-700 hover:bg-brand-800 text-white font-bold px-5 py-3 rounded-xl flex items-center gap-2">
                  <LogIn className="w-4 h-4" /> Sign in
                </Link>
                <Link to="/register" className="border-2 border-brand-700 text-brand-700 hover:bg-brand-50 font-bold px-5 py-3 rounded-xl">
                  Create an account
                </Link>
              </div>
            </Reveal>
          ) : loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-44 rounded-2xl bg-white border border-slate-100 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <p className="text-red-600 font-semibold">{error}</p>
          ) : providers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-500">
              No verified providers found{activeName ? ` for ${activeName}` : ''} in your city yet.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {providers.map((p, i) => {
                const Icon = iconFor(p.categoryName);
                const initial = (p.displayName || '?').replace(/^Sample\s+/i, '').charAt(0).toUpperCase();
                return (
                  <Reveal
                    key={p.id}
                    delay={(i % 6) * 70}
                    className="bg-white rounded-2xl border border-slate-100 shadow-card-soft p-5 hover:-translate-y-1 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <span className="w-12 h-12 rounded-xl bg-brand-50 text-brand-700 font-extrabold text-lg flex items-center justify-center">
                        {initial}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-navy-900 mt-3 leading-snug">{p.displayName}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Icon className="w-3.5 h-3.5" />
                      {p.categoryName}
                      {p.experienceYears != null ? ` · ${p.experienceYears} yrs` : ''}
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-sm">
                      {p.ratingCount > 0 ? (
                        <span className="flex items-center gap-1 font-bold text-navy-900">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          {Number(p.ratingAvg).toFixed(1)}
                          <span className="font-medium text-slate-400">({p.ratingCount})</span>
                        </span>
                      ) : (
                        <span className="text-xs font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded">New</span>
                      )}
                      {p.distanceKm != null ? (
                        <span className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3.5 h-3.5" />
                          {p.distanceKm} km
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                      <span className="text-sm font-bold text-navy-900">{formatPrice(p)}</span>
                      <span className="text-xs font-bold text-brand-700 flex items-center gap-1">
                        <Smartphone className="w-3.5 h-3.5" /> Book in app
                      </span>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
