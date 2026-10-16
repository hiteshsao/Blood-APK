import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Droplet, Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      toast.warning('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await login({ email: email.trim(), password });
      toast.success(`Welcome back, ${data?.user?.name || 'User'}!`);
      
      const destination = location.state?.from?.pathname;
      if (destination) {
        navigate(destination);
      } else if (data?.user?.role === 'DONOR') {
        navigate('/donor/dashboard');
      } else if (data?.user?.role === 'RECIPIENT') {
        navigate('/recipient/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password@123');
  };

  return (
    <div className="py-12 bg-slate-50 min-h-[calc(100vh-160px)] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4 sm:px-6">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#991B1B] to-[#C62828] p-2 flex items-center justify-center text-white mx-auto shadow-md mb-3">
            <Droplet className="w-6 h-6 fill-white stroke-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
            Sign In to LifeDrop
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Access your voluntary donor or recipient account.
          </p>
        </div>

        {/* Quick Demo Logins Helper */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/80 rounded-2xl p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-red-800 uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4 text-red-600" />
            <span>Dev Demo Logins (Password: Password@123)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button
              type="button"
              id="demo-donor-btn"
              onClick={() => setDemoAccount('donor1@lifedrop.test')}
              className="py-1.5 px-2 bg-white rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-left transition-colors"
            >
              🧑 Donor 1 (A+, Indore)
            </button>
            <button
              type="button"
              id="demo-recipient-btn"
              onClick={() => setDemoAccount('recipient1@lifedrop.test')}
              className="py-1.5 px-2 bg-white rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-left transition-colors"
            >
              🏥 Recipient 1 (Indore)
            </button>
            <button
              type="button"
              onClick={() => setDemoAccount('donor2@lifedrop.test')}
              className="py-1.5 px-2 bg-white rounded-lg border border-red-200 text-slate-700 hover:bg-red-50 text-left transition-colors"
            >
              🧑 Donor 2 (A+)
            </button>
            <button
              type="button"
              onClick={() => setDemoAccount('recipient2@lifedrop.test')}
              className="py-1.5 px-2 bg-white rounded-lg border border-red-200 text-slate-700 hover:bg-red-50 text-left transition-colors"
            >
              🏥 Recipient 2 (O+)
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-6 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="login-email-input"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="donor1@lifedrop.test"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-10 text-sm font-semibold text-navy-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="login-password-input"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-10 text-sm font-semibold text-navy-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              disabled={loading}
              className="w-full bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-extrabold py-3.5 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>

            <p className="text-center text-xs text-slate-500 pt-2">
              Don't have an account yet?{' '}
              <Link to="/register" className="text-primary-700 font-bold hover:underline">
                Register as Donor or Recipient
              </Link>
            </p>
          </form>
        </div>

      </div>
    </div>
  );
}
