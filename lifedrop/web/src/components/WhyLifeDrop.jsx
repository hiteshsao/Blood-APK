import React from 'react';
import { Navigation, ShieldCheck, BellRing, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WhyLifeDrop() {
  const cards = [
    {
      title: 'Nearby Matching',
      subtitle: 'Precision Haversine Proximity',
      description:
        'Our geospatial matching algorithm calculates distance with surgical accuracy, locating active, eligible donors within a 10 to 25 km radius in seconds.',
      icon: Navigation,
      gradient: 'from-rose-500 to-red-600',
      badge: 'Geospatial Precision',
    },
    {
      title: 'Privacy First',
      subtitle: 'Zero Public Directory Exposure',
      description:
        'Your contact number is never posted publicly on social media or search engines. Phone numbers unlock only after mutual acceptance between donor and recipient.',
      icon: ShieldCheck,
      gradient: 'from-red-600 to-primary-800',
      badge: 'Mutual Consent',
    },
    {
      title: 'Instant Alerts',
      subtitle: 'Direct Push During Golden Hour',
      description:
        'Emergency notifications dispatch instantly to matched donors via push tokens and in-app feeds, bypassing hospital queues and bureaucratic bottlenecks.',
      icon: BellRing,
      gradient: 'from-amber-500 to-red-600',
      badge: 'Zero Middlemen',
    },
  ];

  return (
    <section className="py-20 bg-slate-50 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black tracking-widest uppercase text-primary-600 bg-primary-100/70 px-3.5 py-1.5 rounded-full inline-block mb-3">
            Pure Peer-to-Peer Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
            Why Choose LifeDrop?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Engineered solely for donors and recipients. No blood banks, no commercial brokers, no delays.
          </p>
        </div>

        {/* 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-md shadow-red-900/10 group-hover:scale-105 transition-transform`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-navy-900 tracking-tight mb-1">
                    {card.title}
                  </h3>
                  <p className="text-xs font-bold text-primary-700 uppercase tracking-wider mb-4">
                    {card.subtitle}
                  </p>

                  <p className="text-slate-600 text-sm leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-primary-600 group-hover:text-primary-800 transition-colors">
                  <span>Learn more about safety</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
