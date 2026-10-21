import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import userApi from '../../api/userApi';
import requestApi from '../../api/requestApi';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import Card from '../../components/Card';
import ScreenHeader from '../../components/ScreenHeader';
import NotificationBell from '../../components/NotificationBell';
import CustomButton from '../../components/CustomButton';
import InputField from '../../components/InputField';
import BloodGroupPicker from '../../components/BloodGroupPicker';

export const ProfileScreen = () => {
  const { user, role, logout, refreshUser } = useAuth();
  const isDonor = role === 'DONOR';

  const [available, setAvailable] = useState(user?.available ?? true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState('');

  // Edit Profile Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editCity, setEditCity] = useState(user?.city || '');
  const [editBloodGroup, setEditBloodGroup] = useState(user?.bloodGroup || 'A+');
  const [editAge, setEditAge] = useState(String(user?.age || '25'));
  const [editGender, setEditGender] = useState(user?.gender || 'Male');
  const [savingProfile, setSavingProfile] = useState(false);
  const [editError, setEditError] = useState(null);

  useEffect(() => {
    if (user) {
      setAvailable(user.available ?? true);
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
      setEditCity(user.city || '');
      setEditBloodGroup(user.bloodGroup || 'A+');
      setEditAge(String(user.age || '25'));
      setEditGender(user.gender || 'Male');
    }
  }, [user]);

  const toggleAvailability = async (newValue) => {
    setAvailable(newValue);
    try {
      setUpdatingAvailability(true);
      await requestApi.updateAvailability(newValue);
      await refreshUser();
    } catch (err) {
      setAvailable(!newValue);
      const msg = err?.response?.data?.message || 'Failed to update availability.';
      Alert.alert('Availability', msg);
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const handleUpdateLocation = async () => {
    try {
      setUpdatingLocation(true);
      setLocationFeedback('');

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'GPS permission was denied. Please allow location access in your device settings.'
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;

      // Update server location
      await userApi.updateLocation({ latitude: lat, longitude: lng });

      // Reverse geocode to detect city
      try {
        const reverse = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng,
        });

        if (reverse && reverse.length > 0) {
          const detectedCity =
            reverse[0].city || reverse[0].subregion || reverse[0].district || reverse[0].region;
          if (detectedCity) {
            await userApi.updateProfile({ city: detectedCity });
          }
          setLocationFeedback(
            `Location updated: ${detectedCity || 'Coordinates'} (${lat.toFixed(4)}, ${lng.toFixed(4)})`
          );
        } else {
          setLocationFeedback(`Location updated: (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        }
      } catch {
        setLocationFeedback(`Location updated: (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }

      await refreshUser();
      Alert.alert('Location Updated 📍', 'Your live coordinates have been synchronized.');
    } catch (err) {
      console.warn('[Location Error]', err?.message);
      Alert.alert('GPS Error', 'Failed to retrieve current coordinates. Check device GPS settings.');
    } finally {
      setUpdatingLocation(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setEditError('Name is required.');
      return;
    }
    if (!editPhone.trim() || !/^[0-9]{10}$/.test(editPhone.trim())) {
      setEditError('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setSavingProfile(true);
      setEditError(null);

      const payload = {
        name: editName.trim(),
        phone: editPhone.trim(),
        city: editCity.trim() || 'Bhopal',
        bloodGroup: editBloodGroup,
        ...(isDonor
          ? {
              age: parseInt(editAge, 10) || 25,
              gender: editGender,
            }
          : {}),
      };

      await userApi.updateProfile(payload);
      await refreshUser();
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (err) {
      console.log('[Update Profile Error]', err?.response?.data || err?.message);
      setEditError(err?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of LifeDrop?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const initials = (user?.name || 'LD')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="My Profile"
        subtitle="Account, location and privacy settings"
        rightComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <NotificationBell style={{ marginRight: 8 }} />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setEditError(null);
                setEditModalVisible(true);
              }}
              style={styles.editHeaderBtn}
            >
              <Feather name="edit-3" size={16} color={colors.primaryRed} />
              <Text style={styles.editHeaderBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <View style={styles.nameBlock}>
              <Text style={styles.profileName}>{user?.name || 'LifeDrop User'}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'email@lifedrop.test'}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{role || 'USER'}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Donor Availability Settings */}
        {isDonor && (
          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>Donation Availability</Text>
                <Text style={styles.settingDesc}>
                  {available
                    ? 'Active in search. You will receive notifications for nearby blood requests'
                    : 'Turned off. You will not receive donation alerts'}
                </Text>
              </View>

              <Switch
                value={available}
                onValueChange={toggleAvailability}
                disabled={updatingAvailability}
                trackColor={{ false: '#E2E8F0', true: colors.borderPink }}
                thumbColor={available ? colors.primaryRed : '#94A3B8'}
              />
            </View>
          </Card>
        )}

        {/* Profile Details Card */}
        <Card style={styles.detailsCard}>
          <View style={styles.detailsCardHeader}>
            <Text style={styles.cardHeaderTitle}>Account Details</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setEditModalVisible(true)}
            >
              <Text style={styles.editLink}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {isDonor && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="water" size={18} color={colors.primaryRed} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Blood Group</Text>
                <Text style={styles.infoValue}>{user?.bloodGroup || 'Not Specified'}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="call" size={18} color={colors.primaryRed} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{user?.phone || 'Not Specified'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="location" size={18} color={colors.primaryRed} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>City / Area</Text>
              <Text style={styles.infoValue}>{user?.city || 'Bhopal'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Ionicons name="shield-checkmark" size={18} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Privacy Shield</Text>
              <Text style={styles.infoValue}>Contact hidden until a request is accepted</Text>
            </View>
          </View>
        </Card>

        {/* Update GPS Location Button */}
        <Card style={styles.locationCard}>
          <Text style={styles.cardHeaderTitle}>Live GPS Location</Text>
          <Text style={styles.locationDesc}>
            Keep your location updated so recipients can find you within 10 km.
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleUpdateLocation}
            disabled={updatingLocation}
            style={styles.updateLocationBtn}
          >
            {updatingLocation ? (
              <ActivityIndicator size="small" color={colors.primaryRed} />
            ) : (
              <>
                <Ionicons name="navigate-circle-outline" size={20} color={colors.primaryRed} />
                <Text style={styles.updateLocationBtnText}>Update My Current Location</Text>
              </>
            )}
          </TouchableOpacity>

          {locationFeedback ? (
            <Text style={styles.locationFeedbackText}>📍 {locationFeedback}</Text>
          ) : null}
        </Card>

        {/* About LifeDrop Guarantee */}
        <Card style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>Zero Intermediaries Guarantee</Text>
          <Text style={styles.aboutDesc}>
            LifeDrop connects donors and recipients directly with 100% privacy and transparency.
            No hospitals, no blood banks, zero administrative fees.
          </Text>
        </Card>

        {/* Sign Out Button */}
        <CustomButton
          title="Sign Out"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutBtn}
          textStyle={{ color: colors.danger }}
        />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setEditModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={colors.navyDark} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {editError && (
                <View style={styles.modalErrorBanner}>
                  <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={styles.modalErrorText}>{editError}</Text>
                </View>
              )}

              <InputField
                label="Full Name"
                placeholder="e.g. Aarav Sharma"
                value={editName}
                onChangeText={setEditName}
              />

              <InputField
                label="Phone Number (10 digits)"
                placeholder="e.g. 9826012345"
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                maxLength={10}
              />

              <InputField
                label="City / Locality"
                placeholder="e.g. Bhopal, MP Nagar"
                value={editCity}
                onChangeText={setEditCity}
              />

              {isDonor && (
                <>
                  <BloodGroupPicker
                    label="Blood Group"
                    value={editBloodGroup}
                    onChange={setEditBloodGroup}
                  />

                  <InputField
                    label="Age (18-65)"
                    placeholder="e.g. 26"
                    value={editAge}
                    onChangeText={setEditAge}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </>
              )}

              <CustomButton
                title="Save Changes"
                onPress={handleSaveProfile}
                loading={savingProfile}
                variant="primary"
                style={{ marginTop: spacing.md, marginBottom: spacing.sm }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  editHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryBtnBg,
    borderColor: colors.borderPink,
    borderWidth: 1,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: radii.button,
    gap: 4,
  },
  editHeaderBtnText: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    color: colors.primaryRed,
  },
  profileCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryRed,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.redGlow,
  },
  avatarText: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 22,
    color: '#FFFFFF',
  },
  nameBlock: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  profileName: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 20,
    color: colors.navyDark,
    letterSpacing: -0.4,
  },
  profileEmail: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondaryBtnBg,
    borderColor: colors.borderPink,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 3,
    marginTop: spacing.xs + 2,
  },
  roleBadgeText: {
    fontFamily: fontFamilies.bold,
    fontSize: 11,
    color: colors.primaryRed,
    letterSpacing: 0.5,
  },
  settingCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 15,
    color: colors.navyDark,
  },
  settingDesc: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    lineHeight: 16,
    paddingRight: spacing.sm,
  },
  detailsCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  detailsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardHeaderTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 16,
    color: colors.navyDark,
    letterSpacing: -0.3,
  },
  editLink: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: colors.primaryRed,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.pageBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  infoLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    color: colors.muted,
  },
  infoValue: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    color: colors.navyDark,
    marginTop: 1,
  },
  locationCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  locationDesc: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  updateLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondaryBtnBg,
    borderColor: colors.borderPink,
    borderWidth: 1,
    borderRadius: radii.button,
    paddingVertical: 12,
    gap: 6,
  },
  updateLocationBtnText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: colors.primaryRed,
  },
  locationFeedbackText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.primaryDark,
    textAlign: 'center',
    marginTop: spacing.xs + 2,
  },
  aboutCard: {
    padding: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderColor: colors.borderPink,
    marginBottom: spacing.lg,
  },
  aboutTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    color: colors.navyDark,
  },
  aboutDesc: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
    lineHeight: 17,
  },
  logoutBtn: {
    borderColor: '#FECACA',
    backgroundColor: '#FFFFFF',
    marginBottom: spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    padding: spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 20,
    color: colors.navyDark,
  },
  modalErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.urgent.bg,
    borderColor: colors.status.urgent.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: 6,
  },
  modalErrorText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.danger,
    flex: 1,
  },
});

export default ProfileScreen;
