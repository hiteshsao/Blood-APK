/**
 * City Help 24x7 uses ONE unified account (role USER). Anyone can request blood;
 * a user is a donor only after enabling a donor profile (donorEnabled).
 * Legacy DONOR / RECIPIENT accounts are still honoured.
 * Mirrors mobile/src/utils/userRoles.js.
 */
export const isDonorUser = (user) =>
  !!user && (user.donorEnabled === true || user.role === 'DONOR');

export const canRequestBlood = (user) =>
  !!user && ['USER', 'RECIPIENT', 'DONOR'].includes(user.role);

export const isAdminUser = (user) => !!user && user.role === 'ADMIN';

/** Best landing dashboard for a signed-in user. */
export const homePathFor = (user) => {
  if (isDonorUser(user)) return '/donor/dashboard';
  if (canRequestBlood(user)) return '/recipient/dashboard';
  return '/';
};
