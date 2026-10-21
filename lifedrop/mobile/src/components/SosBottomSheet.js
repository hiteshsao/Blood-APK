import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BloodGroupPicker from './BloodGroupPicker';
import useLocation from '../hooks/useLocation';
import recipientApi from '../api/recipientApi';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { spacing, radii } from '../theme/spacing';
import { shadows } from '../theme/shadows';

export const SosBottomSheet = ({
  visible,
  onClose,
  user,
  onSosDispatched,
}) => {
  const { location, city, loading: locLoading, requestLocation } = useLocation();

  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [detectedCity, setDetectedCity] = useState('');
  const [coords, setCoords] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Initialize form when sheet opens
  useEffect(() => {
    if (visible) {
      setError(null);
      setPatientName(user?.name ? `${user.name} (Patient)` : '');
      const defaultGroup = user?.bloodGroup ? user.bloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-') : 'O+';
      setBloodGroup(defaultGroup);
      setMessage('URGENT: Patient needs voluntary blood donation immediately.');

      // Auto-detect location
      detectGps();
    }
  }, [visible, user]);

  const detectGps = async () => {
    const res = await requestLocation();
    if (res) {
      setCoords(res);
      if (city) setDetectedCity(city);
    } else if (user?.latitude && user?.longitude) {
      setCoords({ latitude: user.latitude, longitude: user.longitude });
      setDetectedCity(user.city || 'Detected Location');
    }
  };

  useEffect(() => {
    if (city) {
      setDetectedCity(city);
    }
  }, [city]);

  useEffect(() => {
    if (location) {
      setCoords(location);
    }
  }, [location]);

  const handleSendSos = async () => {
    if (!patientName.trim()) {
      setError('Please provide the patient name.');
      return;
    }

    if (!coords || !coords.latitude || !coords.longitude) {
      setError('GPS Location is required to notify nearby donors. Please tap "Detect GPS".');
      return;
    }

    try {
      setSending(true);
      setError(null);

      const payload = {
        patientName: patientName.trim(),
        bloodGroup: bloodGroup.replace('+', '_POSITIVE').replace('-', '_NEGATIVE'),
        city: detectedCity.trim() || user?.city || 'Local Area',
        latitude: coords.latitude,
        longitude: coords.longitude,
        message: message.trim() || 'Emergency SOS: Urgent blood required immediately.',
      };

      const result = await recipientApi.sendSos(payload);

      // Successfully dispatched
      onClose();
      if (typeof onSosDispatched === 'function') {
        onSosDispatched({
          requestId: result?.requestId,
          donorsNotified: result?.donorsNotified || 0,
          radiusKm: result?.radiusKm || 25,
          bloodGroup,
          patientName: patientName.trim(),
          city: payload.city,
        });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to dispatch SOS alert.';
      setError(msg);
      if (err?.response?.status === 400 && msg.includes('already have an active SOS')) {
        Alert.alert(
          'Active SOS In Progress',
          msg,
          [
            { text: 'OK', onPress: () => onClose() },
          ]
        );
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetContainer}
        >
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.urgentBadge}>
                <Ionicons name="warning" size={14} color="#FFFFFF" />
                <Text style={styles.urgentBadgeText}>EMERGENCY SOS ALERT</Text>
              </View>
              <Text style={styles.sheetTitle}>Broadcast Urgent Blood Need</Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={colors.navyDark} />
            </TouchableOpacity>
          </View>

          {/* Quick Emergency Calls Bar */}
          <View style={styles.emergencyBar}>
            <Text style={styles.emergencyBarTitle}>National Emergency Services:</Text>
            <View style={styles.emergencyButtonsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => Linking.openURL('tel:112')}
                style={styles.quickCall112}
              >
                <Ionicons name="call" size={13} color="#FFFFFF" />
                <Text style={styles.quickCallText}>Call 112</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => Linking.openURL('tel:108')}
                style={styles.quickCall108}
              >
                <MaterialCommunityIcons name="ambulance" size={14} color="#FFFFFF" />
                <Text style={styles.quickCallText}>Call 108 (Ambulance)</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.formScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* 1. Blood Group Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Blood Group Needed *</Text>
              <BloodGroupPicker
                value={bloodGroup}
                onChange={setBloodGroup}
              />
            </View>

            {/* 2. Patient Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Patient Name *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color={colors.muted} style={styles.inputIcon} />
                <TextInput
                  value={patientName}
                  onChangeText={setPatientName}
                  placeholder="e.g. Ramesh Verma"
                  placeholderTextColor={colors.lightMuted}
                  style={styles.textInput}
                />
              </View>
            </View>

            {/* 3. Auto-detected Location */}
            <View style={styles.inputGroup}>
              <View style={styles.labelWithAction}>
                <Text style={styles.fieldLabel}>Patient GPS Location *</Text>
                <TouchableOpacity
                  onPress={detectGps}
                  disabled={locLoading}
                  style={styles.detectGpsBtn}
                >
                  {locLoading ? (
                    <ActivityIndicator size="small" color={colors.primaryRed} />
                  ) : (
                    <>
                      <Feather name="crosshair" size={13} color={colors.primaryRed} />
                      <Text style={styles.detectGpsText}>Refresh GPS</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.locationCard}>
                <Ionicons name="location" size={20} color={colors.primaryRed} />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationCity}>
                    {detectedCity || user?.city || 'Detecting City...'}
                  </Text>
                  <Text style={styles.locationCoords}>
                    {coords
                      ? `${coords.latitude.toFixed(4)}°, ${coords.longitude.toFixed(4)}° (25 km radius)`
                      : 'Waiting for GPS fix...'}
                  </Text>
                </View>
                {coords ? (
                  <View style={styles.gpsVerifiedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  </View>
                ) : null}
              </View>
            </View>

            {/* 4. Note Line */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Emergency Notes & Location Details</Text>
              <View style={[styles.inputWrapper, { height: 75, alignItems: 'flex-start' }]}>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Mention location landmark, room bed number, or contact instructions..."
                  placeholderTextColor={colors.lightMuted}
                  multiline
                  numberOfLines={3}
                  style={[styles.textInput, { height: '100%', paddingTop: 8 }]}
                />
              </View>
            </View>

            {/* Mandatory Medical Disclaimer */}
            <View style={styles.disclaimerBox}>
              <Ionicons name="information-circle-outline" size={16} color="#B91C1C" />
              <Text style={styles.disclaimerText}>
                LifeDrop connects donors and recipients. In a medical emergency, contact a hospital or call 112.
              </Text>
            </View>

            {/* Big Send SOS Button */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleSendSos}
              disabled={sending}
              style={styles.sosButtonContainer}
            >
              <LinearGradient
                colors={['#DC2626', '#991B1B', '#7F1D1D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sosGradient}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="megaphone" size={22} color="#FEF08A" style={styles.sosBtnIcon} />
                    <Text style={styles.sosBtnText}>SEND EMERGENCY SOS NOW</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: 30 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    paddingTop: 10,
    ...shadows.elevated,
  },
  handleBar: {
    width: 44,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryRed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  urgentBadgeText: {
    color: '#FFFFFF',
    fontFamily: fontFamilies.extraBold,
    fontSize: 10,
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  sheetTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 20,
    color: colors.navyDark,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  emergencyBar: {
    backgroundColor: '#FEF2F2',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#FEE2E2',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 8,
    marginBottom: spacing.sm,
  },
  emergencyBarTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 11,
    color: '#991B1B',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emergencyButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickCall112: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
  },
  quickCall108: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B91C1C',
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
  },
  quickCallText: {
    color: '#FFFFFF',
    fontFamily: fontFamilies.bold,
    fontSize: 12,
  },
  formScroll: {
    paddingHorizontal: spacing.screenPadding,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radii.card,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    flex: 1,
    marginLeft: spacing.xs,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.danger,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: colors.navyDark,
    marginBottom: 6,
  },
  labelWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detectGpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  detectGpsText: {
    fontFamily: fontFamilies.bold,
    fontSize: 11,
    color: colors.primaryRed,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radii.input,
    paddingHorizontal: spacing.sm,
    height: 48,
  },
  inputIcon: {
    marginRight: spacing.xs,
  },
  textInput: {
    flex: 1,
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    color: colors.navyDark,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radii.input,
    padding: spacing.sm,
  },
  locationInfo: {
    flex: 1,
    marginLeft: spacing.xs,
  },
  locationCity: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: colors.navyDark,
  },
  locationCoords: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  gpsVerifiedBadge: {
    marginLeft: spacing.xs,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radii.card,
    padding: spacing.sm,
    marginBottom: spacing.lg,
    gap: 6,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: fontFamilies.medium,
    fontSize: 11.5,
    color: '#92400E',
    lineHeight: 16,
  },
  sosButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  sosGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  sosBtnIcon: {
    transform: [{ rotate: '-15deg' }],
  },
  sosBtnText: {
    color: '#FFFFFF',
    fontFamily: fontFamilies.extraBold,
    fontSize: 16,
    letterSpacing: 0.5,
  },
});

export default SosBottomSheet;
