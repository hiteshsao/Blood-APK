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
    <div className="min-h-screen flex flex-col bg-[#FFF8F8]">
      {/* ── Hero: Blood (main service) ─────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#7F1D1D] via-[#B91C1C] to-[#DC2626] text-white">
        <div className="absolute -top-32 -right-24 w-[460px] h-[460px] rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-40 -left-24 w-[380px] h-[380px] rounded-full bg-white/5 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-28 text-center">
          <div
            className="animate-fade-up inline-flex items-center gap-2 bg-white/15 border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide mb-7"
            style={{ animationDelay: '0ms' }}
          >
            <Droplet className="w-3.5 h-3.5 fill-white" />
            <span>Blood help 24x7 • Home services</span>
          </div>

          <h1
            className="animate-fade-up text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.06] mb-6"
            style={{ animationDelay: '120ms' }}
          >
            <span className="block">Need blood?</span>
            <span className="block bg-gradient-to-r from-rose-100 via-white to-amber-100 bg-clip-text text-transparent">
              Donors near you, fast.
            </span>
          </h1>

          <p
            className="animate-fade-up text-red-100 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-9"
            style={{ animationDelay: '240ms' }}
          >
            Free and direct: compatible donors nearby are alerted instantly. And when you need a plumber or electrician,
            book a verified pro right here.
          </p>

          <div
            className="animate-fade-up flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: '360ms' }}
          >
            <Link
              to={isAuthenticated ? '/recipient/dashboard' : '/register'}
              className="bg-white text-red-700 hover:bg-red-50 text-sm sm:text-base font-extrabold px-6 py-3.5 rounded-xl shadow-lg flex items-center gap-2 transition-colors"
            >
              <Droplet className="w-4 h-4 fill-red-600 text-red-600" />
              Request blood
            </Link>
            <Link
              to="/find-donors"
              className="bg-white/10 hover:bg-white/20 border border-white/40 text-white text-sm sm:text-base font-bold px-6 py-3.5 rounded-xl flex items-center gap-2 transition-colors"
            >
              <Users className="w-4 h-4" />
              Find donors
            </Link>
            <Link
              to={isAuthenticated ? '/profile' : '/register'}
              className="bg-white/10 hover:bg-white/20 border border-white/40 text-white text-sm sm:text-base font-bold px-6 py-3.5 rounded-xl transition-colors"
            >
              Become a donor
            </Link>
            <button
              type="button"
              onClick={openSos}
              className="bg-amber-400 hover:bg-amber-300 text-red-900 text-sm sm:text-base font-black px-6 py-3.5 rounded-xl flex items-center gap-2 uppercase tracking-wide transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              Emergency SOS
            </button>
          </div>

          <div
            className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm font-semibold text-red-100"
            style={{ animationDelay: '480ms' }}
          >
            <Link to="/requests" className="hover:text-white flex items-center gap-1.5"><HeartPulse className="w-4 h-4" /> Blood requests</Link>
            <a href="/#compatibility" className="hover:text-white flex items-center gap-1.5"><Droplet className="w-4 h-4" /> Compatibility chart</a>
            <Link to="/emergency-sos" className="hover:text-white flex items-center gap-1.5"><Hospital className="w-4 h-4" /> Emergency help</Link>
          </div>
        </div>
      </section>

      {/* ── Services grid (overlaps the hero) ─────────────── */}
      <section className="relative -mt-16 z-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-300/40 border border-slate-100 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900">Home services</h2>
              <p className="text-sm text-slate-500 mt-0.5">Verified professionals, right in your city</p>
            </div>
            <Link to="/services" className="text-sm font-bold text-brand-700 hover:text-brand-900 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <form onSubmit={onSearch} className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-1.5 mb-6">
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search electrician, plumber, AC repair..."
              className="flex-1 min-w-0 px-3 py-2.5 text-slate-800 placeholder:text-slate-400 text-sm sm:text-base font-medium outline-none bg-transparent"
              aria-label="Search services"
            />
            <button type="submit" className="bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors">
              Search
            </button>
          </form>

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
