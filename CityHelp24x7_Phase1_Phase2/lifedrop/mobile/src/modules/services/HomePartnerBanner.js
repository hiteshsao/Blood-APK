import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import FadeInUp from '../../components/FadeInUp';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

/** Bottom-of-Home call to action for professionals: opens the provider hub (register / dashboard). */
export const HomePartnerBanner = ({ navigation }) => (
  <FadeInUp delay={920}>
  <LinearGradient colors={colors.gradients.partner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
    <View style={styles.row}>
      <View style={styles.icon}>
        <Ionicons name="briefcase" size={22} color="#FFFFFF" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Are you a professional?</Text>
        <Text style={styles.sub}>Join MyCityZone as a verified partner and get bookings near you.</Text>
      </View>
    </View>
    <TouchableOpacity activeOpacity={0.9} style={styles.btn} onPress={() => navigation.navigate('ProviderHub')}>
      <Text style={styles.btnText}>Become a partner</Text>
      <Ionicons name="arrow-forward" size={16} color={colors.navyDark} />
    </TouchableOpacity>
  </LinearGradient>
  </FadeInUp>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  title: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  sub: {
    fontFamily: fontFamilies.medium,
    fontSize: 12.5,
    lineHeight: 17,
    color: '#CBD5E1',
    marginTop: 2,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 11,
    marginTop: spacing.lg,
  },
  btnText: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    color: colors.navyDark,
    marginRight: 6,
  },
});

export default HomePartnerBanner;
