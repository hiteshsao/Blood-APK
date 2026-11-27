import React, { useState, useEffect } from 'react';
import { Users, FileText, MapPin, Heart } from 'lucide-react';
import apiClient from '../api/client';

export default function StatsStrip() {
  const [stats, setStats] = useState({
    donors: 0,
    requests: 0,
    cities: 0,
    livesHelped: 0,
  });

  useEffect(() => {
    // Attempt to query live public stats or health if backend provides, otherwise strictly keep 0 (no fake numbers)
    async function fetchStats() {
      try {
        const res = await apiClient.get('/api/stats');
        if (res.data?.data) {
          setStats(res.data.data);
        }
      } catch {
        // Fallback: strictly keep 0 as requested ("show 0 until API data exists, no fake numbers")
      }
    }
    fetchStats();
  }, []);

  const statItems = [
    {
      label: 'Donors Registered',
      value: stats.donors,
      icon: Users,
      color: 'text-primary-600',
      bg: 'bg-primary-50',
    },
    {
      label: 'Blood Requests',
      value: stats.requests,
      icon: FileText,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Cities Covered',
      value: stats.cities,
      icon: MapPin,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Lives Helped',
      value: stats.livesHelped,
      icon: Heart,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
  ];

  return (
    <section className="relative -mt-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-20">
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-6 md:p-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`flex flex-col items-center sm:items-start p-4 rounded-xl transition-colors ${
                index < 3 ? 'lg:border-r lg:border-slate-100' : ''
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
                  {item.value.toLocaleString()}
                </div>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
