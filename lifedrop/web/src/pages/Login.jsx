import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Droplet, Lock, Mail, AlertCircle, Sparkles, KeyRound, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, sendOtp, verifyOtp } = useAuth();
  const { toast } = useToast();

  // Mode: "password" | "otp"
  const [activeTab, setActiveTab] = useState('password');

  // Password Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  // OTP Login State
  const [otpEmail, setOtpEmail] = useState('');
  const [otpStep, setOtpStep] = useState(1); // 1: enter email, 2: enter 6-digit code
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const otpInputRefs = useRef([]);

  // Resend Countdown Timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Focus first OTP input on transition to step 2
  useEffect(() => {
    if (activeTab === 'otp' && otpStep === 2) {
      otpInputRefs.current[0]?.focus();
    }
  }, [activeTab, otpStep]);

  const navigateAfterLogin = (data) => {
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
  };

  // Password Login Submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setPasswordError('Please provide both email and password.');
      toast.warning('Please enter your email and password.');
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);

    try {
      const data = await login({ email: email.trim(), password });
      toast.success(`Welcome back, ${data?.user?.name || 'User'}!`);
      navigateAfterLogin(data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password.';
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  // OTP: Step 1 - Send Code
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = otpEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setOtpError('Please enter a valid email address.');
      toast.warning('Please enter a valid email address.');
      return;
    }

    setOtpSending(true);
    setOtpError(null);

    try {
      await sendOtp(cleanEmail);
      toast.success('Login code sent! Please check your email.');
      setOtpStep(2);
      setCountdown(60);
      setOtpValues(['', '', '', '', '', '']);
    } catch (err) {
      if (err.response?.status === 429) {
        const msg = err.response?.data?.message || 'Please wait before requesting another code.';
        setOtpError(msg);
        toast.warning(msg);
      } else {
        const msg = err.response?.data?.message || 'Failed to send login code. Please try again.';
        setOtpError(msg);
        toast.error(msg);
      }
    } finally {
      setOtpSending(false);
    }
  };

  // OTP: Resend Code
  const handleResendOtp = async () => {
    if (countdown > 0 || otpSending) return;
    await handleSendOtp();
  };

  // OTP: Step 2 - Verify Code
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const combinedOtp = otpValues.join('');
    if (combinedOtp.length < 6) {
      setOtpError('Please enter all 6 digits of your verification code.');
      return;
    }

    setOtpVerifying(true);
    setOtpError(null);

    try {
      const data = await verifyOtp(otpEmail.trim(), combinedOtp);
      toast.success(`Welcome back, ${data?.user?.name || 'User'}!`);
      navigateAfterLogin(data);
    } catch (err) {
      if (err.response?.status === 429) {
        setOtpError('Please wait before requesting another code.');
        toast.warning('Please wait before requesting another code.');
      } else {
        const msg = err.response?.data?.message || 'Invalid or expired code';
        setOtpError(msg);
        toast.error(msg);
      }
    } finally {
      setOtpVerifying(false);
    }
  };

  // OTP Input Box Handlers
  const handleOtpBoxChange = (index, value) => {
    if (otpError) setOtpError(null);

    // If pasted multiple digits
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const next = [...otpValues];
      digits.forEach((d, i) => {
        if (i < 6) next[i] = d;
      });
      setOtpValues(next);
      const nextFocus = Math.min(5, digits.length);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    // Single character digit filter
    if (value && !/^\d$/.test(value)) return;

    const next = [...otpValues];
    next[index] = value;
    setOtpValues(next);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedText) return;
    const digits = pastedText.split('');
    const next = ['', '', '', '', '', ''];
    digits.forEach((d, i) => {
      next[i] = d;
    });
    setOtpValues(next);
    const targetIdx = Math.min(5, digits.length);
    otpInputRefs.current[targetIdx]?.focus();
  };

  const handleChangeEmail = () => {
    setOtpStep(1);
    setOtpValues(['', '', '', '', '', '']);
    setOtpError(null);
  };

  const setDemoAccount = (demoEmail) => {
    if (activeTab === 'password') {
      setEmail(demoEmail);
      setPassword('Password@123');
      setPasswordError(null);
    } else {
      setOtpEmail(demoEmail);
      setOtpError(null);
    }
  };

  return (
    <div className="py-10 sm:py-14 bg-slate-50 min-h-[calc(100vh-160px)] flex items-center justify-center">
      <div className="w-full max-w-[360px] sm:max-w-md lg:max-w-lg mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#991B1B] to-[#C62828] p-2 flex items-center justify-center text-white mx-auto shadow-md mb-3">
            <Droplet className="w-6 h-6 fill-white stroke-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
            Sign In to LifeDrop
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            Access your voluntary donor or recipient account.
          </p>
        </div>

        {/* Quick Demo Logins Helper */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/80 rounded-2xl p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-red-800 uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4 text-red-600" />
            <span>Dev Demo Accounts</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button
              type="button"
              id="demo-donor-btn"
              onClick={() => setDemoAccount('donor1@lifedrop.test')}
              className="py-1.5 px-2 bg-white rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-left transition-colors"
            >
              🧑 Donor 1 (A+)
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

        {/* Main Authentication Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
          
          {/* Tabs: Password | Email code */}
          <div className="flex rounded-2xl bg-slate-100 p-1 mb-6 border border-slate-200/70">
            <button
              type="button"
              id="tab-password-btn"
              onClick={() => {
                setActiveTab('password');
                setPasswordError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'password'
                  ? 'bg-white text-navy-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Password</span>
            </button>

            <button
              type="button"
              id="tab-otp-btn"
              onClick={() => {
                setActiveTab('otp');
                setOtpError(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'otp'
                  ? 'bg-white text-navy-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Email code</span>
            </button>
          </div>

          {/* TAB 1: Password Login */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} noValidate className="space-y-5">
              {passwordError && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

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
                disabled={passwordLoading}
                className="w-full bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-extrabold py-3.5 px-6 rounded-xl shadow-md shadow-red-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{passwordLoading ? 'Authenticating...' : 'Sign In'}</span>
              </button>
            </form>
          )}

          {/* TAB 2: Email OTP Login */}
          {activeTab === 'otp' && (
            <div>
              {otpError && (
                <div className="p-3.5 mb-5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              {/* STEP 1: Enter Email */}
              {otpStep === 1 && (
                <form onSubmit={handleSendOtp} noValidate className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        id="otp-email-input"
                        required
                        value={otpEmail}
                        onChange={(e) => setOtpEmail(e.target.value)}
                        placeholder="e.g. donor1@lifedrop.test"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-10 text-sm font-semibold text-navy-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    </div>
                    <p className="text-slate-500 text-xs mt-1.5">
                      We will email you a 6-digit login code. No password needed.
                    </p>
                  </div>

                  <button
                    type="submit"
                    id="otp-send-btn"
                    disabled={otpSending}
                    className="w-full bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-extrabold py-3.5 px-6 rounded-xl shadow-md shadow-red-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>{otpSending ? 'Sending Code...' : 'Send Code'}</span>
                  </button>
                </form>
              )}

              {/* STEP 2: Enter 6-digit Code */}
              {otpStep === 2 && (
                <form onSubmit={handleVerifyOtp} noValidate className="space-y-6">
                  <div className="text-center">
                    <p className="text-xs sm:text-sm text-slate-700">
                      We sent a 6-digit code to{' '}
                      <span className="font-extrabold text-navy-950">{otpEmail}</span>
                    </p>
                    <button
                      type="button"
                      onClick={handleChangeEmail}
                      className="text-xs text-red-700 font-bold hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Change email
                    </button>
                  </div>

                  {/* 6-box OTP Input */}
                  <div className="flex justify-center items-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                    {otpValues.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpInputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpBoxChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-extrabold text-navy-950 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#991B1B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100 transition-all"
                        aria-label={`Digit ${index + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    id="otp-verify-btn"
                    disabled={otpVerifying || otpValues.join('').length < 6}
                    className="w-full bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-extrabold py-3.5 px-6 rounded-xl shadow-md shadow-red-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>{otpVerifying ? 'Verifying Code...' : 'Verify and Sign In'}</span>
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      id="otp-resend-btn"
                      onClick={handleResendOtp}
                      disabled={countdown > 0 || otpSending}
                      className="text-xs font-bold text-slate-600 hover:text-red-700 disabled:opacity-50 disabled:hover:text-slate-600 inline-flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${otpSending ? 'animate-spin' : ''}`} />
                      <span>
                        {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <p className="text-center text-xs text-slate-500 pt-5 border-t border-slate-100 mt-5">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-primary-700 font-bold hover:underline">
              Register as Donor or Recipient
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
