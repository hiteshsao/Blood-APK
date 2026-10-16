import React from 'react';
import { PhoneCall } from 'lucide-react';

export default function TopAlertBar() {
  return (
    <aside aria-label="Emergency Hotline" className="bg-gradient-to-r from-[#991B1B] to-[#C62828] text-white py-1.5 px-4 text-xs font-bold tracking-wide shadow-sm relative z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 sm:gap-3 flex-wrap text-center">
        <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] uppercase font-extrabold tracking-wider border border-white/30">
          <span className="w-1.5 h-1.5 rounded-full bg-red-200 animate-ping"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-white -ml-3"></span>
          LIVE
        </span>
        <span className="flex items-center gap-1.5">
          <span>Medical emergency? Call</span>
          <a
            href="tel:112"
            className="underline underline-offset-2 hover:text-red-100 transition-colors inline-flex items-center gap-0.5 font-black"
          >
            <PhoneCall className="w-3 h-3" />
            112 (Emergency)
          </a>
          <span>/</span>
          <a
            href="tel:108"
            className="underline underline-offset-2 hover:text-red-100 transition-colors inline-flex items-center gap-0.5 font-black"
          >
            108 (Ambulance)
          </a>
        </span>
      </div>
    </aside>
  );
}
