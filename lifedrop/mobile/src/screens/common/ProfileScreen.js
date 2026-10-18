import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';
import Card from '../../components/Card';
import ScreenHeader from '../../components/ScreenHeader';
import CustomButton from '../../components/CustomButton';

export const ProfileScreen = () => {
  const { user, role, logout, refreshUser } = useAuth();
  const [available, setAvailable] = useState(user?.available ?? true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  const isDonor = role === 'DONOR';

  const toggleAvailability = async (newValue) => {
    setAvailable(newValue);
    try {
      setUpdatingAvailability(true);
      await axiosInstance.put('/api/donor/availability', { available: newValue });
      await refreshUser();
    } catch (err) {
      setAvailable(!newValue);
      const msg = err?.response?.data?.message || 'Failed to update availability.';
      Alert.alert('Availability', msg);
    } finally {
      setUpdatingAvailability(false);
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
      <ScreenHeader title="My Profile" subtitle="Account and privacy settings" />

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
                    ? 'You will receive notifications for nearby blood requests'
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
          <Text style={styles.cardHeaderTitle}>Account Details</Text>

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
              <Text style={styles.infoValue}>Contact hidden until donation accepted</Text>
            </View>
          </View>
        </Card>

        {/* About LifeDrop Card */}
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
  cardHeaderTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 16,
    color: colors.navyDark,
    marginBottom: spacing.md,
    letterSpacing: -0.3,
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
});

export default ProfileScreen;
