import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import CustomButton from '../../components/CustomButton';
import InputField from '../../components/InputField';
import BloodGroupPicker from '../../components/BloodGroupPicker';
import Card from '../../components/Card';

const GENDERS = ['Male', 'Female', 'Other'];

export const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();

  // Role toggle: DONOR or RECIPIENT
  const [role, setRole] = useState('DONOR');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [age, setAge] = useState('25');
  const [gender, setGender] = useState('Male');

  // Location State
  const [latitude, setLatitude] = useState(23.2599); // Bhopal default
  const [longitude, setLongitude] = useState(77.4126);
  const [locationDetecting, setLocationDetecting] = useState(false);
  const [locationDetectedText, setLocationDetectedText] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // GPS Auto-detect handler
  const handleUseMyLocation = async () => {
    try {
      setLocationDetecting(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Permission to access GPS was denied. You can manually enter your city name.'
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setLatitude(lat);
      setLongitude(lng);

      // Reverse geocode to find city
      try {
        const reverse = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng,
        });

        if (reverse && reverse.length > 0) {
          const place = reverse[0];
          const detectedCity = place.city || place.subregion || place.district || place.region || '';
          if (detectedCity) {
            setCity(detectedCity);
          }
          setLocationDetectedText(
            `${detectedCity || 'Coordinates'} (${lat.toFixed(4)}, ${lng.toFixed(4)})`
          );
        } else {
          setLocationDetectedText(`Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      } catch (geoErr) {
        setLocationDetectedText(`GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch (err) {
      console.warn('[Location Error]', err?.message);
      Alert.alert('GPS Location', 'Unable to fetch current position. Please check GPS settings.');
    } finally {
      setLocationDetecting(false);
    }
  };

  const handleRegister = async () => {
    // Validation
    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!email.trim()) {
      setError('Valid email address is required.');
      return;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!phone.trim() || !/^[0-9]{10}$/.test(phone.trim())) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (role === 'DONOR') {
      const parsedAge = parseInt(age, 10);
      if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 65) {
        setError('Donors must be between 18 and 65 years old.');
        return;
      }
      if (!bloodGroup) {
        setError('Please select your blood group.');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        role,
        city: city.trim() || 'Bhopal',
        latitude,
        longitude,
        ...(role === 'DONOR'
          ? {
              bloodGroup,
              age: parseInt(age, 10),
              gender,
            }
          : {}),
      };

      await register(payload);
      // AuthContext updates token and user which navigates automatically
    } catch (err) {
      console.log('[Register Error]', err?.response?.data || err?.message);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Registration failed. Please check your network and details.';
      setError(msg);
    } finally {
      setLoading(false);
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSubtitle}>
              Join LifeDrop peer-to-peer blood donation network
            </Text>
          </View>

          {/* Role Toggle at the Top */}
          <View style={styles.roleToggleWrapper}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setRole('DONOR');
                setError(null);
              }}
              style={[
                styles.roleButton,
                role === 'DONOR' && styles.roleButtonActive,
                role === 'DONOR' && shadows.chip,
              ]}
            >
              <Ionicons
                name="heart"
                size={18}
                color={role === 'DONOR' ? '#FFFFFF' : colors.primaryRed}
              />
              <Text
                style={[
                  styles.roleButtonText,
                  role === 'DONOR' && styles.roleButtonTextActive,
                ]}
              >
                I am a DONOR
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setRole('RECIPIENT');
                setError(null);
              }}
              style={[
                styles.roleButton,
                role === 'RECIPIENT' && styles.roleButtonActive,
                role === 'RECIPIENT' && shadows.chip,
              ]}
            >
              <Ionicons
                name="people"
                size={18}
                color={role === 'RECIPIENT' ? '#FFFFFF' : colors.navySlate}
              />
              <Text
                style={[
                  styles.roleButtonText,
                  role === 'RECIPIENT' && styles.roleButtonTextActive,
                ]}
              >
                I am a RECIPIENT
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <Card style={styles.formCard}>
            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            {/* Common Fields */}
            <InputField
              label="Full Name"
              placeholder="e.g. Priya Sharma"
              value={name}
              onChangeText={setName}
              leftIcon={<Feather name="user" size={18} color={colors.muted} />}
            />

            <InputField
              label="Email Address"
              placeholder="e.g. priya@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Feather name="mail" size={18} color={colors.muted} />}
            />

            <InputField
              label="Password (min 8 characters)"
              placeholder="Create a strong password"
              value={password}
              onChangeText={setPassword}
              isPassword
              leftIcon={<Feather name="lock" size={18} color={colors.muted} />}
            />

            <InputField
              label="Mobile Number (10 digits)"
              placeholder="10-digit mobile number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              leftIcon={<Feather name="phone" size={18} color={colors.muted} />}
            />

            {/* DONOR-ONLY Fields */}
            {role === 'DONOR' && (
              <View style={styles.donorSpecificBox}>
                <View style={styles.sectionDivider}>
                  <Text style={styles.sectionDividerText}>DONOR DETAILS</Text>
                </View>

                {/* Blood Group Picker */}
                <BloodGroupPicker
                  label="My Blood Group"
                  value={bloodGroup}
                  onChange={setBloodGroup}
                />

                <View style={styles.twoColumnRow}>
                  <View style={{ flex: 1, marginRight: spacing.sm }}>
                    <InputField
                      label="Age (18-65)"
                      placeholder="e.g. 25"
                      value={age}
                      onChangeText={setAge}
                      keyboardType="numeric"
                      maxLength={2}
                    />
                  </View>

                  <View style={{ flex: 1.3 }}>
                    <Text style={styles.genderLabel}>Gender</Text>
                    <View style={styles.genderRow}>
                      {GENDERS.map((g) => (
                        <TouchableOpacity
                          key={g}
                          activeOpacity={0.7}
                          onPress={() => setGender(g)}
                          style={[
                            styles.genderChip,
                            gender === g && styles.genderChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.genderChipText,
                              gender === g && styles.genderChipTextActive,
                            ]}
                          >
                            {g}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Location Section */}
            <View style={styles.locationSection}>
              <InputField
                label="City / Locality"
                placeholder="e.g. Bhopal, MP Nagar"
                value={city}
                onChangeText={setCity}
                leftIcon={<Ionicons name="location-outline" size={18} color={colors.muted} />}
              />

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleUseMyLocation}
                disabled={locationDetecting}
                style={styles.gpsButton}
              >
                {locationDetecting ? (
                  <ActivityIndicator size="small" color={colors.primaryRed} />
                ) : (
                  <>
                    <Ionicons name="navigate-circle-outline" size={20} color={colors.primaryRed} />
                    <Text style={styles.gpsButtonText}>Use My Current Location</Text>
                  </>
                )}
              </TouchableOpacity>

              {locationDetectedText ? (
                <Text style={styles.gpsFeedback}>📍 {locationDetectedText}</Text>
              ) : null}
            </View>

            {/* Submit Button */}
            <CustomButton
              title={`Register as ${role === 'DONOR' ? 'Donor' : 'Recipient'}`}
              onPress={handleRegister}
              loading={loading}
              variant="primary"
              style={styles.submitBtn}
            />
          </Card>

          {/* Switch to Login */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginLink}>Sign In</Text>
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
    paddingBottom: spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 26,
    color: colors.navyDark,
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  roleToggleWrapper: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.button,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.borderPink,
    marginBottom: spacing.lg,
    gap: 6,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.sm,
    gap: 6,
  },
  roleButtonActive: {
    backgroundColor: colors.primaryRed,
  },
  roleButtonText: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    color: colors.navyDark,
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
  },
  formCard: {
    padding: spacing.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderPink,
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
  donorSpecificBox: {
    backgroundColor: '#FFFDFD',
    borderRadius: radii.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderPink,
    paddingBottom: 6,
    marginBottom: spacing.sm,
  },
  sectionDividerText: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    color: colors.primaryRed,
    letterSpacing: 1.5,
  },
  twoColumnRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.xs,
  },
  genderLabel: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    color: colors.navyDark,
    marginBottom: spacing.xs + 2,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 6,
    height: 50,
    alignItems: 'center',
  },
  genderChip: {
    flex: 1,
    height: 48,
    borderRadius: radii.input,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderChipActive: {
    backgroundColor: colors.secondaryBtnBg,
    borderColor: colors.primaryRed,
  },
  genderChipText: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    color: colors.navyDark,
  },
  genderChipTextActive: {
    fontFamily: fontFamilies.bold,
    color: colors.primaryRed,
  },
  locationSection: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondaryBtnBg,
    borderWidth: 1,
    borderColor: colors.borderPink,
    borderRadius: radii.button,
    paddingVertical: spacing.sm + 2,
    marginTop: spacing.xs,
    gap: 6,
  },
  gpsButtonText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: colors.primaryRed,
  },
  gpsFeedback: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.muted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.muted,
  },
  loginLink: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    color: colors.primaryRed,
  },
});

export default RegisterScreen;
