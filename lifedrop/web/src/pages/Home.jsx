import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, AlertTriangle, Droplet } from 'lucide-react';
import StatsStrip from '../components/StatsStrip';
import HowItWorks from '../components/HowItWorks';
import BloodCompatibilityChart from '../components/BloodCompatibilityChart';
import WhyLifeDrop from '../components/WhyLifeDrop';
import CtaBand from '../components/CtaBand';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      
      {/* Hero Section */}
      <section className="bg-[#FFF5F5] pt-14 pb-24 px-4 sm:px-6 lg:px-8 border-b border-red-100/60 relative overflow-hidden">
        
        {/* Subtle decorative background watermarks */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-red-200/20 blur-3xl rounded-full pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          
          {/* Small pill badge: "Community-driven Blood Donor Network" */}
          <div className="inline-flex items-center gap-2 bg-red-100/90 border border-red-200/80 px-4 py-1.5 rounded-full text-xs font-bold text-primary-800 mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            <span>Community-driven Blood Donor Network</span>
          </div>

          {/* H1 in two lines, very bold, tight tracking */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6">
            <span className="block text-[#0F172A]">Every Drop Counts.</span>
            <span className="block bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#EF4444] bg-clip-text text-transparent">
              Every Life Saved.
            </span>
          </h1>

          {/* Subtitle in slate */}
          <p className="text-slate-600 text-base sm:text-lg md:text-xl font-normal max-w-2xl mx-auto leading-relaxed mb-10">
            A real-time network connecting voluntary blood donors with people who need blood, within seconds during critical emergencies.
          </p>

          {/* Three buttons in one row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-2xl mx-auto">
            
            {/* Primary: Find Donors Near Me */}
            <Link
              to="/find-donors"
              className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-sm sm:text-base font-bold px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-red-200" />
              <span>Find Donors Near Me</span>
            </Link>

            {/* Secondary: Register as a Donor */}
            <Link
              to="/register"
              className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-sm sm:text-base font-bold px-6 py-3.5 rounded-xl shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 fill-red-50" />
              <span>Register as a Donor</span>
            </Link>

            {/* SOS Style: EMERGENCY SOS */}
            <Link
              to="/emergency-sos"
              className="bg-gradient-to-r from-[#DC2626] to-[#991B1B] hover:from-[#EF4444] hover:to-[#B91C1C] text-white text-sm sm:text-base font-black px-6 py-3.5 rounded-xl shadow-sos hover:shadow-sos-hover transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-wide transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-200 animate-bounce" />
              <span>EMERGENCY SOS</span>
            </Link>

          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500 font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Live Geolocation Matching
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Droplet className="w-3.5 h-3.5 text-red-500 fill-red-500" />
              Direct Voluntary Donors
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">100% Free & Open</span>
          </div>

        </div>
      </section>

      {/* 4-Card Stats Strip */}
      <StatsStrip />

      {/* How It Works (4 steps) */}
      <HowItWorks />

      {/* Blood Group Compatibility Chart */}
      <BloodCompatibilityChart />

      {/* Why LifeDrop (3-card section) */}
      <WhyLifeDrop />

      {/* Final Call to Action Band */}
      <CtaBand />

    </div>
  );
}
