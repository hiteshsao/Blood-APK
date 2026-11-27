import { Zap, Wrench, Hammer, Home, Snowflake, Paintbrush, Car, Bug, Smartphone } from 'lucide-react';

/**
 * Display list of service categories (same names the backend seeds).
 * Used for the Home grid and as the Services page fallback when the visitor is not signed in.
 */
export const SERVICE_CATEGORIES = [
  { name: 'Electrician', icon: Zap, hint: 'Wiring, fans, switchboards' },
  { name: 'Plumber', icon: Wrench, hint: 'Leaks, taps, tanks' },
  { name: 'Carpenter', icon: Hammer, hint: 'Furniture, doors, fittings' },
  { name: 'Housekeeping', icon: Home, hint: 'Home and kitchen cleaning' },
  { name: 'AC Repair', icon: Snowflake, hint: 'Service, gas refill, install' },
  { name: 'Painter', icon: Paintbrush, hint: 'Interior and exterior' },
  { name: 'Car Wash', icon: Car, hint: 'At your doorstep' },
  { name: 'Pest Control', icon: Bug, hint: 'Safe home treatment' },
  { name: 'Mobile Repair', icon: Smartphone, hint: 'Screen, battery, more' },
];

export const iconFor = (name) => SERVICE_CATEGORIES.find((c) => c.name === name)?.icon || Wrench;

export const formatPrice = (p) => {
  if (p?.priceFrom == null) return 'Price on request';
  const unit = { VISIT: 'visit', HOUR: 'hour', DAY: 'day', FIXED: 'job' }[p.priceUnit];
  return `From ₹${Number(p.priceFrom)}${unit ? ` / ${unit}` : ''}`;
};
