import React from 'react';
import { FileText, Heart, AlertTriangle, ShieldCheck, CheckCircle } from 'lucide-react';

export default function Terms() {
  return (
    <div className="py-12 bg-slate-50 min-h-[calc(100vh-160px)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#991B1B] to-[#C62828] p-2 flex items-center justify-center text-white mx-auto shadow-md mb-3">
            <FileText className="w-6 h-6 fill-white stroke-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Rules and principles governing voluntary participation on the LifeDrop network.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200 space-y-8 text-slate-700 text-sm leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-600" />
              <span>1. 100% Voluntary & Non-Commercial</span>
            </h2>
            <p>
              Blood donation through LifeDrop is purely altruistic and voluntary. Selling blood, requesting monetary compensation, or offering financial rewards is strictly prohibited and violates national health regulations. Accounts engaged in commercial blood transactions will be permanently terminated.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>2. Emergency Nature & Hospital Verification</span>
            </h2>
            <p>
              LifeDrop connects willing voluntary donors to emergency recipients in critical situations. All transfusions and medical procedures must be performed by certified clinical professionals in licensed hospital facilities. LifeDrop does not administer medical treatments or test blood units directly.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-red-600" />
              <span>3. Anti-Spam & Community Safety</span>
            </h2>
            <p>
              Recipients are limited to 3 blood requests every 24 hours to prevent spam. Any user who identifies fraudulent requests can report them. Requests receiving 3 reports are automatically cancelled to maintain platform integrity.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
