/**
 * LifeDrop Shared Shadow Helpers
 * Includes the signature red soft glow and elevation presets for iOS & Android
 */

export const shadows = {
  // Signature red soft glow for Primary & Action buttons
  redGlow: {
    shadowColor: '#B91C1C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 18,
    elevation: 8,
  },

  // Intense Red Glow for Emergency SOS
  sosGlow: {
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 10,
  },

  // Soft modern card elevation
  cardSoft: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },

  // Subtle floating tab bar shadow
  tabBar: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10,
  },

  // Chip / pill shadow
  chip: {
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
};

/**
 * Custom shadow generator helper
 */
export function createGlow(color = '#B91C1C', opacity = 0.3, radius = 16, elevation = 6) {
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: Math.round(radius / 2) },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
}

export default shadows;
