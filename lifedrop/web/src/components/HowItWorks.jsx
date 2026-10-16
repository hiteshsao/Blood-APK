import React from 'react';
import { UserPlus, Send, Radio, CheckCircle2 } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'Register Profile',
      description: 'Sign up in under 60 seconds as a voluntary donor or recipient with your blood group and city location.',
      icon: UserPlus,
      accent: 'from-blue-600 to-indigo-600',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      step: '02',
      title: 'Post Blood Request',
      description: 'Recipients submit urgent patient requirements including blood group, units, location, and urgency level.',
      icon: Send,
      accent: 'from-amber-600 to-orange-600',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      step: '03',
      title: 'Nearby Donors Get Alerted',
      description: 'Compatible donors within a 10–25 km radius receive instant push alerts and in-app emergency notifications.',
      icon: Radio,
      accent: 'from-red-600 to-rose-600',
      badge: 'bg-red-50 text-red-700 border-red-200',
    },
    {
      step: '04',
      title: 'Donor Accepts & Connects',
      description: 'Once a verified donor accepts, phone numbers are securely unlocked for direct peer-to-peer coordination.',
      icon: CheckCircle2,
      accent: 'from-emerald-600 to-teal-600',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-slate-50 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black tracking-widest uppercase text-primary-600 bg-primary-100/70 px-3.5 py-1.5 rounded-full inline-block mb-3">
            Streamlined 4-Step Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
            How LifeDrop Works
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            From emergency request to a life-saving match, our peer-to-peer network operates in minutes when every second counts.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 relative group flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Step Badge and Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-md border ${item.badge}`}>
                      STEP {item.step}
                    </span>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.accent} flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-navy-900 tracking-tight mb-2">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-400 group-hover:text-primary-600 transition-colors">
                  {idx === 0 && 'Quick onboarding'}
                  {idx === 1 && 'No hospital bureaucracy'}
                  {idx === 2 && 'Smart Haversine radius'}
                  {idx === 3 && 'Direct lifesaving donation'}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
