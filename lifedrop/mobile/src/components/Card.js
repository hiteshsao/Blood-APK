import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { radii, spacing } from '../theme/spacing';
import { shadows } from '../theme/shadows';

export const Card = ({
  children,
  style,
  onPress,
  variant = 'default',
  ...props
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'pink':
        return styles.pinkCard;
      case 'highlight':
        return styles.highlightCard;
      case 'bordered':
        return styles.borderedCard;
      default:
        return styles.defaultCard;
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        style={[styles.cardBase, shadows.cardSoft, getVariantStyle(), style]}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.cardBase, shadows.cardSoft, getVariantStyle(), style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  cardBase: {
    borderRadius: radii.card, // 20px from Design System
    padding: spacing.lg,
    marginVertical: spacing.xs + 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  defaultCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F1F5F9',
  },
  pinkCard: {
    backgroundColor: colors.pageBg,
    borderColor: colors.borderPink,
  },
  highlightCard: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.borderPink,
    borderWidth: 1.5,
  },
  borderedCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
});

export default Card;
