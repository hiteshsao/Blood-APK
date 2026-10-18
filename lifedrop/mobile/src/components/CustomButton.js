import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { radii, spacing } from '../theme/spacing';
import { shadows } from '../theme/shadows';

/**
 * CustomButton with 4 variants:
 * 1. primary: Crimson Red gradient (#991B1B -> #C62828) with red soft glow
 * 2. secondary: Soft pink (#FFF1F1) with red text and border
 * 3. sos: Urgent Red gradient (#DC2626 -> #BE123C) with intense alert glow
 * 4. outline: Transparent background with red border
 */
export const CustomButton = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  ...props
}) => {
  const isDisabled = disabled || loading;

  const renderContent = (contentColor) => (
    <View style={styles.contentRow}>
      {loading ? (
        <ActivityIndicator size="small" color={contentColor} style={styles.spinner} />
      ) : (
        <>
          {variant === 'sos' && !icon && (
            <Ionicons name="warning-outline" size={19} color="#FFFFFF" style={styles.leftIcon} />
          )}
          {variant === 'secondary' && !icon && (
            <Ionicons name="heart" size={17} color={colors.primaryRed} style={styles.leftIcon} />
          )}
          {icon && iconPosition === 'left' && (
            <View style={styles.leftIcon}>{icon}</View>
          )}

          <Text style={[styles.text, { color: contentColor }, textStyle]}>
            {title}
          </Text>

          {icon && iconPosition === 'right' && (
            <View style={styles.rightIcon}>{icon}</View>
          )}
        </>
      )}
    </View>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={isDisabled}
        style={[
          styles.buttonWrapper,
          !isDisabled && shadows.redGlow,
          isDisabled && styles.disabledWrapper,
          style,
        ]}
        {...props}
      >
        <LinearGradient
          colors={isDisabled ? ['#94A3B8', '#64748B'] : colors.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientContainer}
        >
          {renderContent('#FFFFFF')}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'sos') {
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={onPress}
        disabled={isDisabled}
        style={[
          styles.buttonWrapper,
          !isDisabled && shadows.sosGlow,
          isDisabled && styles.disabledWrapper,
          style,
        ]}
        {...props}
      >
        <LinearGradient
          colors={isDisabled ? ['#94A3B8', '#64748B'] : colors.gradients.sos}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientContainer, styles.sosContainer]}
        >
          {renderContent('#FFFFFF')}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        disabled={isDisabled}
        style={[
          styles.buttonWrapper,
          styles.secondaryContainer,
          isDisabled && styles.disabledSecondary,
          style,
        ]}
        {...props}
      >
        {renderContent(isDisabled ? colors.lightMuted : colors.primaryRed)}
      </TouchableOpacity>
    );
  }

  // Outline variant
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.buttonWrapper,
        styles.outlineContainer,
        isDisabled && styles.disabledOutline,
        style,
      ]}
      {...props}
    >
      {renderContent(isDisabled ? colors.lightMuted : colors.primaryDark)}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonWrapper: {
    borderRadius: radii.button,
    overflow: 'hidden',
    height: 52,
    marginVertical: spacing.xs,
  },
  gradientContainer: {
    flex: 1,
    borderRadius: radii.button,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  sosContainer: {
    paddingVertical: 2,
  },
  secondaryContainer: {
    backgroundColor: colors.secondaryBtnBg,
    borderColor: colors.borderPink,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderColor: colors.primaryRed,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: fontFamilies.bold,
    fontSize: 16,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  spinner: {
    paddingVertical: 2,
  },
  disabledWrapper: {
    opacity: 0.65,
    elevation: 0,
    shadowOpacity: 0,
  },
  disabledSecondary: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  disabledOutline: {
    borderColor: '#CBD5E1',
  },
});

export default CustomButton;
