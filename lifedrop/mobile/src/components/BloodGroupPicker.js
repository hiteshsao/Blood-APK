import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { radii, spacing } from '../theme/spacing';
import { shadows } from '../theme/shadows';

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const BloodGroupPicker = ({
  label = 'Select Blood Group',
  value,
  onChange,
  error,
  containerStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={styles.grid}>
        {BLOOD_GROUPS.map((group) => {
          const isSelected = value === group;

          return (
            <TouchableOpacity
              key={group}
              activeOpacity={0.75}
              onPress={() => onChange && onChange(group)}
              style={[
                styles.chip,
                isSelected ? styles.chipSelected : styles.chipUnselected,
                isSelected && shadows.chip,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                ]}
              >
                {group}
              </Text>
            </TouchableOpacity>
          );
        })}
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
    marginVertical: spacing.sm,
    width: '100%',
  },
  label: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    color: colors.navyDark,
    marginBottom: spacing.xs + 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  chip: {
    width: '23%',
    height: 44,
    borderRadius: radii.button,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
  },
  chipSelected: {
    backgroundColor: colors.primaryRed,
    borderColor: colors.primaryDark,
  },
  chipUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.borderPink,
  },
  chipText: {
    fontSize: 15,
    letterSpacing: -0.2,
  },
  chipTextSelected: {
    fontFamily: fontFamilies.extraBold,
    color: '#FFFFFF',
  },
  chipTextUnselected: {
    fontFamily: fontFamilies.bold,
    color: colors.navyDark,
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

export default BloodGroupPicker;
