import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import axiosInstance from '../api/axiosInstance';
import SosModal from '../components/SosModal';

const SosContext = createContext(null);

export function SosProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSos, setActiveSos] = useState(null);
  const [loadingActive, setLoadingActive] = useState(false);

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check for active SOS when user is a logged-in RECIPIENT
  const checkActiveSos = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'RECIPIENT') {
      setActiveSos(null);
      return null;
    }
    setLoadingActive(true);
    try {
      const res = await axiosInstance.get('/api/recipient/sos/active');
      const active = res.data?.data || null;
      setActiveSos(active);
      return active;
    } catch {
      setActiveSos(null);
      return null;
    } finally {
      setLoadingActive(false);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'RECIPIENT') {
      checkActiveSos();
    } else {
      setActiveSos(null);
    }
  }, [isAuthenticated, user?.role, checkActiveSos]);

  const openSos = useCallback(async () => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }

    if (user?.role !== 'RECIPIENT') {
      toast.warning('Emergency SOS requests can only be initiated by Recipient accounts.');
      return;
    }

    // Refresh active SOS state before opening
    await checkActiveSos();
    setIsOpen(true);
  }, [isAuthenticated, user?.role, navigate, toast, checkActiveSos]);

  const closeSos = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSosCreated = useCallback((sosResult) => {
    setActiveSos({
      id: sosResult.requestId,
      status: sosResult.status || 'PENDING',
      matchedDonorCount: sosResult.donorsNotified,
      radiusKm: sosResult.radiusKm,
    });
    setIsOpen(true);
  }, []);

  const handleSosCancelled = useCallback(() => {
    setActiveSos(null);
    checkActiveSos();
  }, [checkActiveSos]);

  return (
    <SosContext.Provider
      value={{
        isOpen,
        activeSos,
        loadingActive,
        openSos,
        closeSos,
        checkActiveSos,
        setActiveSos,
      }}
    >
      {children}
      <SosModal
        isOpen={isOpen}
        onClose={closeSos}
        activeSos={activeSos}
        onSosCreated={handleSosCreated}
        onSosCancelled={handleSosCancelled}
        user={user}
      />
    </SosContext.Provider>
  );
}

export function useSos() {
  const context = useContext(SosContext);
  if (!context) {
    throw new Error('useSos must be used within an SosProvider');
  }
  return context;
}

export default SosContext;
