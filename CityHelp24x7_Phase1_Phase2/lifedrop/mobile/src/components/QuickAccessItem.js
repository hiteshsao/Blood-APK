import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';

/**
 * Round tinted icon with a label underneath (Quick Access / category grids).
 * iconSet: 'ion' (Ionicons, default) or 'mci' (MaterialCommunityIcons).
 */
export const QuickAccessItem = ({
  icon,
  iconSet = 'ion',
  label,
  onPress,
  color = colors.modules.blood.main,
  tint = colors.modules.blood.tint,
  style,
}) => {
  const IconComponent = iconSet === 'mci' ? MaterialCommunityIcons : Ionicons;
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.item, style]} accessibilityLabel={label}>
      <View style={[styles.circle, { backgroundColor: tint }]}>
        <IconComponent name={icon} size={24} color={color} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  item: {
    alignItems: 'center',
    width: 74,
  },
  circle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 11.5,
    lineHeight: 14,
    textAlign: 'center',
    color: colors.navySlate,
  },
});

export default QuickAccessItem;
