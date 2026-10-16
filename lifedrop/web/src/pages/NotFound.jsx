import React from 'react';
import { Link } from 'react-router-dom';
import { Droplet, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="py-20 bg-slate-50 min-h-[calc(100vh-160px)] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4 text-center">
        
        <div className="w-16 h-16 rounded-3xl bg-red-100 flex items-center justify-center text-red-700 mx-auto mb-4 shadow-sm">
          <Droplet className="w-8 h-8 fill-red-600 stroke-red-600 animate-pulse" />
        </div>

        <h1 className="text-6xl font-black text-navy-900 tracking-tight">404</h1>
        <h2 className="text-xl font-bold text-slate-800 mt-2">Page Not Found</h2>
        <p className="text-slate-500 text-sm mt-2 mb-8">
          The page or emergency resource you are looking for has moved or does not exist.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold px-6 py-3 rounded-xl shadow-sm text-sm flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
          <Link
            to="/requests"
            className="w-full sm:w-auto bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-6 py-3 rounded-xl shadow-sm text-sm flex items-center justify-center gap-2 transition-all"
          >
            <span>View Active Requests</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
