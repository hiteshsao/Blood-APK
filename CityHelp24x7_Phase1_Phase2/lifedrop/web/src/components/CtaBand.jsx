import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useSos } from '../context/SosContext';

export default function CtaBand() {
  const { openSos } = useSos();
  return (
    <section className="bg-gradient-to-r from-[#991B1B] via-[#C62828] to-[#DC2626] text-white py-16 sm:py-20 relative overflow-hidden">
      {/* Subtle background circles for depth */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 pointer-events-none blur-2xl"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-black/10 pointer-events-none blur-2xl"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase mb-6">
          <ShieldCheck className="w-4 h-4 text-red-200" />
          <span>Join Thousands of Voluntary Donors</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-6">
          Be The Reason Someone Smiles Again.
        </h2>

        <p className="text-red-100 text-base sm:text-xl max-w-2xl mx-auto font-normal leading-relaxed mb-10">
          One unit of voluntary blood can save up to 3 precious lives. Join our community-powered network and answer emergency requests near you.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto bg-white text-[#991B1B] hover:bg-red-50 text-base font-extrabold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
          >
            <Heart className="w-5 h-5 fill-[#991B1B]" />
            <span>Register as a Donor</span>
          </Link>

          <Link
            to="/find-donors"
            className="w-full sm:w-auto bg-red-950/40 hover:bg-red-950/60 border border-white/30 text-white text-base font-bold px-8 py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" />
            <span>Find Donors Near Me</span>
          </Link>

          <button
            type="button"
            onClick={openSos}
            className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-slate-950 text-base font-black px-8 py-4 rounded-xl shadow-sos transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <AlertTriangle className="w-5 h-5 text-red-700" />
            <span>EMERGENCY SOS</span>
          </button>
        </div>

        <p className="mt-8 text-xs text-red-200">
          Pure voluntary community initiative • Zero administrative fees • Direct peer-to-peer contact
        </p>

      </div>
    </section>
  );
}
