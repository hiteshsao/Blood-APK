/**
 * LifeDrop Blood Compatibility Utility
 * Strictly mirrors medical ABO/Rh blood compatibility rules
 */

export const BLOOD_COMPATIBILITY = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

export const RECIPIENT_CAN_RECEIVE_FROM = {
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'A-': ['O-', 'A-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'B-': ['O-', 'B-'],
  'O+': ['O-', 'O+'],
  'O-': ['O-'],
};

/**
 * Check if donor can donate to recipient
 * @param {string} donorGroup
 * @param {string} recipientGroup
 * @returns {boolean}
 */
export function canDonate(donorGroup, recipientGroup) {
  if (!donorGroup || !recipientGroup) return false;
  const compatibleRecipients = BLOOD_COMPATIBILITY[donorGroup] || [];
  return compatibleRecipients.includes(recipientGroup);
}

export default {
  BLOOD_COMPATIBILITY,
  RECIPIENT_CAN_RECEIVE_FROM,
  canDonate,
};
