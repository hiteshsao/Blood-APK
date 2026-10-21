import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, TextInput, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { radii, spacing } from '../theme/spacing';

/**
 * Reusable 6-box OTP input component.
 * Features:
 * - 6 individual digit cells with focused red border state
 * - Automatic next-box advance on typing
 * - Backspace jumps to previous box
 * - Paste and SMS auto-fill (textContentType="oneTimeCode", autoComplete="one-time-code")
 * - Numeric keyboard only
 */
export const OtpInput = ({
  code = '',
  onChangeCode,
  length = 6,
  disabled = false,
  autoFocus = true,
  style,
}) => {
  const inputRefs = useRef([]);

  // Ensure digits array matches length
  const digits = Array.from({ length }, (_, i) => code[i] || '');

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const handleDigitChange = (text, index) => {
    if (disabled) return;

    // Handle paste or auto-fill of multiple digits (e.g. "123456")
    if (text.length > 1) {
      const sanitized = text.replace(/\D/g, '').slice(0, length);
      onChangeCode?.(sanitized);
      const nextFocus = Math.min(sanitized.length, length - 1);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    // Filter non-digits
    const cleanChar = text.replace(/\D/g, '');

    // Form new code string
    const newDigits = [...digits];
    newDigits[index] = cleanChar;
    const newCode = newDigits.join('');

    onChangeCode?.(newCode);

    // Auto-advance to next box if char entered
    if (cleanChar && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (disabled) return;

    if (e.nativeEvent.key === 'Backspace') {
      // If current box is empty, jump to previous and clear it
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChangeCode?.(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <View style={[styles.container, style]}>
      {digits.map((digit, index) => {
        const isFilled = !!digit;
        return (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            value={digit}
            onChangeText={(text) => handleDigitChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={index === 0 ? length : 1}
            selectTextOnFocus
            editable={!disabled}
            textContentType="oneTimeCode"
            autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
            style={[
              styles.box,
              isFilled && styles.boxFilled,
              disabled && styles.boxDisabled,
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  box: {
    width: 44,
    height: 52,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: radii.md,
    backgroundColor: '#F8FAFC',
    textAlign: 'center',
    fontSize: 22,
    fontFamily: fontFamilies.extraBold,
    color: colors.navyDark,
  },
  boxFilled: {
    borderColor: colors.primaryRed,
    backgroundColor: '#FFFFFF',
  },
  boxDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    opacity: 0.7,
  },
});

export default OtpInput;
