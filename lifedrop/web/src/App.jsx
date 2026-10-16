import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import TopAlertBar from './components/TopAlertBar';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import FindDonors from './pages/FindDonors';
import BloodRequests from './pages/BloodRequests';
import EmergencySos from './pages/EmergencySos';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import DonorDashboard from './pages/DonorDashboard';
import RecipientDashboard from './pages/RecipientDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="flex flex-col min-h-screen bg-white text-slate-900 antialiased">
            <TopAlertBar />
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/requests" element={<BloodRequests />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/emergency-sos" element={<EmergencySos />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<Terms />} />

                {/* Donor Role Protected Routes */}
                <Route
                  path="/donor/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['DONOR']}>
                      <DonorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="/donor" element={<Navigate to="/donor/dashboard" replace />} />

                {/* Recipient Role Protected Routes */}
                <Route
                  path="/recipient/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['RECIPIENT']}>
                      <RecipientDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="/recipient" element={<Navigate to="/recipient/dashboard" replace />} />
                <Route
                  path="/find-donors"
                  element={
                    <ProtectedRoute allowedRoles={['RECIPIENT']}>
                      <FindDonors />
                    </ProtectedRoute>
                  }
                />

                {/* Authenticated User Profile */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                {/* 404 Not Found Catch-All */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
