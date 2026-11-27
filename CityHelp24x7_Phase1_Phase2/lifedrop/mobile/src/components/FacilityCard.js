import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { spacing, radii } from '../theme/spacing';

export const FacilityCard = ({ facility, onPress }) => {
  const isBank = facility.type === 'BLOOD_BANK';
  const call = () => facility.phone && Linking.openURL(`tel:${facility.phone}`);
  return (
    <TouchableOpacity activeOpacity={0.88} style={styles.card} onPress={onPress}>
      <View style={[styles.icon, { backgroundColor: isBank ? '#FEE2E2' : '#DBEAFE' }]}>
        <Ionicons name={isBank ? 'water' : 'medkit'} size={20} color={isBank ? colors.primaryRed : colors.info} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>{facility.name}</Text>
        <Text style={styles.addr} numberOfLines={2}>{facility.address}</Text>
        <View style={styles.meta}>
          {facility.open24x7 ? <Text style={styles.badge}>24x7</Text> : null}
          {facility.distanceKm != null ? <Text style={styles.dist}>{Number(facility.distanceKm).toFixed(1)} km</Text> : null}
          {facility.sample ? <Text style={styles.sample}>Sample</Text> : null}
        </View>
      </View>
      {facility.phone ? (
        <TouchableOpacity onPress={call} style={styles.call} hitSlop={8}>
          <Ionicons name="call" size={18} color="#FFF" />
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: radii.card, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: '#F1F5F9' },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  name: { fontFamily: fontFamilies.bold, fontSize: 14, color: colors.navyDark },
  addr: { fontFamily: fontFamilies.regular, fontSize: 12, color: colors.muted, marginTop: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  badge: { fontFamily: fontFamilies.bold, fontSize: 10.5, color: '#16A34A', backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginRight: 8, overflow: 'hidden' },
  dist: { fontFamily: fontFamilies.medium, fontSize: 11.5, color: colors.muted, marginRight: 8 },
  sample: { fontFamily: fontFamilies.medium, fontSize: 10.5, color: '#92400E', backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  call: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm },
});

export default FacilityCard;
