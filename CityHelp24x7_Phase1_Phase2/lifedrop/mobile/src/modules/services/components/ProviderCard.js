import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { fontFamilies } from '../../../theme/typography';
import { spacing, radii } from '../../../theme/spacing';
import { Stars, formatPrice, svc } from './ui';

export const ProviderCard = ({ provider, onPress }) => (
  <TouchableOpacity activeOpacity={0.88} style={styles.card} onPress={onPress}>
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{(provider.displayName || '?').replace(/^Sample\s+/i, '').charAt(0).toUpperCase()}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <View style={styles.nameRow}>
        <Text style={styles.name} numberOfLines={1}>{provider.displayName}</Text>
        <Ionicons name="checkmark-circle" size={15} color="#16A34A" style={{ marginLeft: 4 }} />
      </View>
      <Text style={styles.cat}>{provider.categoryName}{provider.experienceYears != null ? `  •  ${provider.experienceYears} yrs` : ''}</Text>
      <View style={styles.meta}>
        {provider.ratingCount > 0 ? <Stars value={provider.ratingAvg} count={provider.ratingCount} /> : <Text style={styles.newText}>New</Text>}
        {provider.distanceKm != null ? <Text style={styles.dist}>{provider.distanceKm} km</Text> : null}
        {!provider.available ? <Text style={styles.busy}>Busy</Text> : null}
      </View>
      <Text style={styles.price}>{formatPrice(provider)}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={colors.lightMuted} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: radii.card, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: '#F1F5F9' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: svc.tint, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  avatarText: { fontFamily: fontFamilies.extraBold, fontSize: 18, color: svc.main },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontFamily: fontFamilies.bold, fontSize: 14.5, color: colors.navyDark, flexShrink: 1 },
  cat: { fontFamily: fontFamilies.regular, fontSize: 12, color: colors.muted, marginTop: 1 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  newText: { fontFamily: fontFamilies.bold, fontSize: 11, color: svc.main, backgroundColor: svc.tint, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, overflow: 'hidden' },
  dist: { fontFamily: fontFamilies.medium, fontSize: 11.5, color: colors.muted, marginLeft: 10 },
  busy: { fontFamily: fontFamilies.bold, fontSize: 10.5, color: '#92400E', backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, marginLeft: 8, overflow: 'hidden' },
  price: { fontFamily: fontFamilies.medium, fontSize: 12, color: colors.navyDark, marginTop: 4 },
});

export default ProviderCard;
