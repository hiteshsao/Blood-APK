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
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import ScreenHeader from '../../components/ScreenHeader';
import Loader from '../../components/Loader';

export const DonorHomeScreen = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const [available, setAvailable] = useState(user?.available ?? true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [eligibility, setEligibility] = useState(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDonorData = useCallback(async () => {
    try {
      // 1. Fetch pending requests
      const reqRes = await axiosInstance.get('/api/donor/requests');
      const reqList = reqRes.data?.data || [];
      setIncomingRequests(reqList);

      // 2. Fetch eligibility
      try {
        const eligRes = await axiosInstance.get('/api/donor/eligibility');
        setEligibility(eligRes.data?.data || null);
      } catch (e) {
        // ignore if not configured
      }

      // 3. Fetch history count
      try {
        const histRes = await axiosInstance.get('/api/donor/history');
        setHistoryCount((histRes.data?.data || []).length);
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.log('[DonorHome Error]', err?.message);
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
      await axiosInstance.put('/api/donor/availability', { available: newValue });
      await refreshUser();
    } catch (err) {
      // Revert if error
      setAvailable(!newValue);
      const msg = err?.response?.data?.message || 'Failed to update availability.';
      Alert.alert('Eligibility / Availability', msg);
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const isEligible = eligibility?.eligible !== false;

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
        {/* Header */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greetingText}>Welcome back,</Text>
            <Text style={styles.userNameText}>{user?.name || 'Life Saver'} 👋</Text>
          </View>
          <View style={styles.bloodBadgeBox}>
            <Text style={styles.bloodBadgeText}>{user?.bloodGroup || 'A+'}</Text>
          </View>
        </View>

        {/* Availability Switch Card */}
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
                  ? 'Recipients in your area can find and alert you in emergencies.'
                  : 'Turn ON when you are ready to receive donation alerts.'}
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

        {/* Eligibility Status Banner */}
        {eligibility && (
          <Card style={styles.eligibilityCard}>
            <View style={styles.eligibilityRow}>
              <Ionicons
                name={isEligible ? 'checkmark-circle' : 'time'}
                size={22}
                color={isEligible ? colors.success : colors.warning}
              />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.eligibilityTitle}>
                  {isEligible ? 'Eligible to Donate' : 'Donation Gap Period'}
                </Text>
                <Text style={styles.eligibilityText}>
                  {isEligible
                    ? 'You can respond to incoming requests immediately.'
                    : `Next eligible date: ${eligibility.nextEligibleDate || 'In recovery'}`}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Stats Strip */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{incomingRequests.length}</Text>
            <Text style={styles.statLabel}>Pending Requests</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{historyCount}</Text>
            <Text style={styles.statLabel}>Lives Touched</Text>
          </Card>
        </View>

        {/* Incoming Requests Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Incoming Requests</Text>
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
            <Ionicons name="heart-outline" size={32} color={colors.primaryRed} />
            <Text style={styles.emptyTitle}>No Pending Requests Nearby</Text>
            <Text style={styles.emptySubtitle}>
              You will receive instant alerts when a patient in your locality requests {user?.bloodGroup || 'your'} blood.
            </Text>
          </Card>
        ) : (
          incomingRequests.slice(0, 3).map((req) => (
            <Card key={req.requestId || req.id} style={styles.requestCard}>
              <View style={styles.reqTopRow}>
                <View style={styles.bloodChip}>
                  <Text style={styles.bloodChipText}>{req.bloodGroup}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.reqPatientName}>
                    Patient: {req.patientName || 'Emergency Patient'}
                  </Text>
                  <Text style={styles.reqDistance}>
                    📍 {req.city || 'Bhopal'} {req.distanceKm ? `(~${req.distanceKm.toFixed(1)} km away)` : ''}
                  </Text>
                </View>
                <StatusBadge status={req.urgency || 'NORMAL'} size="sm" />
              </View>

              {req.message ? (
                <Text style={styles.reqMessage} numberOfLines={2}>
                  "{req.message}"
                </Text>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Requests')}
                style={styles.reviewBtn}
              >
                <Text style={styles.reviewBtnText}>Review & Respond</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primaryRed} />
              </TouchableOpacity>
            </Card>
          ))
        )}

        {/* Disclaimer Note */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            Direct peer-to-peer network. In a critical medical emergency, always call 112 or visit a trauma hospital.
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
    marginBottom: spacing.lg,
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
  bloodBadgeBox: {
    width: 48,
    height: 48,
    borderRadius: radii.circle,
    backgroundColor: colors.primaryRed,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.chip,
  },
  bloodBadgeText: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 18,
    color: '#FFFFFF',
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
  },
  eligibilityCard: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.borderPink,
    marginBottom: spacing.md,
  },
  eligibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eligibilityTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    color: colors.navyDark,
  },
  eligibilityText: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
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
  },
  statNumber: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 26,
    color: colors.primaryRed,
  },
  statLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
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
  emptyTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 15,
    color: colors.navyDark,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  requestCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  reqTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bloodChip: {
    width: 44,
    height: 44,
    borderRadius: radii.circle,
    backgroundColor: colors.pageBg,
    borderColor: colors.borderPink,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bloodChipText: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 15,
    color: colors.primaryRed,
  },
  reqPatientName: {
    fontFamily: fontFamilies.bold,
    fontSize: 15,
    color: colors.navyDark,
  },
  reqDistance: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  reqMessage: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.muted,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    gap: 4,
  },
  reviewBtnText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: colors.primaryRed,
  },
  disclaimerBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
  },
  disclaimerText: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default DonorHomeScreen;
