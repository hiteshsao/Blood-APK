import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { spacing, radii } from '../theme/spacing';

export const ScreenHeader = ({
  title,
  subtitle,
  onBack,
  showBack = false,
  rightComponent,
  containerStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.topRow}>
        {showBack && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.navyDark} />
          </TouchableOpacity>
        )}

        <View style={styles.titleWrapper}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightComponent ? (
          <View style={styles.rightWrapper}>{rightComponent}</View>
        ) : (
          showBack ? <View style={styles.placeholder} /> : null
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: 'transparent',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radii.button,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderPink,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  titleWrapper: {
    flex: 1,
  },
  title: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 22,
    color: colors.navyDark,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  rightWrapper: {
    marginLeft: spacing.md,
  },
  placeholder: {
    width: 40,
  },
});

export default ScreenHeader;
