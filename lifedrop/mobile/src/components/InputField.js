import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { radii, spacing } from '../theme/spacing';

export const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  isPassword = false,
  leftIcon,
  rightComponent,
  keyboardType = 'default',
  autoCapitalize = 'none',
  containerStyle,
  inputStyle,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!isPassword);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const isSecure = isPassword && !showPassword;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error ? styles.inputError : null,
          !editable && styles.inputDisabled,
          multiline && { minHeight: 90, alignItems: 'flex-start' },
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.lightMuted}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.textInput,
            leftIcon ? { paddingLeft: 0 } : null,
            multiline && { textAlignVertical: 'top', paddingTop: spacing.md },
            inputStyle,
          ]}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={togglePasswordVisibility}
            style={styles.eyeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather
              name={showPassword ? 'eye' : 'eye-off'}
              size={19}
              color={isFocused ? colors.primaryRed : colors.muted}
            />
          </TouchableOpacity>
        )}

        {rightComponent && !isPassword && (
          <View style={styles.rightComponent}>{rightComponent}</View>
        )}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={colors.danger} style={styles.errorIcon} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs + 2,
    width: '100%',
  },
  label: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    color: colors.navyDark,
    marginBottom: spacing.xs + 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: radii.input,
    paddingHorizontal: spacing.md,
    minHeight: 50,
  },
  inputFocused: {
    borderColor: colors.primaryRed,
    backgroundColor: '#FFFDFD',
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: '#FFF9F9',
  },
  inputDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  textInput: {
    flex: 1,
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: spacing.sm + 2,
  },
  leftIconContainer: {
    marginRight: spacing.sm,
  },
  eyeButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  rightComponent: {
    marginLeft: spacing.xs,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: 2,
  },
  errorIcon: {
    marginRight: 4,
  },
  errorText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.danger,
  },
});

export default InputField;
