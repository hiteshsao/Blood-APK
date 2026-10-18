import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import recipientApi from '../../api/recipientApi';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import CustomButton from '../../components/CustomButton';
import Loader from '../../components/Loader';
import { formatTimeAgo } from '../../utils/formatters';

export const RecipientHomeScreen = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecipientData = useCallback(async () => {
    try {
      setError(null);
      const data = await recipientApi.getMyRequests();
      setRequests(data);
    } catch (err) {
      console.log('[RecipientHome Error]', err?.response?.data || err?.message);
      setError(err?.response?.data?.message || 'Failed to load requests.');
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
        {/* Top Header: Greeting & Role Badge */}
        <View style={styles.topBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingText}>Welcome,</Text>
            <Text style={styles.userNameText}>{user?.name || 'LifeDrop Friend'} 👋</Text>
            <Text style={styles.userCityText}>📍 {user?.city || 'Indore, MP'}</Text>
          </View>

          <View style={styles.roleBadgeBox}>
            <Text style={styles.roleBadgeText}>RECIPIENT</Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* 1. Large "Request Blood" Primary Card */}
        <Card style={styles.primaryRequestCard} variant="pink">
          <View style={styles.primaryRequestHeader}>
            <View style={styles.waterDropIconBox}>
              <Ionicons name="water" size={30} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.primaryRequestTitle}>Need Blood Urgently?</Text>
              <Text style={styles.primaryRequestSubtitle}>
                Zero intermediaries: Connect directly with nearby verified donors in minutes.
              </Text>
            </View>
          </View>

          <CustomButton
            title="Request Blood"
            icon={<Ionicons name="add-circle" size={20} color="#FFFFFF" />}
            onPress={() => navigation.navigate('CreateRequest', { urgency: 'NORMAL' })}
            variant="primary"
            style={styles.requestButton}
          />
        </Card>

        {/* 2. EMERGENCY SOS Button */}
        <View style={styles.sosSection}>
          <CustomButton
            title="EMERGENCY SOS REQUEST"
            onPress={() =>
              navigation.navigate('CreateRequest', {
                urgency: 'URGENT',
                prefillUnits: 2,
              })
            }
            variant="sos"
            style={styles.sosButton}
          />
          <Text style={styles.sosCaption}>
            ⚡ Immediately alerts all matching donors within 25 km with highest priority
          </Text>
        </View>

        {/* Explore Nearby Donors Quick Banner */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => navigation.navigate('NearbyDonors')}
          style={styles.mapBannerCard}
        >
          <View style={styles.mapBannerContent}>
            <View style={styles.mapIconCircle}>
              <Ionicons name="map" size={22} color={colors.primaryRed} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.mapBannerTitle}>Find Donors On Live Map</Text>
              <Text style={styles.mapBannerDesc}>
                View real-time compatible donors within 5 km, 10 km, or 25 km.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primaryRed} />
          </View>
        </TouchableOpacity>

        {/* 3. Latest Request Status Card */}
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
          <Loader message="Loading latest request status..." />
        ) : latestRequest ? (
          <Card
            style={styles.latestCard}
            onPress={() =>
              navigation.navigate('RequestStatus', { requestId: latestRequest.id })
            }
          >
            <View style={styles.latestCardTop}>
              <View style={styles.bloodCircle}>
                <Text style={styles.bloodCircleText}>{latestRequest.bloodGroup}</Text>
              </View>

              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.latestPatientName}>
                  Patient: {latestRequest.patientName}
                </Text>
                <Text style={styles.latestUnits}>
                  {latestRequest.unitsNeeded || 1} Unit(s) • 📍 {latestRequest.city || 'Indore'}
                </Text>
                <Text style={styles.latestTimeAgo}>
                  Created {formatTimeAgo(latestRequest.createdAt)}
                </Text>
              </View>

              <StatusBadge status={latestRequest.status} size="sm" />
            </View>

            {/* Accepted Donor Contact Info if Available */}
            {latestRequest.acceptedDonor ? (
              <View style={styles.acceptedDonorBox}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.donorNameText}>
                    Accepted by {latestRequest.acceptedDonor.name}
                  </Text>
                  <Text style={styles.donorPhoneText}>
                    📞 {latestRequest.acceptedDonor.phone || 'Phone number available'}
                  </Text>
                </View>

                {latestRequest.acceptedDonor.phone && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => Linking.openURL(`tel:${latestRequest.acceptedDonor.phone}`)}
                    style={styles.quickCallBtn}
                  >
                    <Ionicons name="call" size={15} color="#FFFFFF" />
                    <Text style={styles.quickCallText}>Call</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : latestRequest.status === 'PENDING' ? (
              <View style={styles.matchedCountBox}>
                <Ionicons name="radio-outline" size={16} color={colors.primaryRed} />
                <Text style={styles.matchedCountText}>
                  {latestRequest.matchedDonorCount != null
                    ? `${latestRequest.matchedDonorCount} nearby compatible donors notified.`
                    : 'Searching for nearby donors...'}
                </Text>
              </View>
            ) : null}

            <View style={styles.cardTrackFooter}>
              <Text style={styles.trackDetailsText}>View Live Timeline & Actions</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.primaryRed} />
            </View>
          </Card>
        ) : (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="medkit-outline" size={32} color={colors.primaryRed} />
            </View>
            <Text style={styles.emptyCardTitle}>No Active Blood Requests</Text>
            <Text style={styles.emptyCardDesc}>
              When you or a family member needs blood, tap "Request Blood" or "EMERGENCY SOS" above to broadcast an instant alert.
            </Text>
          </Card>
        )}

        {/* 4. Short "How It Works" Strip */}
        <Card style={styles.howItWorksCard}>
          <Text style={styles.howItWorksTitle}>How LifeDrop Works</Text>
          <Text style={styles.howItWorksSubtitle}>
            100% Direct Peer-to-Peer Blood Connection
          </Text>

          <View style={styles.stepsRow}>
            {/* Step 1 */}
            <View style={styles.stepItem}>
              <View style={styles.stepNumCircle}>
                <Text style={styles.stepNumText}>1</Text>
              </View>
              <Text style={styles.stepTitle}>Request</Text>
              <Text style={styles.stepDesc}>State blood type & location pin</Text>
            </View>

            <View style={styles.stepConnector} />

            {/* Step 2 */}
            <View style={styles.stepItem}>
              <View style={styles.stepNumCircle}>
                <Text style={styles.stepNumText}>2</Text>
              </View>
              <Text style={styles.stepTitle}>Alert</Text>
              <Text style={styles.stepDesc}>Eligible donors alerted nearby</Text>
            </View>

            <View style={styles.stepConnector} />

            {/* Step 3 */}
            <View style={styles.stepItem}>
              <View style={styles.stepNumCircle}>
                <Text style={styles.stepNumText}>3</Text>
              </View>
              <Text style={styles.stepTitle}>Connect</Text>
              <Text style={styles.stepDesc}>Donor accepts & coordinates</Text>
            </View>
          </View>

          <View style={styles.zeroIntermediariesStrip}>
            <Ionicons name="shield-checkmark" size={14} color={colors.muted} />
            <Text style={styles.zeroIntermediariesText}>
              Zero intermediaries: No hospitals, no blood banks, zero administrative fees.
            </Text>
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
    fontSize: 22,
    color: colors.navyDark,
    letterSpacing: -0.5,
  },
  userCityText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  roleBadgeBox: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  roleBadgeText: {
    fontFamily: fontFamilies.bold,
    fontSize: 11,
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.danger,
    marginLeft: 6,
    flex: 1,
  },
  primaryRequestCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  primaryRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  waterDropIconBox: {
    width: 52,
    height: 52,
    borderRadius: radii.button,
    backgroundColor: colors.primaryRed,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.redGlow,
  },
  primaryRequestTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 18,
    color: colors.navyDark,
    letterSpacing: -0.3,
  },
  primaryRequestSubtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.muted,
    marginTop: 3,
    lineHeight: 18,
  },
  requestButton: {
    marginTop: 2,
  },
  sosSection: {
    marginBottom: spacing.md,
  },
  sosButton: {
    ...shadows.sosGlow,
  },
  sosCaption: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.primaryDark,
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: -0.1,
  },
  mapBannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderPink,
    ...shadows.cardSoft,
  },
  mapBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF1F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapBannerTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    color: colors.navyDark,
  },
  mapBannerDesc: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 17,
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
    marginBottom: spacing.md,
  },
  latestCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bloodCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryRed,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.redGlow,
  },
  bloodCircleText: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  latestPatientName: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 15,
    color: colors.navyDark,
  },
  latestUnits: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  latestTimeAgo: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: colors.lightMuted,
    marginTop: 1,
  },
  acceptedDonorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: spacing.md,
    borderRadius: radii.sm,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
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
    marginTop: 1,
  },
  quickCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
  },
  quickCallText: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  matchedCountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F1',
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginTop: spacing.md,
  },
  matchedCountText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.primaryRed,
    marginLeft: 6,
  },
  cardTrackFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  trackDetailsText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: colors.primaryRed,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF1F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyCardTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 16,
    color: colors.navyDark,
    marginBottom: spacing.xs,
  },
  emptyCardDesc: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  howItWorksCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  howItWorksTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 16,
    color: colors.navyDark,
  },
  howItWorksSubtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.primaryRed,
    marginBottom: spacing.lg,
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
  stepNumCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryRed,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepNumText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  stepTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: colors.navyDark,
    marginBottom: 2,
  },
  stepDesc: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 14,
  },
  stepConnector: {
    width: 16,
    height: 2,
    backgroundColor: colors.borderPink,
    marginTop: 14,
  },
  zeroIntermediariesStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginTop: spacing.lg,
  },
  zeroIntermediariesText: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: colors.muted,
    marginLeft: 6,
    flex: 1,
  },
});

export default RecipientHomeScreen;
