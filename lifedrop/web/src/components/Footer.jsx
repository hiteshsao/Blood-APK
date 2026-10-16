import React from 'react';
import { Link } from 'react-router-dom';
import { Droplet, Heart, Shield, PhoneCall, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand Info (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#991B1B] via-[#B91C1C] to-[#C62828] p-2 flex items-center justify-center text-white shadow-md">
                <Droplet className="w-5 h-5 fill-white stroke-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline text-2xl font-black tracking-tight leading-none">
                  <span className="text-white">Life</span>
                  <span className="text-[#EF4444]">Drop</span>
                </div>
                <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">
                  Blood Donation Network
                </span>
              </div>
            </Link>
            
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              A peer-to-peer voluntary blood donor network connecting compassionate donors directly with recipients in need of urgent transfusions.
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-lg w-fit">
              <Shield className="w-3.5 h-3.5" />
              <span>100% Free & Voluntary • Zero Commercial Intermediaries</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider">Quick Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <a href="/#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              </li>
              <li>
                <Link to="/find-donors" className="hover:text-white transition-colors">Find Donors</Link>
              </li>
              <li>
                <Link to="/requests" className="hover:text-white transition-colors">Blood Requests</Link>
              </li>
              <li>
                <a href="/#compatibility" className="hover:text-white transition-colors">Compatibility Chart</a>
              </li>
            </ul>
          </div>

          {/* Emergency & Support */}
          <div className="space-y-3">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider">Emergency Hotlines</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="tel:112" className="flex items-center gap-1.5 text-red-400 hover:text-red-300 font-semibold">
                  <PhoneCall className="w-3.5 h-3.5" /> National Emergency: 112
                </a>
              </li>
              <li>
                <a href="tel:108" className="flex items-center gap-1.5 text-red-400 hover:text-red-300 font-semibold">
                  <PhoneCall className="w-3.5 h-3.5" /> Ambulance Service: 108
                </a>
              </li>
              <li>
                <Link to="/emergency-sos" className="text-amber-400 hover:text-amber-300 font-semibold">
                  Post Emergency SOS
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Trust */}
          <div className="space-y-3">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider">Legal & Trust</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link to="/#compatibility" className="hover:text-white transition-colors">Donor Safety Guidelines</Link>
              </li>
              <li>
                <Link to="/requests" className="hover:text-white transition-colors">Report Fake Request</Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Mandatory Medical Disclaimer Band */}
        <div className="my-8 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs sm:text-sm text-slate-300 leading-relaxed text-center sm:text-left flex flex-col sm:flex-row items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-900/40 text-red-400 flex items-center justify-center shrink-0 border border-red-800/30">
            <Heart className="w-4 h-4 fill-red-400/20" />
          </div>
          <div className="flex-1">
            <span className="font-bold text-white">Medical Disclaimer: </span>
            LifeDrop connects donors and recipients. In a medical emergency, contact a hospital or call 112.
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4 pt-4">
          <p>© {new Date().getFullYear()} LifeDrop Network. Voluntary, open community initiative.</p>
          <p className="flex items-center gap-1">
            Built with care for voluntary life savers <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
          </p>
        </div>

      </div>
    </footer>
  );
}
