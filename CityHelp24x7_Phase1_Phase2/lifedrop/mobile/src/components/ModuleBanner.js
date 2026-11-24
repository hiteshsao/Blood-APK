import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { spacing, radii } from '../theme/spacing';

/**
 * Rounded promo banner: bold title, small subtitle and a big icon on the right.
 */
export const ModuleBanner = ({
  title,
  subtitle,
  icon = 'heart',
  iconSet = 'ion',
  color = colors.modules.blood.main,
  tint = colors.modules.blood.tint,
  onPress,
  style,
}) => {
  const IconComponent = iconSet === 'mci' ? MaterialCommunityIcons : Ionicons;
  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { activeOpacity: 0.85, onPress } : {};

  return (
    <Wrapper style={[styles.banner, { backgroundColor: tint }, style]} {...wrapperProps}>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: colors.navyDark }]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.iconWrap}>
        <IconComponent name={icon} size={46} color={color} />
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.card,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  textWrap: {
    flex: 1,
    paddingRight: spacing.md,
  },
  title: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 15,
    lineHeight: 20,
  },
  subtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.muted,
    marginTop: 3,
  },
  iconWrap: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ModuleBanner;
