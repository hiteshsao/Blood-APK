import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { spacing } from '../theme/spacing';

export const Loader = ({
  message = 'Connecting to LifeDrop...',
  fullScreen = false,
  size = 'large',
  color = colors.primaryRed,
  style,
}) => {
  return (
    <View style={[fullScreen ? styles.fullScreen : styles.container, style]}>
      <View style={styles.spinnerWrapper}>
        <ActivityIndicator size={size} color={color} />
      </View>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.pageBg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  spinnerWrapper: {
    padding: spacing.md,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderPink,
    marginBottom: spacing.md,
  },
  message: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
});

export default Loader;
