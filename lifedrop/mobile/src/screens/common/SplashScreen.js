import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { radii, spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

export const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.centerBox}>
        {/* Rounded-square dark red gradient logo with blood-drop */}
        <View style={[styles.logoWrapper, shadows.redGlow]}>
          <LinearGradient
            colors={colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            <Ionicons name="water" size={48} color="#FFFFFF" />
          </LinearGradient>
        </View>

        {/* Brand Name: "Life" in navy + "Drop" in red */}
        <View style={styles.brandRow}>
          <Text style={styles.brandLife}>Life</Text>
          <Text style={styles.brandDrop}>Drop</Text>
        </View>

        {/* Tagline */}
        <Text style={styles.tagline}>BLOOD DONATION NETWORK</Text>
        <Text style={styles.subTagline}>Direct Peer-to-Peer Life Saving</Text>
      </View>

      <View style={styles.bottomBox}>
        <ActivityIndicator size="small" color={colors.primaryRed} />
        <Text style={styles.footerNote}>Zero Intermediaries • 100% Direct</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pageBg, // Light pink page background
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 1.5,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    marginBottom: spacing.xl,
    borderRadius: 24,
  },
  logoGradient: {
    width: 96,
    height: 96,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  brandLife: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 40,
    color: colors.navyDark,
    letterSpacing: -1,
  },
  brandDrop: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 40,
    color: colors.primaryRed,
    letterSpacing: -1,
  },
  tagline: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    letterSpacing: 3.5,
    color: colors.muted,
    marginTop: spacing.xs,
    textTransform: 'uppercase',
  },
  subTagline: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    color: colors.lightMuted,
    marginTop: spacing.xs + 2,
  },
  bottomBox: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerNote: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    color: colors.muted,
    letterSpacing: 0.2,
  },
});

export default SplashScreen;
