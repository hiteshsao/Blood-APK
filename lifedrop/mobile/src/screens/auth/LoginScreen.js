import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import CustomButton from '../../components/CustomButton';
import InputField from '../../components/InputField';
import Card from '../../components/Card';

export const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login({
        email: email.trim().toLowerCase(),
        password,
      });
      // AuthContext token change will trigger navigation automatically
    } catch (err) {
      console.log('[Login Error]', err?.response?.data || err?.message);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Login failed. Please check your credentials or backend connection.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (role) => {
    if (role === 'DONOR') {
      setEmail('donor1@lifedrop.test');
      setPassword('Password@123');
    } else {
      setEmail('recipient1@lifedrop.test');
      setPassword('Password@123');
    }
    setError(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header & Logo */}
          <View style={styles.header}>
            <View style={[styles.logoIconBox, shadows.redGlow]}>
              <LinearGradient
                colors={colors.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <Ionicons name="water" size={28} color="#FFFFFF" />
              </LinearGradient>
            </View>

            <View style={styles.brandRow}>
              <Text style={styles.brandLife}>Life</Text>
              <Text style={styles.brandDrop}>Drop</Text>
            </View>

            {/* Required Hero Text */}
            <Text style={styles.heroText}>Every Drop Counts. Every Life Saved.</Text>
            <Text style={styles.heroSubText}>
              Direct Peer-to-Peer Blood Donation Network. No intermediaries.
            </Text>
          </View>

          {/* Form Card */}
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>Sign In</Text>

            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            <InputField
              label="Email Address"
              placeholder="e.g. rahul@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Feather name="mail" size={18} color={colors.muted} />}
            />

            <InputField
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError(null);
              }}
              isPassword
              leftIcon={<Feather name="lock" size={18} color={colors.muted} />}
            />

            <CustomButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              variant="primary"
              style={styles.submitBtn}
            />

            {/* Quick Demo Credentials */}
            <View style={styles.demoSection}>
              <Text style={styles.demoLabel}>Quick Demo Fill (Password@123):</Text>
              <View style={styles.demoButtonsRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => fillDemoAccount('DONOR')}
                  style={styles.demoChip}
                >
                  <Ionicons name="heart" size={14} color={colors.primaryRed} />
                  <Text style={styles.demoChipText}>Donor (A+)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => fillDemoAccount('RECIPIENT')}
                  style={styles.demoChip}
                >
                  <Ionicons name="people" size={14} color={colors.navySlate} />
                  <Text style={styles.demoChipText}>Recipient (Rajesh)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          {/* Switch to Register */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New to LifeDrop? </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerLink}>Register as Donor or Recipient</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoIconBox: {
    borderRadius: 18,
    marginBottom: spacing.sm,
  },
  logoGradient: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  brandLife: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 28,
    color: colors.navyDark,
    letterSpacing: -0.5,
  },
  brandDrop: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 28,
    color: colors.primaryRed,
    letterSpacing: -0.5,
  },
  heroText: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 21,
    color: colors.navyDark,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginTop: spacing.xs,
  },
  heroSubText: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 300,
  },
  formCard: {
    padding: spacing.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderPink,
  },
  formTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 20,
    color: colors.navyDark,
    marginBottom: spacing.md,
    letterSpacing: -0.4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.urgent.bg,
    borderColor: colors.status.urgent.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  errorBannerText: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    color: colors.danger,
    flex: 1,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
  demoSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  demoLabel: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  demoChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: colors.borderPink,
    borderRadius: radii.button,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: 6,
  },
  demoChipText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    color: colors.navyDark,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
    flexWrap: 'wrap',
  },
  footerText: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.muted,
  },
  registerLink: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    color: colors.primaryRed,
  },
});

export default LoginScreen;
