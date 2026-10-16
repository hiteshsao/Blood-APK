import React, { useState } from 'react';
import { Droplet, CheckCircle, XCircle, Info, Sparkles } from 'lucide-react';
import { BLOOD_GROUPS, COMPATIBILITY_MAP, DONATES_TO_MAP, canDonate } from '../utils/bloodCompatibility';

export default function BloodCompatibilityChart() {
  const [selectedGroup, setSelectedGroup] = useState('A+');
  const [mode, setMode] = useState('recipient'); // 'recipient' or 'donor'

  const compatibleDonors = COMPATIBILITY_MAP[selectedGroup] || [];
  const canDonateTo = DONATES_TO_MAP[selectedGroup] || [];

  return (
    <section id="compatibility" className="py-20 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-black tracking-widest uppercase text-primary-600 bg-primary-100/70 px-3.5 py-1.5 rounded-full inline-block mb-3">
            Medical Match Matrix
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
            Blood Group Compatibility Chart
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Check compatible blood matches before initiating a request or answering a call.
          </p>
        </div>

        {/* Interactive Selector Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto shadow-sm mb-12">
          
          {/* Mode Switcher */}
          <div className="flex justify-center mb-6">
            <div className="bg-slate-200/80 p-1 rounded-xl inline-flex gap-1 text-sm font-bold">
              <button
                type="button"
                onClick={() => setMode('recipient')}
                className={`px-5 py-2 rounded-lg transition-all ${
                  mode === 'recipient'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                I Need Blood (Recipient)
              </button>
              <button
                type="button"
                onClick={() => setMode('donor')}
                className={`px-5 py-2 rounded-lg transition-all ${
                  mode === 'donor'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-slate-600 hover:text-navy-900'
                }`}
              >
                I Want to Donate (Donor)
              </button>
            </div>
          </div>

          {/* Blood Group Buttons */}
          <div className="text-center mb-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Select Your Blood Group
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {BLOOD_GROUPS.map((group) => {
                const isSelected = selectedGroup === group;
                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setSelectedGroup(group)}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl font-black text-base sm:text-lg transition-all flex items-center justify-center ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#991B1B] to-[#DC2626] text-white shadow-md shadow-red-600/30 scale-105 ring-2 ring-red-400'
                        : 'bg-white text-slate-700 hover:bg-red-50 hover:text-red-700 border border-slate-200'
                    }`}
                  >
                    {group}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Result Card */}
          <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-sm">
            {mode === 'recipient' ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Droplet className="w-5 h-5 text-red-600 fill-red-600" />
                  <h4 className="text-base sm:text-lg font-bold text-navy-900">
                    Recipient <span className="text-red-600">{selectedGroup}</span> can safely receive blood from:
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {compatibleDonors.map((donor) => (
                    <span
                      key={donor}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      {donor}
                    </span>
                  ))}
                </div>
                {selectedGroup === 'AB+' && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 bg-purple-50 p-2.5 rounded-lg border border-purple-200">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span><strong>AB+ is the Universal Recipient:</strong> can safely receive red blood cells from all 8 blood groups!</span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Droplet className="w-5 h-5 text-red-600 fill-red-600" />
                  <h4 className="text-base sm:text-lg font-bold text-navy-900">
                    Donor <span className="text-red-600">{selectedGroup}</span> can safely donate blood to:
                  </h4>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {canDonateTo.map((recipient) => (
                    <span
                      key={recipient}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-sm"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      {recipient}
                    </span>
                  ))}
                </div>
                {selectedGroup === 'O-' && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span><strong>O- is the Universal Donor:</strong> can save anyone in emergencies when blood type is unknown!</span>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Full Matrix Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm max-w-5xl mx-auto">
          <table className="w-full text-center border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 text-navy-900 border-b border-slate-200 font-black">
                <th className="p-3 text-left bg-slate-200/80 sticky left-0 z-10">Recipient ↓ / Donor →</th>
                {BLOOD_GROUPS.map((g) => (
                  <th key={g} className="p-3 font-extrabold text-navy-900 min-w-[50px]">{g}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BLOOD_GROUPS.map((recipient, rIdx) => (
                <tr
                  key={recipient}
                  className={`border-b border-slate-100 transition-colors ${
                    rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                  } hover:bg-red-50/40`}
                >
                  <td className="p-3 text-left font-black text-navy-900 bg-inherit sticky left-0 z-10 border-r border-slate-100">
                    <span className="text-red-600">{recipient}</span>
                  </td>
                  {BLOOD_GROUPS.map((donor) => {
                    const match = canDonate(donor, recipient);
                    return (
                      <td key={donor} className="p-2 sm:p-3">
                        {match ? (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px]">
                            YES
                          </span>
                        ) : (
                          <span className="text-slate-300 font-bold">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Medical Note */}
        <div className="max-w-5xl mx-auto mt-4 text-center">
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Donors are eligible to donate whole blood once every <strong>90 days</strong> to ensure body recovery and iron regeneration.</span>
          </p>
        </div>

      </div>
    </section>
  );
}
