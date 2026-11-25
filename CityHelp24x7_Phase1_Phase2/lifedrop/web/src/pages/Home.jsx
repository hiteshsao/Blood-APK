import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShieldCheck,
  Star,
  IndianRupee,
  HeartPulse,
  AlertTriangle,
  Droplet,
  Users,
  Hospital,
  ArrowRight,
  Briefcase,
  CalendarCheck,
  BadgeCheck,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';
import { useSos } from '../context/SosContext';
import { useAuth } from '../context/AuthContext';
import StatsStrip from '../components/StatsStrip';
import BloodCompatibilityChart from '../components/BloodCompatibilityChart';
import Reveal from '../components/Reveal';
import { SERVICE_CATEGORIES } from '../data/serviceCategories';

const TRUST = [
  { icon: ShieldCheck, label: 'Verified professionals' },
  { icon: Star, label: 'Rated by your neighbours' },
  { icon: IndianRupee, label: 'Clear starting prices' },
  { icon: HeartPulse, label: 'Blood help, 24x7' },
];

const STEPS = [
  { icon: LayoutGrid, title: 'Pick a service', text: 'Electrician, plumber, AC repair and more, in your city.' },
  { icon: BadgeCheck, title: 'Choose a verified pro', text: 'Compare ratings, experience and starting prices.' },
  { icon: CalendarCheck, title: 'Book and relax', text: 'Contact details unlock only after the pro accepts.' },
];

export default function Home() {
  const { openSos } = useSos();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const onSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/services?q=${encodeURIComponent(term)}` : '/services');
  };

  const tiles = SERVICE_CATEGORIES.slice(0, 7);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FB]">
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-brand text-white">
        <div className="absolute -top-32 -right-24 w-[460px] h-[460px] rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-40 -left-24 w-[380px] h-[380px] rounded-full bg-white/5 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-28 text-center">
          <div
            className="animate-fade-up inline-flex items-center gap-2 bg-white/15 border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide mb-7"
            style={{ animationDelay: '0ms' }}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Your city's super app</span>
          </div>

          <h1
            className="animate-fade-up text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.06] mb-6"
            style={{ animationDelay: '120ms' }}
          >
            <span className="block">Your city.</span>
            <span className="block bg-gradient-to-r from-sky-200 via-white to-blue-200 bg-clip-text text-transparent">
              Every help. One app.
            </span>
          </h1>

          <p
            className="animate-fade-up text-blue-100 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-9"
            style={{ animationDelay: '240ms' }}
          >
            Book trusted electricians, plumbers and more near you, and reach blood donors directly when it matters most.
          </p>

          {/* Search */}
          <form
            onSubmit={onSearch}
            className="animate-fade-up max-w-2xl mx-auto flex items-center bg-white rounded-2xl p-2 shadow-2xl shadow-blue-950/30"
            style={{ animationDelay: '360ms' }}
          >
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search electrician, plumber, AC repair..."
              className="flex-1 min-w-0 px-3 py-3 text-slate-800 placeholder:text-slate-400 text-sm sm:text-base font-medium outline-none bg-transparent"
              aria-label="Search services"
            />
            <button
              type="submit"
              className="bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm sm:text-base px-5 sm:px-7 py-3 rounded-xl transition-colors"
            >
              Search
            </button>
          </form>

          <div
            className="animate-fade-up mt-6 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: '480ms' }}
          >
            <Link
              to="/find-donors"
              className="bg-white/10 hover:bg-white/20 border border-white/25 text-white text-sm font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors"
            >
              <Droplet className="w-4 h-4 text-red-300 fill-red-300" />
              Find blood donors
            </Link>
            <button
              type="button"
              onClick={openSos}
              className="bg-gradient-to-r from-[#DC2626] to-[#991B1B] hover:from-[#EF4444] hover:to-[#B91C1C] text-white text-sm font-black px-5 py-2.5 rounded-xl shadow-sos flex items-center gap-2 uppercase tracking-wide transition-all"
            >
              <AlertTriangle className="w-4 h-4 text-amber-200" />
              Emergency SOS
            </button>
          </div>
        </div>
      </section>

      {/* ── Services grid (overlaps the hero) ─────────────── */}
      <section className="relative -mt-16 z-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-300/40 border border-slate-100 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900">Popular services</h2>
              <p className="text-sm text-slate-500 mt-0.5">Verified professionals, right in your city</p>
            </div>
            <Link to="/services" className="text-sm font-bold text-brand-700 hover:text-brand-900 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4">
            {tiles.map((c, i) => {
              const Icon = c.icon;
              return (
                <Link
                  key={c.name}
                  to={`/services?category=${encodeURIComponent(c.name)}`}
                  className="animate-pop-in group flex flex-col items-center text-center"
                  style={{ animationDelay: `${600 + i * 70}ms` }}
                >
                  <span className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700 group-hover:bg-brand-700 group-hover:text-white group-hover:-translate-y-1 transition-all duration-200">
                    <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
                  </span>
                  <span className="mt-2 text-[11px] sm:text-xs font-bold text-slate-700 leading-tight">{c.name}</span>
                </Link>
              );
            })}
            <Link
              to="/services"
              className="animate-pop-in group flex flex-col items-center text-center"
              style={{ animationDelay: `${600 + tiles.length * 70}ms` }}
            >
              <span className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 group-hover:bg-navy-900 group-hover:text-white group-hover:-translate-y-1 transition-all duration-200">
                <LayoutGrid className="w-6 h-6" />
              </span>
              <span className="mt-2 text-[11px] sm:text-xs font-bold text-slate-700">More</span>
            </Link>
          </div>

          <div className="mt-7 pt-6 border-t border-slate-100 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {TRUST.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.label} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600">
                  <span className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-700 shrink-0">
                    <Icon className="w-4 h-4" />
                  </span>
                  {t.label}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How booking works ─────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-12">
            <span className="text-xs font-black tracking-widest text-brand-700 uppercase">How it works</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 mt-2">Book a pro in three steps</h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={s.title} delay={i * 120} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card-soft">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-11 h-11 rounded-xl bg-gradient-brand text-white flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-black text-slate-400">STEP 0{i + 1}</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-navy-900">{s.title}</h3>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">{s.text}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Emergency & health (Blood module) ─────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-6">
        <Reveal className="max-w-6xl mx-auto rounded-3xl bg-white border border-red-100 shadow-card-soft overflow-hidden">
          <div className="grid lg:grid-cols-5">
            <div className="lg:col-span-3 p-7 sm:p-10">
              <span className="inline-flex items-center gap-2 bg-red-50 text-red-700 border border-red-100 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                <Droplet className="w-3.5 h-3.5 fill-red-600 text-red-600" /> Emergency &amp; health
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 mt-4 leading-tight">
                Need blood urgently?
                <span className="block text-red-600">Donors near you, in minutes.</span>
              </h2>
              <p className="text-slate-500 mt-3 max-w-lg">
                Free and direct: compatible donors nearby are alerted instantly, and phone numbers unlock only after a donor accepts.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <Link
                  to={isAuthenticated ? '/recipient/dashboard' : '/register'}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-3 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <Droplet className="w-4 h-4 fill-white" /> Request blood
                </Link>
                <Link
                  to={isAuthenticated ? '/profile' : '/register'}
                  className="border-2 border-red-600 text-red-700 hover:bg-red-50 font-bold px-5 py-3 rounded-xl transition-colors"
                >
                  Become a donor
                </Link>
              </div>
            </div>
            <div className="lg:col-span-2 bg-red-50/60 p-7 sm:p-10 grid grid-cols-2 gap-3 content-center">
              {[
                { to: '/find-donors', icon: Users, label: 'Nearby donors' },
                { to: '/requests', icon: HeartPulse, label: 'Blood requests' },
                { to: '/#compatibility', icon: Droplet, label: 'Compatibility' },
                { to: '/emergency-sos', icon: Hospital, label: 'Emergency SOS' },
              ].map((x) => {
                const Icon = x.icon;
                return (
                  <Link
                    key={x.label}
                    to={x.to}
                    className="bg-white rounded-2xl p-4 border border-red-100 hover:border-red-300 hover:-translate-y-0.5 transition-all flex flex-col items-start gap-2"
                  >
                    <span className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-sm font-bold text-navy-900">{x.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </Reveal>
      </section>

      {/* Live numbers */}
      <div className="pt-16">
        <StatsStrip />
      </div>

      {/* Blood group compatibility (blood module reference) */}
      <BloodCompatibilityChart />

      {/* ── Partner CTA ───────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <Reveal className="max-w-6xl mx-auto rounded-3xl bg-gradient-to-br from-navy-900 to-navy-800 text-white p-8 sm:p-12 flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
          <div className="flex items-start gap-4">
            <span className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <Briefcase className="w-7 h-7" />
            </span>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold">Are you a professional?</h2>
              <p className="text-slate-300 mt-1 max-w-xl">
                Join MyCityZone as a verified partner and get bookings from people in your city. Register from the MyCityZone app.
              </p>
            </div>
          </div>
          <Link
            to={isAuthenticated ? '/services' : '/register'}
            className="bg-white text-navy-900 hover:bg-brand-50 font-bold px-6 py-3 rounded-xl flex items-center gap-2 shrink-0 transition-colors"
          >
            Become a partner <ArrowRight className="w-4 h-4" />
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
