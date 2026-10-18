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
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { Feather, Ionicons } from '@expo/vector-icons';
import recipientApi from '../../api/recipientApi';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import ScreenHeader from '../../components/ScreenHeader';
import Card from '../../components/Card';
import InputField from '../../components/InputField';
import BloodGroupPicker from '../../components/BloodGroupPicker';
import CustomButton from '../../components/CustomButton';

// Default center coordinates (Indore, MP)
const DEFAULT_LAT = 22.7196;
const DEFAULT_LNG = 75.8577;

export const CreateRequestScreen = ({ route, navigation }) => {
  const initialUrgency = route?.params?.urgency || 'NORMAL';
  const initialUnits = route?.params?.prefillUnits || 1;

  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [unitsNeeded, setUnitsNeeded] = useState(initialUnits);
  const [urgency, setUrgency] = useState(initialUrgency);
  const [city, setCity] = useState('Indore');
  const [latitude, setLatitude] = useState(DEFAULT_LAT);
  const [longitude, setLongitude] = useState(DEFAULT_LNG);
  const [requiredByPreset, setRequiredByPreset] = useState('ASAP');
  const [message, setMessage] = useState('');
  const [locationAddress, setLocationAddress] = useState('Indore Center, MP');

  const [locationDetecting, setLocationDetecting] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync if route params change
  useEffect(() => {
    if (route?.params?.urgency) {
      setUrgency(route.params.urgency);
    }
    if (route?.params?.prefillUnits) {
      setUnitsNeeded(route.params.prefillUnits);
    }
  }, [route?.params?.urgency, route?.params?.prefillUnits]);

  // Stepper handlers
  const handleDecrementUnits = () => {
    if (unitsNeeded > 1) {
      setUnitsNeeded((prev) => prev - 1);
    }
  };

  const handleIncrementUnits = () => {
    if (unitsNeeded < 5) {
      setUnitsNeeded((prev) => prev + 1);
    }
  };

  // Location auto-detection with pre-permission reason dialog
  const handleDetectLocationWithReason = () => {
    Alert.alert(
      'Location Access Required 📍',
      'LifeDrop uses your location to alert the closest compatible blood donors nearby within 10 to 25 km for emergency matching.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: performGpsDetection,
        },
      ]
    );
  };

  const performGpsDetection = async () => {
    try {
      setLocationDetecting(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        Alert.alert(
          'Location Permission Denied',
          'You can still specify your location manually by typing the city below and tapping the map to position the pin.'
        );
        return;
      }

      setPermissionDenied(false);
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setLatitude(lat);
      setLongitude(lng);

      // Reverse geocode to get city name & address
      try {
        const reverse = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng,
        });

        if (reverse && reverse.length > 0) {
          const place = reverse[0];
          const detectedCity = place.city || place.subregion || place.district || place.region || 'Indore';
          const street = place.street || place.name || '';
          setCity(detectedCity);
          setLocationAddress(`${street ? street + ', ' : ''}${detectedCity}`);
        } else {
          setLocationAddress(`GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }
      } catch {
        setLocationAddress(`GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch (err) {
      console.warn('[Location Error]', err?.message);
      Alert.alert('GPS Error', 'Failed to retrieve current coordinates. You can place the pin manually on the map.');
    } finally {
      setLocationDetecting(false);
    }
  };

  // Map tap / drag handler
  const handleMapPress = (e) => {
    const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
    setLatitude(lat);
    setLongitude(lng);
    setLocationAddress(`Pin at: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  const handleSubmit = async () => {
    if (!patientName.trim()) {
      setError('Please enter the patient name.');
      return;
    }
    if (!bloodGroup) {
      setError('Please select a blood group.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Calculate requiredBy ISO string based on preset
      let requiredByDate = new Date();
      if (requiredByPreset === 'ASAP') {
        requiredByDate.setHours(requiredByDate.getHours() + 2);
      } else if (requiredByPreset === 'Today') {
        requiredByDate.setHours(21, 0, 0, 0);
      } else if (requiredByPreset === 'Tomorrow') {
        requiredByDate.setDate(requiredByDate.getDate() + 1);
        requiredByDate.setHours(12, 0, 0, 0);
      }

      const payload = {
        patientName: patientName.trim(),
        bloodGroup,
        unitsNeeded,
        urgency,
        city: city.trim() || 'Indore',
        latitude,
        longitude,
        radiusKm: urgency === 'URGENT' ? 25.0 : 10.0,
        message: message.trim() || undefined,
        requiredBy: requiredByDate.toISOString(),
      };

      const created = await recipientApi.createRequest(payload);
      const notifiedCount = created?.matchedDonorCount || 0;

      Alert.alert(
        urgency === 'URGENT' ? '🚨 EMERGENCY SOS BROADCASTED!' : 'Request Broadcasted! 🩸',
        `Blood request created successfully. ${notifiedCount} compatible donors nearby have been alerted.`,
        [
          {
            text: 'Track Request',
            onPress: () => {
              // Navigate to RequestStatusScreen
              navigation.navigate('RequestStatus', { requestId: created.id });
            },
          },
        ]
      );
    } catch (err) {
      console.log('[Create Request Error]', err?.response?.data || err?.message);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to create request. Please check your details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title={urgency === 'URGENT' ? 'Emergency SOS Request' : 'Create Blood Request'}
        subtitle="Zero intermediaries • Direct volunteer alert"
        showBack
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* 1. Patient Name */}
          <Card style={styles.card}>
            <Text style={styles.sectionLabel}>Patient Information</Text>
            <InputField
              label="Patient Full Name"
              placeholder="e.g. Rajesh Sharma"
              value={patientName}
              onChangeText={setPatientName}
            />
          </Card>

          {/* 2. Blood Group Picker */}
          <Card style={styles.card}>
            <Text style={styles.sectionLabel}>Required Blood Group</Text>
            <Text style={styles.helperText}>
              Select the exact blood type needed for the patient:
            </Text>
            <BloodGroupPicker
              selectedGroup={bloodGroup}
              onSelect={setBloodGroup}
            />
          </Card>

          {/* 3. Units Stepper (1-5 units) */}
          <Card style={styles.card}>
            <Text style={styles.sectionLabel}>Units Required</Text>
            <View style={styles.stepperContainer}>
              <View style={styles.stepperInfo}>
                <Ionicons name="water" size={24} color={colors.primaryRed} />
                <Text style={styles.stepperUnitsText}>
                  {unitsNeeded} {unitsNeeded === 1 ? 'Unit' : 'Units'} (approx. {unitsNeeded * 350} ml)
                </Text>
              </View>

              <View style={styles.stepperButtonsRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleDecrementUnits}
                  disabled={unitsNeeded <= 1}
                  style={[
                    styles.stepperBtn,
                    unitsNeeded <= 1 && styles.stepperBtnDisabled,
                  ]}
                >
                  <Ionicons
                    name="remove"
                    size={20}
                    color={unitsNeeded <= 1 ? colors.lightMuted : colors.navyDark}
                  />
                </TouchableOpacity>

                <View style={styles.stepperValueBox}>
                  <Text style={styles.stepperValue}>{unitsNeeded}</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleIncrementUnits}
                  disabled={unitsNeeded >= 5}
                  style={[
                    styles.stepperBtn,
                    unitsNeeded >= 5 && styles.stepperBtnDisabled,
                  ]}
                >
                  <Ionicons
                    name="add"
                    size={20}
                    color={unitsNeeded >= 5 ? colors.lightMuted : colors.navyDark}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </Card>

          {/* 4. Urgency Toggle (Normal vs Urgent) */}
          <Card style={styles.card}>
            <Text style={styles.sectionLabel}>Urgency Level</Text>
            <View style={styles.urgencyToggleRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setUrgency('NORMAL')}
                style={[
                  styles.urgencySegment,
                  urgency === 'NORMAL' && styles.urgencySegmentActiveNormal,
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={urgency === 'NORMAL' ? '#2563EB' : colors.muted}
                />
                <Text
                  style={[
                    styles.urgencySegmentText,
                    urgency === 'NORMAL' && styles.urgencyTextActiveNormal,
                  ]}
                >
                  Normal (10 km)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setUrgency('URGENT')}
                style={[
                  styles.urgencySegment,
                  urgency === 'URGENT' && styles.urgencySegmentActiveUrgent,
                ]}
              >
                <Ionicons
                  name="warning"
                  size={18}
                  color={urgency === 'URGENT' ? colors.danger : colors.muted}
                />
                <Text
                  style={[
                    styles.urgencySegmentText,
                    urgency === 'URGENT' && styles.urgencyTextActiveUrgent,
                  ]}
                >
                  Urgent SOS (25 km)
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* 5. Location Block (GPS detect, Address, Small Map with draggable/tappable pin) */}
          <Card style={styles.card}>
            <View style={styles.locationHeaderRow}>
              <Text style={styles.sectionLabel}>Patient Vicinity & Location</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleDetectLocationWithReason}
                disabled={locationDetecting}
                style={styles.gpsDetectBtn}
              >
                {locationDetecting ? (
                  <ActivityIndicator size="small" color={colors.primaryRed} />
                ) : (
                  <>
                    <Ionicons name="navigate-circle-outline" size={16} color={colors.primaryRed} />
                    <Text style={styles.gpsDetectBtnText}>Use My GPS</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <InputField
              label="City / Locality"
              placeholder="e.g. Indore, Vijay Nagar"
              value={city}
              onChangeText={setCity}
            />

            <View style={styles.addressDisplayRow}>
              <Ionicons name="location" size={16} color={colors.primaryRed} />
              <Text style={styles.addressDisplayText} numberOfLines={1}>
                {locationAddress}
              </Text>
            </View>

            {permissionDenied && (
              <View style={styles.permissionDeniedNotice}>
                <Ionicons name="information-circle-outline" size={16} color={colors.warning} />
                <Text style={styles.permissionDeniedText}>
                  GPS permission denied. Tap anywhere on the map below or drag the pin to place your location.
                </Text>
              </View>
            )}

            {/* Small interactive map with movable pin */}
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                region={{
                  latitude,
                  longitude,
                  latitudeDelta: 0.04,
                  longitudeDelta: 0.04,
                }}
                onPress={handleMapPress}
              >
                <Circle
                  center={{ latitude, longitude }}
                  radius={urgency === 'URGENT' ? 3000 : 1500}
                  fillColor="rgba(220, 38, 38, 0.15)"
                  strokeColor="#DC2626"
                  strokeWidth={1.5}
                />
                <Marker
                  coordinate={{ latitude, longitude }}
                  draggable
                  onDragEnd={(e) => {
                    const c = e.nativeEvent.coordinate;
                    setLatitude(c.latitude);
                    setLongitude(c.longitude);
                    setLocationAddress(`Pin at: ${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`);
                  }}
                  title="Patient Location"
                  description="Tap or drag pin to adjust"
                />
              </MapView>

              <View style={styles.mapHintBadge}>
                <Ionicons name="hand-right-outline" size={13} color="#FFFFFF" />
                <Text style={styles.mapHintText}>Tap map or drag pin to adjust location</Text>
              </View>
            </View>
          </Card>

          {/* 6. Required By Preset */}
          <Card style={styles.card}>
            <Text style={styles.sectionLabel}>Needed By</Text>
            <View style={styles.presetChipsRow}>
              {['ASAP', 'Today', 'Tomorrow'].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  activeOpacity={0.7}
                  onPress={() => setRequiredByPreset(preset)}
                  style={[
                    styles.presetChip,
                    requiredByPreset === preset && styles.presetChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      requiredByPreset === preset && styles.presetChipTextActive,
                    ]}
                  >
                    {preset === 'ASAP'
                      ? 'Immediate (ASAP)'
                      : preset === 'Today'
                      ? 'Today (By 9 PM)'
                      : 'Tomorrow (By Noon)'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* 7. Message / Note */}
          <Card style={styles.card}>
            <Text style={styles.sectionLabel}>Message / Patient Room Note</Text>
            <InputField
              placeholder="e.g. ICU Room 304, contact at entrance. Direct voluntary donation only."
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={3}
              style={{ minHeight: 70 }}
            />
          </Card>

          {/* Disclaimer */}
          <View style={styles.disclaimerRow}>
            <Ionicons name="shield-checkmark" size={14} color={colors.muted} />
            <Text style={styles.disclaimerText}>
              LifeDrop connects directly with donors. No hospital fees, no blood bank charges. 100% voluntary.
            </Text>
          </View>

          {/* Submit Button */}
          <CustomButton
            title={urgency === 'URGENT' ? 'BROADCAST EMERGENCY SOS' : 'Broadcast Blood Request'}
            onPress={handleSubmit}
            loading={loading}
            variant={urgency === 'URGENT' ? 'sos' : 'primary'}
            style={styles.submitBtn}
          />
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
  card: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: 15,
    color: colors.navyDark,
    marginBottom: spacing.xs,
  },
  helperText: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: spacing.md,
    borderRadius: radii.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    color: colors.danger,
    marginLeft: 8,
    flex: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  stepperInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepperUnitsText: {
    fontFamily: fontFamilies.bold,
    fontSize: 15,
    color: colors.navyDark,
    marginLeft: spacing.sm,
  },
  stepperButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  stepperValueBox: {
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 18,
    color: colors.navyDark,
  },
  urgencyToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: radii.button,
    padding: 4,
    marginTop: spacing.xs,
  },
  urgencySegment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radii.button - 2,
  },
  urgencySegmentActiveNormal: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    ...shadows.cardSoft,
  },
  urgencySegmentActiveUrgent: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    ...shadows.cardSoft,
  },
  urgencySegmentText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: colors.muted,
    marginLeft: 6,
  },
  urgencyTextActiveNormal: {
    color: '#2563EB',
  },
  urgencyTextActiveUrgent: {
    color: colors.danger,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F1',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
  },
  gpsDetectBtnText: {
    fontFamily: fontFamilies.bold,
    fontSize: 11,
    color: colors.primaryRed,
    marginLeft: 4,
  },
  addressDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
  },
  addressDisplayText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.navyDark,
    marginLeft: 6,
    flex: 1,
  },
  permissionDeniedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
  },
  permissionDeniedText: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: '#92400E',
    marginLeft: 6,
    flex: 1,
  },
  mapContainer: {
    height: 180,
    borderRadius: radii.card,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.borderPink,
    marginTop: spacing.xs,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapHintBadge: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
  },
  mapHintText: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  presetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.xs,
  },
  presetChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: '#FFF1F1',
    borderColor: colors.borderPink,
  },
  presetChipText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.muted,
  },
  presetChipTextActive: {
    fontFamily: fontFamilies.bold,
    color: colors.primaryRed,
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  disclaimerText: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: colors.muted,
    marginLeft: 6,
    flex: 1,
  },
  submitBtn: {
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
  },
});

export default CreateRequestScreen;
