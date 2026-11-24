import React from 'react';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  MapPin,
  Database,
  Trash2,
  Mail,
  HeartHandshake,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="py-12 bg-slate-50 min-h-[calc(100vh-160px)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#991B1B] to-[#C62828] p-3 flex items-center justify-center text-white mx-auto shadow-lg shadow-red-900/20 mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
            LifeDrop Privacy Policy
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-2xl mx-auto">
            Your trust is sacred. Learn how LifeDrop safeguards donor and recipient confidentiality in our emergency peer-to-peer blood donation network.
          </p>
          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-full border border-red-100">
            <span>Effective Date: October 2026</span>
            <span>•</span>
            <span>Google Play Store Compliant</span>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-200/90 space-y-10 text-slate-700 text-sm leading-relaxed">

          {/* Section 1: Overview */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-red-600 shrink-0" />
              <span>1. Zero Intermediaries & Voluntary Network</span>
            </h2>
            <p>
              LifeDrop is a voluntary peer-to-peer platform designed to connect blood donors and recipients directly during medical emergencies. We do not sell data, host advertising networks, or monetize personal health profiles.
            </p>
          </section>

          {/* Section 2: What Data is Collected */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2.5">
              <Database className="w-5 h-5 text-red-600 shrink-0" />
              <span>2. What Data We Collect</span>
            </h2>
            <p>
              To ensure medical compatibility and rapid geographic dispatch, LifeDrop collects only the minimum necessary data:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="font-bold text-navy-900 text-sm block mb-1">👤 Full Name & Account Credentials</span>
                <p className="text-xs text-slate-600">
                  Used for account authentication and displaying your confirmed identity once an emergency request is accepted.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="font-bold text-navy-900 text-sm block mb-1">📞 Phone Number (10 Digits)</span>
                <p className="text-xs text-slate-600">
                  Required to facilitate immediate phone communication between matched donors and recipients.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="font-bold text-navy-900 text-sm block mb-1">🩸 Blood Group & Eligibility</span>
                <p className="text-xs text-slate-600">
                  ABO and Rh factor (e.g., O+, A-, AB+) and optional last-donation dates to verify 90-day clinical safety periods.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="font-bold text-navy-900 text-sm block mb-1">📍 Geographic Location (GPS)</span>
                <p className="text-xs text-slate-600">
                  Latitude and longitude coordinates used exclusively to compute distance radiuses for nearby emergency SOS requests.
                </p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Push Notification Tokens:</strong> Expo / Firebase device tokens are stored securely to deliver critical SOS and donation notifications to your device.
              </span>
            </div>
          </section>

          {/* Section 3: Why Data is Collected */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2.5">
              <HeartHandshake className="w-5 h-5 text-red-600 shrink-0" />
              <span>3. Why We Collect This Data</span>
            </h2>
            <ul className="space-y-2 text-slate-600 list-none pl-1">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Emergency Matching:</strong> Finding compatible donors within a 15–50 km radius when an urgent SOS is broadcast.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Donor Health Safety:</strong> Preventing premature blood donations by enforcing a mandatory 90-day recovery gap.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Real-time Notifications:</strong> Dispatching urgent push notifications to nearby devices when lives depend on immediate blood availability.</span>
              </li>
            </ul>
          </section>

          {/* Section 4: Who Can See Your Data */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2.5">
              <EyeOff className="w-5 h-5 text-red-600 shrink-0" />
              <span>4. Who Can See Your Data (Strict Shielding)</span>
            </h2>
            <p>
              Your contact information is strictly protected by our two-way privacy barrier:
            </p>
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <p className="font-semibold text-navy-900 text-xs">Privacy Rules:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                <li><strong>Phone numbers are never publicly visible.</strong> They do not appear on search lists, maps, or public feeds.</li>
                <li><strong>Strict Acceptance Barrier:</strong> A donor's phone number is revealed to a recipient ONLY after that donor voluntarily accepts the request.</li>
                <li><strong>No Commercial Brokers:</strong> No marketing agencies, insurance firms, or hospital brokers have access to user databases.</li>
              </ul>
            </div>
          </section>

          {/* Section 5: Data Deletion on Request */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2.5">
              <Trash2 className="w-5 h-5 text-red-600 shrink-0" />
              <span>5. Account Deletion & Right to Erasure</span>
            </h2>
            <p>
              You have complete ownership over your data. In accordance with Google Play Developer Policies and global privacy regulations:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                <strong>In-App Deletion:</strong> You can delete your account at any time directly inside the mobile app or web platform via <em>Profile &rarr; Delete My Account</em>.
              </li>
              <li>
                <strong>Instant Anonymization:</strong> Upon triggering deletion, all personally identifying data (name, email, phone number, GPS coordinates, device push tokens) is immediately replaced with anonymized placeholders, and your profile is deactivated.
              </li>
              <li>
                <strong>Written Requests:</strong> You may also request total erasure of all records by contacting our Data Protection Desk at the contact email below.
              </li>
            </ul>
          </section>

          {/* Section 6: Contact Email */}
          <section className="space-y-3 pt-2 border-t border-slate-100">
            <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2.5">
              <Mail className="w-5 h-5 text-red-600 shrink-0" />
              <span>6. Contact Our Privacy Desk</span>
            </h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact:
            </p>
            <div className="p-4 rounded-2xl bg-red-50/60 border border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-navy-950 block text-sm">LifeDrop Privacy & Data Protection Desk</span>
                <span className="text-xs text-slate-600">Official Data Protection Contact</span>
              </div>
              <a
                href="mailto:privacy@lifedrop.app"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
              >
                <Mail className="w-4 h-4" />
                privacy@lifedrop.app
              </a>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
