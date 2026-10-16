import React from 'react';
import { ShieldCheck, Lock, EyeOff, MapPin, Database, Heart } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="py-12 bg-slate-50 min-h-[calc(100vh-160px)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#991B1B] to-[#C62828] p-2 flex items-center justify-center text-white mx-auto shadow-md mb-3">
            <ShieldCheck className="w-6 h-6 fill-white stroke-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            How LifeDrop shields donor and recipient confidentiality in our peer-to-peer network.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200 space-y-8 text-slate-700 text-sm leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-600" />
              <span>1. Zero Intermediaries & Direct Peer Privacy</span>
            </h2>
            <p>
              LifeDrop is built to eliminate bureaucratic intermediaries. There are no administrative blood banks or commercial brokers accessing your personal records. All connections are strictly peer-to-peer between registered voluntary donors and recipients in immediate need.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-red-600" />
              <span>2. Strict Contact Number Shielding</span>
            </h2>
            <p>
              To protect voluntary donors from spam or unwanted calls:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Donor phone numbers are <strong>never</strong> displayed on the public map or donor search results.</li>
              <li>A donor's phone number is revealed to the recipient <strong>only after</strong> the donor explicitly taps "Accept Request".</li>
              <li>Recipients never see donor contact details before the donor agrees to assist.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-600" />
              <span>3. Geospatial Matching & Privacy</span>
            </h2>
            <p>
              LifeDrop uses device coordinates strictly to compute approximate distance (via Haversine formula) within defined radiuses (typically 10 to 15 km). Exact home addresses are never stored or broadcast. Only general locality/city and computed distance are shared.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-red-600" />
              <span>4. Data Security & Storage</span>
            </h2>
            <p>
              All passwords are cryptographic hashes stored with BCrypt and salted; plain-text passwords are never recorded or logged. Authentication tokens are digitally signed JSON Web Tokens (JWT) using HMAC-SHA256.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
