/**
 * LifeDrop Typography Tokens
 * Plus Jakarta Sans font definitions and text styles
 */

export const fontFamilies = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
};

export const typography = {
  fontFamilies,
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    display: 30,
    hero: 34,
  },
  styles: {
    hero: {
      fontFamily: fontFamilies.extraBold,
      fontSize: 32,
      lineHeight: 38,
      letterSpacing: -0.8,
    },
    h1: {
      fontFamily: fontFamilies.extraBold,
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: -0.6,
    },
    h2: {
      fontFamily: fontFamilies.bold,
      fontSize: 21,
      lineHeight: 27,
      letterSpacing: -0.4,
    },
    h3: {
      fontFamily: fontFamilies.semiBold,
      fontSize: 18,
      lineHeight: 24,
      letterSpacing: -0.2,
    },
    body: {
      fontFamily: fontFamilies.regular,
      fontSize: 15,
      lineHeight: 22,
    },
    bodyMedium: {
      fontFamily: fontFamilies.medium,
      fontSize: 15,
      lineHeight: 22,
    },
    bodyBold: {
      fontFamily: fontFamilies.semiBold,
      fontSize: 15,
      lineHeight: 22,
    },
    caption: {
      fontFamily: fontFamilies.regular,
      fontSize: 13,
      lineHeight: 18,
    },
    captionMedium: {
      fontFamily: fontFamilies.medium,
      fontSize: 13,
      lineHeight: 18,
    },
    tag: {
      fontFamily: fontFamilies.semiBold,
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.2,
    },
    button: {
      fontFamily: fontFamilies.bold,
      fontSize: 16,
      letterSpacing: -0.2,
    },
  },
};

export default typography;
