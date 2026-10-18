import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import CustomButton from '../../components/CustomButton';
import Loader from '../../components/Loader';

export const RecipientHomeScreen = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecipientData = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/api/recipient/requests');
      setRequests(res.data?.data || []);
    } catch (err) {
      console.log('[RecipientHome Error]', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipientData();
  }, [fetchRecipientData]);

  const onRefresh = () => {
    setRefreshing(true);
    refreshUser();
    fetchRecipientData();
  };

  const latestRequest = requests.length > 0 ? requests[0] : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primaryRed]}
            tintColor={colors.primaryRed}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greetingText}>Hello,</Text>
            <Text style={styles.userNameText}>{user?.name || 'Friend'} 👋</Text>
          </View>

          <View style={styles.roleBadgeBox}>
            <Text style={styles.roleBadgeText}>RECIPIENT</Text>
          </View>
        </View>

        {/* Large "Request Blood" Primary Card */}
        <Card style={styles.requestBloodCard} variant="pink">
          <View style={styles.requestBloodHeader}>
            <View style={styles.waterDropBox}>
              <Ionicons name="water" size={28} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.requestBloodTitle}>Need Blood Urgently?</Text>
              <Text style={styles.requestBloodDesc}>
                Connect directly with compatible, verified donors nearby in minutes.
              </Text>
            </View>
          </View>

          <CustomButton
            title="Create Blood Request"
            onPress={() => navigation.navigate('Request Blood')}
            variant="primary"
            style={styles.createBtn}
          />
        </Card>

        {/* EMERGENCY SOS Button */}
        <View style={styles.sosContainer}>
          <CustomButton
            title="EMERGENCY SOS REQUEST"
            onPress={() =>
              navigation.navigate('Request Blood', {
                urgency: 'URGENT',
                prefillUnits: 2,
              })
            }
            variant="sos"
            style={styles.sosBtn}
          />
          <Text style={styles.sosCaption}>
            ⚡ Immediately alerts all matching donors within 25 km with highest priority
          </Text>
        </View>

        {/* Active / Latest Request Status Card */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Latest Request Status</Text>
          {requests.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('My Requests')}
            >
              <Text style={styles.viewAllText}>All Requests ({requests.length})</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <Loader message="Loading request status..." />
        ) : latestRequest ? (
          <Card style={styles.latestCard}>
            <View style={styles.latestCardTop}>
              <View style={styles.bloodCircle}>
                <Text style={styles.bloodCircleText}>{latestRequest.bloodGroup}</Text>
              </View>

              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.latestPatientName}>
                  Patient: {latestRequest.patientName}
                </Text>
                <Text style={styles.latestUnits}>
                  {latestRequest.unitsNeeded || 1} unit(s) • {latestRequest.city || 'Bhopal'}
                </Text>
              </View>

              <StatusBadge status={latestRequest.status} />
            </View>

            {/* Donor Acceptance info if available */}
            {latestRequest.acceptedDonor ? (
              <View style={styles.acceptedDonorBox}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <View style={{ flex: 1, marginLeft: 6 }}>
                  <Text style={styles.donorNameText}>
                    Donor: {latestRequest.acceptedDonor.name} ({latestRequest.acceptedDonor.bloodGroup})
                  </Text>
                  <Text style={styles.donorPhoneText}>
                    Phone: {latestRequest.acceptedDonor.phone}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.matchedCountBox}>
                <Ionicons name="radio-outline" size={16} color={colors.primaryRed} />
                <Text style={styles.matchedCountText}>
                  {latestRequest.matchedDonorCount != null
                    ? `${latestRequest.matchedDonorCount} nearby compatible donors notified.`
                    : 'Searching for nearby donors...'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('My Requests')}
              style={styles.trackDetailsBtn}
            >
              <Text style={styles.trackDetailsBtnText}>Track Request Details</Text>
              <Ionicons name="arrow-forward" size={15} color={colors.primaryRed} />
            </TouchableOpacity>
          </Card>
        ) : (
          <Card style={styles.emptyCard}>
            <Ionicons name="medkit-outline" size={32} color={colors.primaryRed} />
            <Text style={styles.emptyCardTitle}>No Active Blood Requests</Text>
            <Text style={styles.emptyCardDesc}>
              When you or a family member needs blood, tap "Create Blood Request" above.
            </Text>
          </Card>
        )}

        {/* How It Works Strip */}
        <Card style={styles.howItWorksCard}>
          <Text style={styles.howItWorksTitle}>Zero Intermediaries</Text>
          <Text style={styles.howItWorksSubtitle}>
            Direct peer-to-peer connection with genuine volunteer donors.
          </Text>

          <View style={styles.stepsRow}>
            <View style={styles.stepItem}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>1</Text>
              </View>
              <Text style={styles.stepTitle}>Request</Text>
              <Text style={styles.stepDesc}>State blood type & location</Text>
            </View>

            <View style={styles.stepDivider} />

            <View style={styles.stepItem}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>2</Text>
              </View>
              <Text style={styles.stepTitle}>Match</Text>
              <Text style={styles.stepDesc}>Nearby donors alerted</Text>
            </View>

            <View style={styles.stepDivider} />

            <View style={styles.stepItem}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>3</Text>
              </View>
              <Text style={styles.stepTitle}>Connect</Text>
              <Text style={styles.stepDesc}>Donor accepts & calls</Text>
            </View>
          </View>
        </Card>
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  greetingText: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    color: colors.muted,
  },
  userNameText: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 24,
    color: colors.navyDark,
    letterSpacing: -0.5,
  },
  roleBadgeBox: {
    backgroundColor: colors.secondaryBtnBg,
    borderColor: colors.borderPink,
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  roleBadgeText: {
    fontFamily: fontFamilies.bold,
    fontSize: 11,
    color: colors.primaryRed,
    letterSpacing: 1,
  },
  requestBloodCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  requestBloodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  waterDropBox: {
    width: 52,
    height: 52,
    borderRadius: radii.circle,
    backgroundColor: colors.primaryRed,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.redGlow,
  },
  requestBloodTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 18,
    color: colors.navyDark,
    letterSpacing: -0.3,
  },
  requestBloodDesc: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
    lineHeight: 18,
  },
  createBtn: {
    marginTop: 0,
  },
  sosContainer: {
    marginBottom: spacing.lg,
  },
  sosBtn: {
    height: 54,
  },
  sosCaption: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.primaryDark,
    textAlign: 'center',
    marginTop: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 18,
    color: colors.navyDark,
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: colors.primaryRed,
  },
  latestCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  latestCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bloodCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.circle,
    backgroundColor: colors.pageBg,
    borderColor: colors.borderPink,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bloodCircleText: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 15,
    color: colors.primaryRed,
  },
  latestPatientName: {
    fontFamily: fontFamilies.bold,
    fontSize: 15,
    color: colors.navyDark,
  },
  latestUnits: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  acceptedDonorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  donorNameText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: '#15803D',
  },
  donorPhoneText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: '#166534',
  },
  matchedCountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pageBg,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
    gap: 6,
  },
  matchedCountText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.primaryRed,
  },
  trackDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    gap: 4,
  },
  trackDetailsBtnText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: colors.primaryRed,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: '#FFFFFF',
    borderColor: colors.borderPink,
    marginBottom: spacing.lg,
  },
  emptyCardTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 15,
    color: colors.navyDark,
    marginTop: spacing.sm,
  },
  emptyCardDesc: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  howItWorksCard: {
    padding: spacing.lg,
    backgroundColor: '#FFFFFF',
    marginBottom: spacing.xl,
  },
  howItWorksTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 16,
    color: colors.navyDark,
    letterSpacing: -0.3,
  },
  howItWorksSubtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.secondaryBtnBg,
    borderColor: colors.borderPink,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepNumText: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 12,
    color: colors.primaryRed,
  },
  stepTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: colors.navyDark,
  },
  stepDesc: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 2,
  },
  stepDivider: {
    width: 16,
    height: 1,
    backgroundColor: colors.borderPink,
    marginTop: 14,
  },
});

export default RecipientHomeScreen;
