import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { fontFamilies } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';

export const svc = colors.modules.services;

const STATUS = {
  PENDING: { bg: '#FEF3C7', fg: '#92400E', label: 'Pending' },
  ACCEPTED: { bg: '#DBEAFE', fg: '#1D4ED8', label: 'Accepted' },
  COMPLETED: { bg: '#DCFCE7', fg: '#166534', label: 'Completed' },
  REJECTED: { bg: '#FEE2E2', fg: '#991B1B', label: 'Declined' },
  CANCELLED: { bg: '#F1F5F9', fg: '#475569', label: 'Cancelled' },
  EXPIRED: { bg: '#F1F5F9', fg: '#475569', label: 'Expired' },
  VERIFIED: { bg: '#DCFCE7', fg: '#166534', label: 'Verified' },
  REJECTED_PROFILE: { bg: '#FEE2E2', fg: '#991B1B', label: 'Not approved' },
  SUSPENDED: { bg: '#FEE2E2', fg: '#991B1B', label: 'Suspended' },
};

export const StatusPill = ({ status, label }) => {
  const s = STATUS[status] || { bg: '#F1F5F9', fg: '#475569', label: status };
  return (
    <View style={[ui.pill, { backgroundColor: s.bg }]}>
      <Text style={[ui.pillText, { color: s.fg }]}>{label || s.label}</Text>
    </View>
  );
};

export const Stars = ({ value = 0, size = 14, count }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Ionicons name="star" size={size} color="#F59E0B" />
    <Text style={[ui.starText, { fontSize: size - 1 }]}>
      {Number(value || 0).toFixed(1)}
      {count != null ? ` (${count})` : ''}
    </Text>
  </View>
);

export const formatPrice = (p) => {
  if (p?.priceFrom == null) return 'Price on request';
  const unit = { VISIT: 'visit', HOUR: 'hour', DAY: 'day', FIXED: 'job' }[p.priceUnit];
  return `From ₹${Number(p.priceFrom)}${unit ? ' / ' + unit : ''}`;
};

export const formatWhen = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export const Chip = ({ label, active, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[ui.chip, active && ui.chipOn]} activeOpacity={0.85}>
    <Text style={[ui.chipText, active && ui.chipTextOn]}>{label}</Text>
  </TouchableOpacity>
);

export const ui = StyleSheet.create({
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start' },
  pillText: { fontFamily: fontFamilies.bold, fontSize: 11 },
  starText: { fontFamily: fontFamilies.bold, color: colors.navyDark, marginLeft: 3 },
  chip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF', marginRight: 8 },
  chipOn: { backgroundColor: svc.main, borderColor: svc.main },
  chipText: { fontFamily: fontFamilies.bold, fontSize: 12, color: colors.muted },
  chipTextOn: { color: '#FFF' },
  safe: { flex: 1, backgroundColor: colors.pageBg },
  content: { padding: spacing.screenPadding, paddingBottom: spacing.xxxl },
  label: { fontFamily: fontFamilies.bold, fontSize: 13, color: colors.navyDark, marginBottom: 8, marginTop: spacing.md },
  error: { fontFamily: fontFamilies.medium, color: colors.danger, marginTop: spacing.md },
});
