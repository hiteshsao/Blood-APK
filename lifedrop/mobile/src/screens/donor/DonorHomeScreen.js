import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Switch,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import requestApi from '../../api/requestApi';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import CustomButton from '../../components/CustomButton';
import Loader from '../../components/Loader';
import NotificationBell from '../../components/NotificationBell';
import { formatTimeAgo, formatDistance } from '../../utils/formatters';

export const DonorHomeScreen = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const [available, setAvailable] = useState(user?.available ?? true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [eligibility, setEligibility] = useState(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDonorData = useCallback(async () => {
    try {
      setError(null);

      // 1. Fetch pending requests
      const reqList = await requestApi.getIncomingRequests();
      setIncomingRequests(reqList);

      // 2. Fetch eligibility (90-day recovery rule)
      try {
        const elig = await requestApi.getEligibility();
        setEligibility(elig);
      } catch (e) {
        // ignore eligibility fetch error if offline
      }

      // 3. Fetch history count
      try {
        const historyList = await requestApi.getHistory();
        setHistoryCount(historyList.length);
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.log('[DonorHome Error]', err?.response?.data || err?.message);
      setError(err?.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDonorData();
  }, [fetchDonorData]);

  const onRefresh = () => {
    setRefreshing(true);
    refreshUser();
    fetchDonorData();
  };

  const toggleAvailability = async (newValue) => {
    setAvailable(newValue);
    try {
      setUpdatingAvailability(true);
      await requestApi.updateAvailability(newValue);
      await refreshUser();
    } catch (err) {
      // Revert if error
      setAvailable(!newValue);
      const msg = err?.response?.data?.message || 'Failed to update availability.';
      Alert.alert('Eligibility & Availability', msg);
    } finally {
      setUpdatingAvailability(false);
    }
  };

  // Eligibility calculations
  const isEligible = eligibility?.eligible !== false;
  const gapDays = eligibility?.donationGapDays || 90;
  const daysRemaining = eligibility?.daysRemaining != null ? eligibility.daysRemaining : 0;
  const daysCompleted = Math.max(0, gapDays - daysRemaining);
  const progressPercent = Math.min(100, Math.round((daysCompleted / gapDays) * 100));

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
        {/* Top Header: Greeting & Blood Badge */}
        <View style={styles.topBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingText}>Welcome back,</Text>
            <Text style={styles.userNameText}>{user?.name || 'Life Saver'} 👋</Text>
            <Text style={styles.citySubtitle}>📍 {user?.city || 'Bhopal, MP'}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <NotificationBell style={{ marginRight: 10 }} />
            <View style={styles.bloodBadgeBox}>
              <Text style={styles.bloodBadgeText}>{user?.bloodGroup || 'A+'}</Text>
            </View>
          </View>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchDonorData}>
              <Text style={styles.retryLink}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 1. Big Availability Switch Card */}
        <Card style={styles.availabilityCard} variant="highlight">
          <View style={styles.availabilityRow}>
            <View style={styles.availInfo}>
              <View style={styles.availStatusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: available ? colors.success : colors.lightMuted },
                  ]}
                />
                <Text style={styles.availTitle}>
                  {available ? 'Ready to Donate Blood' : 'Currently Unavailable'}
                </Text>
              </View>
              <Text style={styles.availDesc}>
                {available
                  ? 'Active in nearby search. Recipients can alert you for emergency blood needs.'
                  : 'Turn ON when you are available to receive donation notifications.'}
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

        {/* 2. Eligibility Card with Progress Bar and Next Eligible Date */}
        <Card style={styles.eligibilityCard}>
          <View style={styles.eligibilityHeader}>
            <View
              style={[
                styles.eligibilityIconBox,
                { backgroundColor: isEligible ? '#DCFCE7' : '#FEF3C7' },
              ]}
            >
              <Ionicons
                name={isEligible ? 'shield-checkmark' : 'timer-outline'}
                size={22}
                color={isEligible ? colors.success : colors.warning}
              />
            </View>

            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <View style={styles.eligibilityTitleRow}>
                <Text style={styles.eligibilityTitle}>
                  {isEligible ? 'Eligible to Donate Blood' : '90-Day Recovery Gap'}
                </Text>
                <Text
                  style={[
                    styles.eligibilityPercent,
                    { color: isEligible ? colors.success : colors.warning },
                  ]}
                >
                  {isEligible ? '100%' : `${progressPercent}%`}
                </Text>
              </View>
              <Text style={styles.eligibilityDesc}>
                {isEligible
                  ? 'You are physically ready to respond to incoming requests immediately.'
                  : `Next eligible date: ${eligibility?.nextEligibleDate || 'In recovery'} (${daysRemaining} days remaining)`}
              </Text>
            </View>
          </View>

          {/* Progress Bar Track */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: isEligible ? colors.success : colors.primaryRed,
                },
              ]}
            />
          </View>

          <View style={styles.progressLabelsRow}>
            <Text style={styles.progressSubLabel}>Last Donation</Text>
            <Text style={styles.progressSubLabel}>
              {isEligible ? 'Ready Now' : `Day ${daysCompleted} / ${gapDays}`}
            </Text>
          </View>
        </Card>

        {/* 3. Small Stat Tiles (Requests received, Donations done) */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <View style={styles.statIconBadge}>
              <Ionicons name="notifications-outline" size={18} color={colors.primaryRed} />
            </View>
            <Text style={styles.statNumber}>{incomingRequests.length}</Text>
            <Text style={styles.statLabel}>Requests Received</Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="heart" size={18} color={colors.success} />
            </View>
            <Text style={[styles.statNumber, { color: colors.success }]}>{historyCount}</Text>
            <Text style={styles.statLabel}>Donations Done</Text>
          </Card>
        </View>

        {/* 4. Three Latest Incoming Requests */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Latest Incoming Requests</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Requests')}
          >
            <Text style={styles.viewAllText}>View All ({incomingRequests.length})</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Loader message="Loading nearby requests..." />
        ) : incomingRequests.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="heart-outline" size={32} color={colors.primaryRed} />
            </View>
            <Text style={styles.emptyTitle}>No Requests Near You Right Now</Text>
            <Text style={styles.emptySubtitle}>
              You will receive instant high-priority alerts whenever a patient in your area requests {user?.bloodGroup || 'your'} blood.
            </Text>
          </Card>
        ) : (
          incomingRequests.slice(0, 3).map((req) => {
            const reqId = req.requestId || req.id;
            return (
              <Card
                key={String(reqId)}
                style={styles.requestCard}
                onPress={() => navigation.navigate('RequestDetail', { requestId: reqId })}
              >
                <View style={styles.reqTopRow}>
                  {/* Red Circle Blood Badge */}
                  <View style={styles.bloodChipCircle}>
                    <Text style={styles.bloodChipCircleText}>{req.bloodGroup}</Text>
                  </View>

                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.reqPatientName}>
                      {req.patientName || 'Emergency Patient'}
                    </Text>
                    <Text style={styles.reqDistance}>
                      📍 {req.city || 'Bhopal'} {req.distanceKm != null ? `• ${formatDistance(req.distanceKm)}` : ''}
                    </Text>
                    <Text style={styles.reqTimeAgo}>
                      {formatTimeAgo(req.createdAt)}
                    </Text>
                  </View>

                  <StatusBadge status={req.urgency || 'NORMAL'} size="sm" />
                </View>

                {req.message ? (
                  <View style={styles.messagePreview}>
                    <Text style={styles.messagePreviewText} numberOfLines={2}>
                      "{req.message}"
                    </Text>
                  </View>
                ) : null}

                <View style={styles.cardFooterRow}>
                  <Text style={styles.viewDetailsText}>Tap to review & respond</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primaryRed} />
                </View>
              </Card>
            );
          })
        )}

        {/* Disclaimer / Zero Intermediaries Notice */}
        <View style={styles.disclaimerBox}>
          <Ionicons name="shield-checkmark" size={14} color={colors.muted} />
          <Text style={styles.disclaimerText}>
            Zero intermediaries: No hospitals, no blood banks, zero administrative fees. 100% direct peer-to-peer life connection.
          </Text>
        </View>
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
  citySubtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  bloodBadgeBox: {
    width: 52,
    height: 52,
    borderRadius: radii.circle,
    backgroundColor: colors.primaryRed,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.redGlow,
  },
  bloodBadgeText: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 20,
    color: '#FFFFFF',
  },
  errorBox: {
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
  errorText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.danger,
    flex: 1,
  },
  retryLink: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    color: colors.primaryDark,
  },
  availabilityCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  availStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  availTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 16,
    color: colors.navyDark,
  },
  availDesc: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
    marginTop: 2,
  },
  eligibilityCard: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.borderPink,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  eligibilityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  eligibilityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eligibilityTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eligibilityTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    color: colors.navyDark,
  },
  eligibilityPercent: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 13,
  },
  eligibilityDesc: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    lineHeight: 16,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  progressSubLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    color: colors.lightMuted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  statIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.pageBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statNumber: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 24,
    color: colors.primaryRed,
  },
  statLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    textAlign: 'center',
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
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: '#FFFFFF',
    borderColor: colors.borderPink,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.pageBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 15,
    color: colors.navyDark,
  },
  emptySubtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    maxWidth: 280,
  },
  requestCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  reqTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bloodChipCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.pageBg,
    borderColor: colors.borderPink,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bloodChipCircleText: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 16,
    color: colors.primaryRed,
  },
  reqPatientName: {
    fontFamily: fontFamilies.bold,
    fontSize: 15,
    color: colors.navyDark,
  },
  reqDistance: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  reqTimeAgo: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: colors.lightMuted,
    marginTop: 1,
  },
  messagePreview: {
    backgroundColor: '#F8FAFC',
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  messagePreviewText: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.muted,
    fontStyle: 'italic',
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
    gap: 4,
  },
  viewDetailsText: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    color: colors.primaryRed,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
    gap: 6,
  },
  disclaimerText: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: colors.muted,
    flex: 1,
    lineHeight: 16,
  },
});

export default DonorHomeScreen;
