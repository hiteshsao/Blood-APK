import React, { useState, useEffect, useRef } from 'react';
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
import OtpInput from '../../components/OtpInput';

export const LoginScreen = ({ navigation }) => {
  const { login, sendOtp, verifyOtp } = useAuth();

  // Mode: "password" | "otp"
  const [activeTab, setActiveTab] = useState('password');

  // Password Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  // Email OTP Login State
  const [otpEmail, setOtpEmail] = useState('');
  const [otpStep, setOtpStep] = useState(1); // 1: email, 2: 6-digit code
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [countdown, setCountdown] = useState(0);

  const timerRef = useRef(null);

  // 60-second Resend countdown timer
  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [countdown]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const formatErrorMessage = (err, defaultMsg) => {
    if (!err?.response) {
      return 'Unable to connect to LifeDrop server. Please check your internet connection.';
    }
    if (err.response.status === 429) {
      return 'Please wait before requesting another code.';
    }
    return err.response.data?.message || err.response.data?.error || defaultMsg;
  };

  // Password Submit
  const handlePasswordLogin = async () => {
    if (!email.trim() || !password) {
      setPasswordError('Please enter your email and password.');
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordError(null);
      await login({
        email: email.trim().toLowerCase(),
        password,
      });
      // AuthContext token change triggers automatic navigation
    } catch (err) {
      setPasswordError(formatErrorMessage(err, 'Invalid email or password.'));
    } finally {
      setPasswordLoading(false);
    }
  };

  // OTP Step 1: Send Code
  const handleSendOtp = async () => {
    const cleanEmail = otpEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setOtpError('Please enter a valid email address.');
      return;
    }

    try {
      setOtpSending(true);
      setOtpError(null);
      await sendOtp(cleanEmail);
      setOtpStep(2);
      setCountdown(60);
      setOtpCode('');
    } catch (err) {
      setOtpError(formatErrorMessage(err, 'Failed to send login code. Please try again.'));
    } finally {
      setOtpSending(false);
    }
  };

  // OTP Step 2: Resend Code
  const handleResendOtp = async () => {
    if (countdown > 0 || otpSending) return;
    await handleSendOtp();
  };

  // OTP Step 2: Verify Code
  const handleVerifyOtp = async () => {
    if (otpCode.length < 6) {
      setOtpError('Please enter the 6-digit code sent to your email.');
      return;
    }

    try {
      setOtpVerifying(true);
      setOtpError(null);
      await verifyOtp(otpEmail.trim().toLowerCase(), otpCode);
      // AuthContext saves to SecureStore and navigates
    } catch (err) {
      setOtpError(formatErrorMessage(err, 'Invalid or expired code'));
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleChangeEmail = () => {
    setOtpStep(1);
    setOtpCode('');
    setOtpError(null);
  };

  const fillDemoAccount = (role) => {
    const demoEmail = role === 'DONOR' ? 'donor1@lifedrop.test' : 'recipient1@lifedrop.test';
    if (activeTab === 'password') {
      setEmail(demoEmail);
      setPassword('Password@123');
      setPasswordError(null);
    } else {
      setOtpEmail(demoEmail);
      setOtpError(null);
    }
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

            <Text style={styles.heroText}>Every Drop Counts. Every Life Saved.</Text>
            <Text style={styles.heroSubText}>
              Direct Peer-to-Peer Blood Donation Network. No intermediaries.
            </Text>
          </View>

          {/* Form Card */}
          <Card style={styles.formCard}>
            
            {/* Segmented Mode Toggle: Password | Email code */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setActiveTab('password');
                  setPasswordError(null);
                }}
                style={[
                  styles.tabButton,
                  activeTab === 'password' && styles.tabButtonActive,
                ]}
              >
                <Feather
                  name="lock"
                  size={15}
                  color={activeTab === 'password' ? colors.navyDark : colors.muted}
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === 'password' && styles.tabButtonTextActive,
                  ]}
                >
                  Password
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setActiveTab('otp');
                  setOtpError(null);
                }}
                style={[
                  styles.tabButton,
                  activeTab === 'otp' && styles.tabButtonActive,
                ]}
              >
                <Feather
                  name="key"
                  size={15}
                  color={activeTab === 'otp' ? colors.navyDark : colors.muted}
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    activeTab === 'otp' && styles.tabButtonTextActive,
                  ]}
                >
                  Email code
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB 1: Password Login */}
            {activeTab === 'password' && (
              <View>
                {passwordError && (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={18} color={colors.danger} />
                    <Text style={styles.errorBannerText}>{passwordError}</Text>
                  </View>
                )}

                <InputField
                  label="Email Address"
                  placeholder="e.g. donor1@lifedrop.test"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (passwordError) setPasswordError(null);
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
                    if (passwordError) setPasswordError(null);
                  }}
                  isPassword
                  leftIcon={<Feather name="lock" size={18} color={colors.muted} />}
                />

                <CustomButton
                  title="Sign In"
                  onPress={handlePasswordLogin}
                  loading={passwordLoading}
                  variant="primary"
                  style={styles.submitBtn}
                />
              </View>
            )}

            {/* TAB 2: Email OTP Login */}
            {activeTab === 'otp' && (
              <View>
                {otpError && (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={18} color={colors.danger} />
                    <Text style={styles.errorBannerText}>{otpError}</Text>
                  </View>
                )}

                {/* STEP 1: Enter Email */}
                {otpStep === 1 && (
                  <View>
                    <InputField
                      label="Registered Email Address"
                      placeholder="e.g. donor1@lifedrop.test"
                      value={otpEmail}
                      onChangeText={(text) => {
                        setOtpEmail(text);
                        if (otpError) setOtpError(null);
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      leftIcon={<Feather name="mail" size={18} color={colors.muted} />}
                    />
                    <Text style={styles.otpHelperText}>
                      We will email you a 6-digit login code. No password needed.
                    </Text>

                    <CustomButton
                      title="Send code"
                      onPress={handleSendOtp}
                      loading={otpSending}
                      variant="primary"
                      style={styles.submitBtn}
                    />
                  </View>
                )}

                {/* STEP 2: Enter 6-digit Code */}
                {otpStep === 2 && (
                  <View>
                    <View style={styles.otpHeaderInfo}>
                      <Text style={styles.otpSentToText}>
                        We sent a 6 digit code to{' '}
                        <Text style={styles.otpSentEmail}>{otpEmail}</Text>
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={handleChangeEmail}
                        style={styles.changeEmailBtn}
                      >
                        <Feather name="arrow-left" size={14} color={colors.primaryRed} />
                        <Text style={styles.changeEmailText}>Change email</Text>
                      </TouchableOpacity>
                    </View>

                    <OtpInput
                      code={otpCode}
                      onChangeCode={(code) => {
                        setOtpCode(code);
                        if (otpError) setOtpError(null);
                      }}
                      length={6}
                      disabled={otpVerifying}
                    />

                    <CustomButton
                      title="Verify and sign in"
                      onPress={handleVerifyOtp}
                      loading={otpVerifying}
                      disabled={otpCode.length < 6 || otpVerifying}
                      variant="primary"
                      style={styles.submitBtn}
                    />

                    <View style={styles.resendContainer}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={handleResendOtp}
                        disabled={countdown > 0 || otpSending}
                      >
                        <Text
                          style={[
                            styles.resendText,
                            countdown > 0 && styles.resendTextDisabled,
                          ]}
                        >
                          {countdown > 0
                            ? `Resend code (${countdown}s)`
                            : 'Resend code'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Quick Demo Credentials */}
            <View style={styles.demoSection}>
              <Text style={styles.demoLabel}>Quick Demo Fill:</Text>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: radii.button,
    padding: 3,
    marginBottom: spacing.lg,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.button - 2,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.card,
  },
  tabButtonText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
    color: colors.muted,
  },
  tabButtonTextActive: {
    fontFamily: fontFamilies.bold,
    color: colors.navyDark,
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
  otpHelperText: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  otpHeaderInfo: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  otpSentToText: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.navyDark,
    textAlign: 'center',
  },
  otpSentEmail: {
    fontFamily: fontFamilies.bold,
    color: colors.navyDark,
  },
  changeEmailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingVertical: 2,
  },
  changeEmailText: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    color: colors.primaryRed,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  resendText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: colors.primaryRed,
  },
  resendTextDisabled: {
    color: colors.muted,
    fontFamily: fontFamilies.medium,
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
