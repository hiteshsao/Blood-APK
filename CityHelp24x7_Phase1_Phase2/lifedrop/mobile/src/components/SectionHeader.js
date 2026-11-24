import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { spacing } from '../theme/spacing';

/**
 * Small uppercase section title with an optional "View All" action.
 */
export const SectionHeader = ({ title, actionLabel = 'View All', onActionPress, color, style }) => {
  return (
    <View style={[styles.row, style]}>
      <Text style={[styles.title, color ? { color } : null]}>{title}</Text>
      {onActionPress ? (
        <TouchableOpacity activeOpacity={0.7} onPress={onActionPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 12.5,
    letterSpacing: 0.6,
    color: colors.navyDark,
    textTransform: 'uppercase',
  },
  action: {
    fontFamily: fontFamilies.bold,
    fontSize: 12.5,
    color: colors.info,
  },
});

export default SectionHeader;
