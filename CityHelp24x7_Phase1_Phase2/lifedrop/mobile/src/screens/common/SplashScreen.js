import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Easing, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const NATIVE = Platform.OS !== 'web';
const INTRO_MS = 1500; // the intro always plays at least this long

const CHIPS = [
  { icon: 'construct', label: 'Services', color: colors.brand.main },
  { icon: 'water', label: 'Blood', color: colors.modules.blood.main },
  { icon: 'medkit', label: 'Hospitals', color: colors.modules.directory.main },
  { icon: 'warning', label: 'SOS', color: '#EA580C' },
];

const timing = (value, toValue, duration, delay = 0, easing = Easing.out(Easing.cubic)) =>
  Animated.timing(value, { toValue, duration, delay, easing, useNativeDriver: NATIVE });

/**
 * Animated MyCityZone opening screen.
 *  - Plays the intro on mount (logo springs in, pulse rings, wordmark, tagline, module chips).
 *  - When `ready` is true AND the intro has played, it fades/zooms out and calls `onFinish`.
 *  - Without `onFinish` it just stays on screen (static use while fonts load).
 */
export const SplashScreen = ({ ready = false, onFinish }) => {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTilt = useRef(new Animated.Value(-1)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current;
  const tagline = useRef(new Animated.Value(0)).current;
  const chips = useRef(CHIPS.map(() => new Animated.Value(0))).current;
  const exit = useRef(new Animated.Value(0)).current;
  const introDone = useRef(false);
  const exiting = useRef(false);
  const readyRef = useRef(ready);
  readyRef.current = ready;

  const runExit = () => {
    if (exiting.current || !onFinish) return;
    exiting.current = true;
    timing(exit, 1, 380, 0, Easing.in(Easing.cubic)).start(() => onFinish());
  };

  useEffect(() => {
    const pulse = (v, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          timing(v, 1, 1600, 0, Easing.out(Easing.quad)),
          timing(v, 0, 0),
        ])
      );
    const p1 = pulse(ring1, 200);
    const p2 = pulse(ring2, 900);
    p1.start();
    p2.start();

    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 70, useNativeDriver: NATIVE }),
      timing(logoOpacity, 1, 350),
      timing(logoTilt, 0, 700, 0, Easing.out(Easing.back(2))),
      timing(word, 1, 500, 300),
      timing(tagline, 1, 450, 600),
      Animated.stagger(
        90,
        chips.map((c) => Animated.spring(c, { toValue: 1, friction: 6, tension: 90, useNativeDriver: NATIVE }))
      ),
    ]).start();

    const t = setTimeout(() => {
      introDone.current = true;
      if (readyRef.current) runExit();
    }, INTRO_MS);

    return () => {
      clearTimeout(t);
      p1.stop();
      p2.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ready && introDone.current) runExit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const ringStyle = (v) => ({
    opacity: v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.45, 0] }),
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.4] }) }],
  });
  const rise = (v, from = 18) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }],
  });

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={colors.gradients.brandHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            transform: [{ scale: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }],
          },
        ]}
      >
        <View style={styles.logoArea}>
          <Animated.View style={[styles.ring, ringStyle(ring1)]} />
          <Animated.View style={[styles.ring, ringStyle(ring2)]} />
          <Animated.View
            style={[
              styles.logo,
              {
                opacity: logoOpacity,
                transform: [
                  { scale: logoScale },
                  { rotate: logoTilt.interpolate({ inputRange: [-1, 0], outputRange: ['-18deg', '0deg'] }) },
                ],
              },
            ]}
          >
            <MaterialCommunityIcons name="city-variant" size={56} color={colors.brand.main} />
            <View style={styles.badge}>
              <Ionicons name="add" size={16} color="#FFFFFF" />
            </View>
          </Animated.View>
        </View>

        <Animated.View style={[styles.wordRow, rise(word)]}>
          <Text style={styles.wordA}>MyCity</Text>
          <Text style={styles.wordB}>Zone</Text>
        </Animated.View>
        <Animated.Text style={[styles.tagline, rise(tagline, 10)]}>Your city. Every help. One app.</Animated.Text>

        <View style={styles.chipsRow}>
          {CHIPS.map((c, i) => (
            <Animated.View
              key={c.label}
              style={[
                styles.chip,
                {
                  opacity: chips[i],
                  transform: [{ scale: chips[i].interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
                },
              ]}
            >
              <View style={styles.chipIcon}>
                <Ionicons name={c.icon} size={18} color={c.color} />
              </View>
              <Text style={styles.chipText}>{c.label}</Text>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      <Animated.Text style={[styles.footer, { opacity: tagline }]}>Verified pros • Direct help • 24x7</Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.dark,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  blobTop: {
    width: 320,
    height: 320,
    top: -110,
    right: -120,
  },
  blobBottom: {
    width: 260,
    height: 260,
    bottom: -90,
    left: -100,
  },
  content: {
    alignItems: 'center',
  },
  logoArea: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  logo: {
    width: 104,
    height: 104,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.modules.blood.main,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  wordA: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 40,
    letterSpacing: -1,
    color: '#FFFFFF',
  },
  wordB: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 40,
    letterSpacing: -1,
    color: '#93C5FD',
  },
  tagline: {
    fontFamily: fontFamilies.medium,
    fontSize: 15,
    color: '#DBEAFE',
    marginTop: spacing.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    marginTop: spacing.xxxl,
  },
  chip: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  chipIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
    color: '#DBEAFE',
    marginTop: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 44,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    letterSpacing: 0.4,
    color: 'rgba(219,234,254,0.8)',
  },
});

export default SplashScreen;
