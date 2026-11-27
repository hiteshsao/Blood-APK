/**
 * Registry of EXTRA Home sections added by later phases.
 * Each entry: { id, featureKey, order, Component }
 *  - featureKey: key of the flag in /api/app/config (e.g. 'services')
 *  - order: lower renders first
 *  - Component: receives { navigation }
 *
 * Phase 1 has none. Phase 2 (Service Providers) adds its entry in src/modules/services/registerHome.js,
 * later phases do the same. HomeScreen only renders sections whose feature flag is ON.
 */
const sections = [];

export const registerHomeSection = (section) => {
  if (!sections.some((s) => s.id === section.id)) {
    sections.push(section);
  }
};

export const getActiveHomeSections = (features) =>
  sections
    .filter((s) => features && features[s.featureKey])
    .sort((a, b) => a.order - b.order);

export default sections;
