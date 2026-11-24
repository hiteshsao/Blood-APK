/**
 * MyCityZone uses ONE unified account. Anyone can request blood; a user is a donor
 * only after enabling a donor profile (donorEnabled). Legacy DONOR accounts count as donors.
 */
export const isDonorUser = (user) =>
  !!user && (user.donorEnabled === true || user.role === 'DONOR');

export const isAdminUser = (user) => !!user && user.role === 'ADMIN';
