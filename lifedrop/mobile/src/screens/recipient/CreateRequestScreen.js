import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Feather, Ionicons } from '@expo/vector-icons';
import axiosInstance from '../../api/axiosInstance';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import ScreenHeader from '../../components/ScreenHeader';
import Card from '../../components/Card';
import InputField from '../../components/InputField';
import BloodGroupPicker from '../../components/BloodGroupPicker';
import CustomButton from '../../components/CustomButton';

export const CreateRequestScreen = ({ route, navigation }) => {
  const initialUrgency = route?.params?.urgency || 'NORMAL';
  const initialUnits = route?.params?.prefillUnits || 1;

  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [unitsNeeded, setUnitsNeeded] = useState(initialUnits);
  const [urgency, setUrgency] = useState(initialUrgency);
  const [city, setCity] = useState('Bhopal');
  const [latitude, setLatitude] = useState(23.2599);
  const [longitude, setLongitude] = useState(77.4126);
  const [message, setMessage] = useState('');
  const [locationDetecting, setLocationDetecting] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync if route params change
  useEffect(() => {
    if (route?.params?.urgency) {
      setUrgency(route.params.urgency);
    }
  }, [route?.params?.urgency]);

  const handleUseMyLocation = async () => {
    try {
      setLocationDetecting(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'GPS permission was denied. You can manually enter the city name.'
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

      try {
        const reverse = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng,
        });

        if (reverse && reverse.length > 0) {
          const place = reverse[0];
          const detected = place.city || place.subregion || place.district || place.region || '';
          if (detected) setCity(detected);
          setLocationFeedback(
            `${detected || 'Detected'} (${lat.toFixed(4)}, ${lng.toFixed(4)})`
          );
        } else {
          setLocationFeedback(`GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      } catch {
        setLocationFeedback(`GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch (err) {
      console.warn('[Location Error]', err?.message);
      Alert.alert('GPS Error', 'Failed to retrieve coordinates. Please enter city manually.');
    } finally {
      setLocationDetecting(false);
    }
  };

  const handleSubmit = async () => {
    if (!patientName.trim()) {
      setError('Patient name is required.');
      return;
    }
    if (!bloodGroup) {
      setError('Please select the required blood group.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        patientName: patientName.trim(),
        bloodGroup,
        unitsNeeded,
        urgency,
        city: city.trim() || 'Bhopal',
        latitude,
        longitude,
        message: message.trim() || undefined,
        radiusKm: urgency === 'URGENT' ? 25.0 : 10.0,
      };

      const res = await axiosInstance.post('/api/recipient/requests', payload);
      const created = res.data?.data;
      const notifiedCount = created?.matchedDonorCount || 0;

      Alert.alert(
        urgency === 'URGENT' ? '🚨 EMERGENCY SOS SENT!' : 'Request Broadcasted! 🩸',
        `Blood request created successfully. ${notifiedCount} compatible donors nearby have been notified.`,
        [
          {
            text: 'View My Requests',
            onPress: () => {
              // Reset form and switch to My Requests tab
              setPatientName('');
              setMessage('');
              navigation.navigate('My Requests');
            },
          },
        ]
      );
    } catch (err) {
      console.log('[Create Request Error]', err?.response?.data || err?.message);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to create blood request. Please check details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Request Blood"
        subtitle="Broadcast to compatible donors within your radius"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Urgency Toggle */}
          <View style={styles.urgencyToggleBox}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setUrgency('NORMAL')}
              style={[
                styles.urgencyBtn,
                urgency === 'NORMAL' && styles.urgencyBtnNormalActive,
              ]}
            >
              <Ionicons
                name="heart-outline"
                size={16}
                color={urgency === 'NORMAL' ? '#FFFFFF' : colors.navyDark}
              />
              <Text
                style={[
                  styles.urgencyBtnText,
                  urgency === 'NORMAL' && styles.urgencyBtnTextActive,
                ]}
              >
                Normal (10 km)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setUrgency('URGENT')}
              style={[
                styles.urgencyBtn,
                urgency === 'URGENT' && styles.urgencyBtnUrgentActive,
                urgency === 'URGENT' && shadows.sosGlow,
              ]}
            >
              <Ionicons
                name="warning-outline"
                size={16}
                color={urgency === 'URGENT' ? '#FFFFFF' : colors.primaryRed}
              />
              <Text
                style={[
                  styles.urgencyBtnText,
                  urgency === 'URGENT' && styles.urgencyBtnTextActive,
                ]}
              >
                URGENT SOS (25 km)
              </Text>
            </TouchableOpacity>
          </View>

          <Card style={styles.formCard}>
            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            {/* Patient Name */}
            <InputField
              label="Patient Name"
              placeholder="e.g. Ankit Sharma"
              value={patientName}
              onChangeText={setPatientName}
              leftIcon={<Feather name="user" size={18} color={colors.muted} />}
            />

            {/* Blood Group Picker */}
            <BloodGroupPicker
              label="Blood Group Needed"
              value={bloodGroup}
              onChange={setBloodGroup}
            />

            {/* Units Needed Stepper */}
            <View style={styles.unitsSection}>
              <Text style={styles.unitsLabel}>Units Needed</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setUnitsNeeded((prev) => Math.max(1, prev - 1))}
                  style={styles.stepperBtn}
                >
                  <Ionicons name="remove" size={20} color={colors.navyDark} />
                </TouchableOpacity>

                <View style={styles.stepperValueBox}>
                  <Text style={styles.stepperValueText}>{unitsNeeded}</Text>
                  <Text style={styles.stepperUnitLabel}>Unit(s)</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setUnitsNeeded((prev) => Math.min(5, prev + 1))}
                  style={styles.stepperBtn}
                >
                  <Ionicons name="add" size={20} color={colors.navyDark} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Location Section */}
            <View style={styles.locationSection}>
              <InputField
                label="City / Area"
                placeholder="e.g. Bhopal, TT Nagar"
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
                    <Text style={styles.gpsButtonText}>Auto-detect GPS Location</Text>
                  </>
                )}
              </TouchableOpacity>

              {locationFeedback ? (
                <Text style={styles.gpsFeedback}>📍 {locationFeedback}</Text>
              ) : null}
            </View>

            {/* Note / Message */}
            <InputField
              label="Additional Message / Room No."
              placeholder="e.g. Room 304, Surgery ward. Family contact nearby."
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={3}
            />

            {/* Submit Button */}
            <CustomButton
              title={
                urgency === 'URGENT'
                  ? 'BROADCAST EMERGENCY SOS'
                  : 'Broadcast Blood Request'
              }
              onPress={handleSubmit}
              loading={loading}
              variant={urgency === 'URGENT' ? 'sos' : 'primary'}
              style={styles.submitBtn}
            />
          </Card>
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
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xxxl,
  },
  urgencyToggleBox: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.button,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.borderPink,
    marginBottom: spacing.md,
    gap: 6,
  },
  urgencyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.sm,
    gap: 6,
  },
  urgencyBtnNormalActive: {
    backgroundColor: colors.navyDark,
  },
  urgencyBtnUrgentActive: {
    backgroundColor: colors.primaryRed,
  },
  urgencyBtnText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: colors.navyDark,
  },
  urgencyBtnTextActive: {
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
  unitsSection: {
    marginVertical: spacing.sm,
  },
  unitsLabel: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    color: colors.navyDark,
    marginBottom: spacing.xs + 2,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 4,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValueBox: {
    flex: 1,
    alignItems: 'center',
  },
  stepperValueText: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 20,
    color: colors.navyDark,
  },
  stepperUnitLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    color: colors.muted,
  },
  locationSection: {
    marginVertical: spacing.xs,
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
    marginTop: spacing.lg,
  },
});

export default CreateRequestScreen;
