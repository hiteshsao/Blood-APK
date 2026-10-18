import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { spacing, radii } from '../theme/spacing';
import CustomButton from './CustomButton';

export const EmptyState = ({
  iconName = 'heart-dislike-outline',
  title = 'No Records Found',
  description = 'There are no active items to show at the moment.',
  actionTitle,
  onAction,
  containerStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.iconCircle}>
        <Ionicons name={iconName} size={36} color={colors.primaryRed} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {actionTitle && onAction && (
        <CustomButton
          title={actionTitle}
          onPress={onAction}
          variant="secondary"
          style={styles.actionButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.borderPink,
    marginVertical: spacing.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.pageBg,
    borderWidth: 1.5,
    borderColor: colors.borderPink,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 18,
    color: colors.navyDark,
    textAlign: 'center',
    marginBottom: spacing.xs + 2,
    letterSpacing: -0.3,
  },
  description: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  actionButton: {
    marginTop: spacing.lg,
    minWidth: 160,
    height: 46,
  },
});

export default EmptyState;
