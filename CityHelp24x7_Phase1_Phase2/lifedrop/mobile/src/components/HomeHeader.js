import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NotificationBell from './NotificationBell';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { spacing } from '../theme/spacing';

/**
 * Home top bar: optional menu icon, city selector ("Raipur, Chhattisgarh v") and the notification bell.
 */
export const HomeHeader = ({ cityLabel, onCityPress, onMenuPress, style }) => {
  return (
    <View style={[styles.container, style]}>
      {onMenuPress ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onMenuPress}
          style={styles.menuButton}
          accessibilityLabel="Open menu"
        >
          <Ionicons name="menu" size={26} color={colors.navyDark} />
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onCityPress}
        style={styles.cityButton}
        accessibilityLabel="Change city"
      >
        <Ionicons name="location-sharp" size={18} color={colors.brand.main} />
        <Text style={styles.cityText} numberOfLines={1}>
          {cityLabel || 'Select your city'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.muted} />
      </TouchableOpacity>

      <NotificationBell />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  menuButton: {
    marginRight: spacing.md,
  },
  cityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityText: {
    fontFamily: fontFamilies.bold,
    fontSize: 15,
    color: colors.navyDark,
    marginLeft: 4,
    marginRight: 4,
    flexShrink: 1,
  },
});

export default HomeHeader;
