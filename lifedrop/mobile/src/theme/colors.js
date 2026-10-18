/**
 * LifeDrop Design System - Color Palette
 * Direct peer-to-peer blood donation network
 */

export const colors = {
  // Primary & Crimson Red Brand Accents
  primaryDark: '#991B1B',
  primary: '#B91C1C',
  primaryRed: '#DC2626',
  accent: '#DC2626',
  accentRed: '#EF4444',
  accentSos: '#DC2626',
  sosGradientEnd: '#BE123C',
  materialRed: '#C62828',

  // Soft Pinks & Medical Clean Backgrounds
  pageBg: '#FFF5F5',
  softPink: '#FEE2E2',
  pinkPill: '#FEE2E2',
  borderPink: '#FECACA',
  secondaryBtnBg: '#FFF1F1',

  // Typography & Neutrals
  ink: '#0F172A',
  navyDark: '#0F172A',
  navySlate: '#1E293B',
  muted: '#475569',
  lightMuted: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  white: '#FFFFFF',

  // Status & Urgency Badges
  status: {
    pending: {
      text: '#D97706',
      bg: '#FEF3C7',
      border: '#FDE68A',
    },
    accepted: {
      text: '#16A34A',
      bg: '#DCFCE7',
      border: '#BBF7D0',
    },
    completed: {
      text: '#475569',
      bg: '#F1F5F9',
      border: '#CBD5E1',
    },
    cancelled: {
      text: '#9CA3AF',
      bg: '#F3F4F6',
      border: '#E5E7EB',
    },
    urgent: {
      text: '#DC2626',
      bg: '#FEE2E2',
      border: '#FECACA',
    },
  },

  // Functional Semantic Tokens
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
  info: '#2563EB',

  // Gradients (Linear Gradient tuples)
  gradients: {
    primary: ['#991B1B', '#C62828'],
    sos: ['#DC2626', '#BE123C'],
    heroText: ['#991B1B', '#DC2626', '#EF4444'],
    cardSoft: ['#FFFFFF', '#FFF5F5'],
    pinkPill: ['#FFF5F5', '#FEE2E2'],
  },
};

export default colors;
