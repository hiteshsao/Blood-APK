/**
 * Bottom tab layout per feature set. Phase 1 (blood only):
 *   Home, Requests, SOS (centre), Donors, Profile
 * Phase 2 (services ON):
 *   Home, Services, SOS (centre), Bookings, Profile
 * Later phases return their own list here. The SOS tab is a centre button that opens the SOS sheet.
 */
const TAB = {
  home: { name: 'Home', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  requests: { name: 'Requests', label: 'Requests', icon: 'list-outline', iconActive: 'list' },
  donors: { name: 'Donors', label: 'Donors', icon: 'people-outline', iconActive: 'people' },
  services: { name: 'Services', label: 'Services', icon: 'construct-outline', iconActive: 'construct' },
  bookings: { name: 'Bookings', label: 'Bookings', icon: 'calendar-outline', iconActive: 'calendar' },
  profile: { name: 'Profile', label: 'Profile', icon: 'person-outline', iconActive: 'person' },
  sos: { name: 'SOS', label: 'SOS', isSos: true },
};

export const getTabs = (features = {}) => {
  if (features.services) {
    return [TAB.home, TAB.services, TAB.sos, TAB.bookings, TAB.profile];
  }
  return [TAB.home, TAB.requests, TAB.sos, TAB.donors, TAB.profile];
};

export default getTabs;
