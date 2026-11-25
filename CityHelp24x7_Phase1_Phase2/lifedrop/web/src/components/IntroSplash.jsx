import React, { useEffect, useState } from 'react';
import { Building2, Wrench, Droplet, Hospital, AlertTriangle } from 'lucide-react';

const KEY = 'mycityzone_intro_seen';
const CHIPS = [
  { icon: Wrench, label: 'Services', cls: 'text-brand-700' },
  { icon: Droplet, label: 'Blood', cls: 'text-red-600' },
  { icon: Hospital, label: 'Hospitals', cls: 'text-emerald-600' },
  { icon: AlertTriangle, label: 'SOS', cls: 'text-orange-600' },
];

/** Animated MyCityZone opening overlay, shown once per browser session (~2 s). */
export default function IntroSplash() {
  const [show, setShow] = useState(() => {
    try {
      return !sessionStorage.getItem(KEY);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!show) return undefined;
    try {
      sessionStorage.setItem(KEY, '1');
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => setShow(false), 2100);
    return () => clearTimeout(t);
  }, [show]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-gradient-brand flex flex-col items-center justify-center text-white animate-intro-out overflow-hidden"
      onClick={() => setShow(false)}
      role="presentation"
    >
      <div className="absolute -top-28 -right-28 w-96 h-96 rounded-full bg-white/10" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-white/5" />

      <div className="relative w-44 h-44 flex items-center justify-center">
        <span className="absolute w-28 h-28 rounded-full border-2 border-white/70 animate-ring-pulse" />
        <span className="absolute w-28 h-28 rounded-full border-2 border-white/70 animate-ring-pulse" style={{ animationDelay: '0.7s' }} />
        <div className="relative w-24 h-24 rounded-[28px] bg-white flex items-center justify-center shadow-2xl animate-pop-in">
          <Building2 className="w-12 h-12 text-brand-700" />
          <span className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-red-500 border-[3px] border-white flex items-center justify-center text-white text-sm font-black">
            +
          </span>
        </div>
      </div>

      <h1 className="text-5xl font-extrabold tracking-tight mt-4 animate-fade-up" style={{ animationDelay: '250ms' }}>
        MyCity<span className="text-blue-300">Zone</span>
      </h1>
      <p className="text-blue-100 mt-2 font-medium animate-fade-up" style={{ animationDelay: '450ms' }}>
        Your city. Every help. One app.
      </p>

      <div className="flex gap-5 mt-10">
        {CHIPS.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="flex flex-col items-center animate-pop-in" style={{ animationDelay: `${650 + i * 90}ms` }}>
              <span className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center">
                <Icon className={`w-5 h-5 ${c.cls}`} />
              </span>
              <span className="text-xs font-semibold text-blue-100 mt-1.5">{c.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
