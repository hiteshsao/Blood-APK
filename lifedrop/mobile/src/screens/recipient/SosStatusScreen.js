import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import recipientApi from '../../api/recipientApi';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import ScreenHeader from '../../components/ScreenHeader';
import NotificationBell from '../../components/NotificationBell';
import { formatPhone, formatTimeAgo } from '../../utils/formatters';

export const SosStatusScreen = ({ route, navigation }) => {
  const { requestId, donorsNotified: initialNotified, radiusKm: initialRadius } = route.params || {};

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Animation values for radar pulses
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim3 = useRef(new Animated.Value(0)).current;

  // Start continuous radar pulse animation
  useEffect(() => {
    const createPulse = (anim, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const a1 = createPulse(pulseAnim1, 0);
    const a2 = createPulse(pulseAnim2, 800);
    const a3 = createPulse(pulseAnim3, 1600);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [pulseAnim1, pulseAnim2, pulseAnim3]);

  // Fetch request details
  const fetchDetails = useCallback(async (isSilent = false) => {
    if (!requestId) return;
    try {
      if (!isSilent) setError(null);
      const data = await recipientApi.getRequestDetails(requestId);
      setRequest(data);
    } catch (err) {
      if (!isSilent) {
        setError(err?.response?.data?.message || 'Failed to load SOS status.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [requestId]);

  // Initial fetch and 10-second polling interval
  useEffect(() => {
    fetchDetails(false);

    // Live status polling every 10 seconds
    const interval = setInterval(() => {
      fetchDetails(true);
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchDetails]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetails(false);
  };

  const handleCancelSos = () => {
    Alert.alert(
      'Cancel Emergency SOS',
      'Are you sure you want to cancel this emergency SOS broadcast? Notified donors will be alerted that the request is no longer needed.',
      [
        { text: 'Keep Active', style: 'cancel' },
        {
          text: 'Cancel SOS',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              const updated = await recipientApi.cancelRequest(requestId);
              setRequest(updated);
              Alert.alert('SOS Cancelled', 'The emergency SOS broadcast has been cancelled.');
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to cancel SOS.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleCompleteRequest = async () => {
    Alert.alert(
      'Confirm Donation Complete',
      'Has the donor arrived and completed the blood donation?',
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Confirm Donation',
          onPress: async () => {
            try {
              setCompleting(true);
              const updated = await recipientApi.completeRequest(requestId);
              setRequest(updated);
              Alert.alert('Thank You!', 'Blood donation completed. The donor has been credited.');
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to complete request.');
            } finally {
              setCompleting(false);
            }
          },
        },
      ]
    );
  };

  const donorsCount = request?.matchedDonorCount ?? initialNotified ?? 0;
  const radius = request?.radiusKm ?? initialRadius ?? 25;
  const status = request?.status || 'PENDING';
  const isAccepted = status === 'ACCEPTED' || status === 'COMPLETED';
  const isCompleted = status === 'COMPLETED';
  const isCancelled = status === 'CANCELLED';

  const acceptedDonor = request?.acceptedDonor;
  const donorPhone = acceptedDonor?.phone;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Emergency SOS"
        subtitle={`Request #${requestId || '...'} • Live Broadcast`}
        showBack={true}
        onBack={() => navigation.goBack()}
        rightComponent={<NotificationBell />}
      />

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
        {/* Top Emergency Status Card with Pulsing Radar */}
        <View style={styles.radarCard}>
          <View style={styles.radarWrapper}>
            {!isAccepted && !isCancelled && (
              <>
                <Animated.View
                  style={[
                    styles.radarRing,
                    {
                      transform: [
                        {
                          scale: pulseAnim1.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 2.6],
                          }),
                        },
                      ],
                      opacity: pulseAnim1.interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [0.7, 0.3, 0],
                      }),
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.radarRing,
                    {
                      transform: [
                        {
                          scale: pulseAnim2.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 2.6],
                          }),
                        },
                      ],
                      opacity: pulseAnim2.interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [0.7, 0.3, 0],
                      }),
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.radarRing,
                    {
                      transform: [
                        {
                          scale: pulseAnim3.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 2.6],
                          }),
                        },
                      ],
                      opacity: pulseAnim3.interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [0.7, 0.3, 0],
                      }),
                    },
                  ]}
                />
              </>
            )}

            {/* Center Circle */}
            <View
              style={[
                styles.radarCenter,
                isAccepted && styles.radarCenterAccepted,
                isCancelled && styles.radarCenterCancelled,
              ]}
            >
              {isAccepted ? (
                <Ionicons name="checkmark-sharp" size={38} color="#FFFFFF" />
              ) : isCancelled ? (
                <Ionicons name="close-outline" size={38} color="#FFFFFF" />
              ) : (
                <MaterialCommunityIcons name="broadcast" size={38} color="#FFFFFF" />
              )}
            </View>
          </View>

          {/* Status Headline */}
          <Text style={styles.statusTitle}>
            {isAccepted
              ? 'Donor Accepted & En Route!'
              : isCancelled
              ? 'Emergency SOS Cancelled'
              : 'Broadcasting Emergency SOS'}
          </Text>

          <Text style={styles.statusSubtitle}>
            {isAccepted
              ? 'A volunteer donor has answered your emergency request. Contact them immediately below.'
              : isCancelled
              ? 'This alert was cancelled. You can create a new request if needed.'
              : `Searching live within ${radius} km. Auto-updating every 10 seconds...`}
          </Text>

          {/* Donors Notified Counter Badge */}
          <View style={styles.donorsNotifiedBox}>
            <View style={styles.donorsNotifiedIcon}>
              <Ionicons name="people" size={18} color={colors.primaryRed} />
            </View>
            <View style={styles.donorsNotifiedTextCol}>
              <Text style={styles.donorsNotifiedCount}>
                {donorsCount} Donors Notified
              </Text>
              <Text style={styles.donorsNotifiedDesc}>
                {radius} km urgent broadcast • High-priority alert sent
              </Text>
            </View>
          </View>
        </View>

        {/* ACCEPTED DONOR CARD */}
        {isAccepted && acceptedDonor ? (
          <View style={styles.acceptedDonorCard}>
            <View style={styles.donorHeaderRow}>
              <View style={styles.donorAvatar}>
                <Ionicons name="person" size={26} color="#FFFFFF" />
              </View>

              <View style={styles.donorDetails}>
                <View style={styles.verifiedRow}>
                  <Text style={styles.donorName}>{acceptedDonor.name}</Text>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} style={{ marginLeft: 4 }} />
                </View>
                <Text style={styles.donorBloodGroup}>
                  Blood Group: {acceptedDonor.bloodGroup?.replace('_POSITIVE', '+').replace('_NEGATIVE', '-') || request?.bloodGroup}
                </Text>
                {donorPhone && (
                  <Text style={styles.donorPhoneText}>
                    📞 {formatPhone(donorPhone)}
                  </Text>
                )}
              </View>
            </View>

            {/* Big Green 1-Tap Call Button */}
            {donorPhone ? (
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => Linking.openURL(`tel:${donorPhone}`)}
                style={styles.callDonorButton}
              >
                <Ionicons name="call" size={20} color="#FFFFFF" />
                <Text style={styles.callDonorButtonText}>
                  CALL {acceptedDonor.name.toUpperCase()} NOW
                </Text>
              </TouchableOpacity>
            ) : null}

            {!isCompleted && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleCompleteRequest}
                disabled={completing}
                style={styles.completeButton}
              >
                <Ionicons name="shield-checkmark" size={18} color={colors.success} />
                <Text style={styles.completeButtonText}>
                  Confirm Blood Donation Completed
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {/* SOS Details Card */}
        {request && (
          <View style={styles.detailsCard}>
            <Text style={styles.detailsHeader}>Emergency Alert Details</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Patient Name:</Text>
              <Text style={styles.detailValue}>{request.patientName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Blood Group Needed:</Text>
              <View style={styles.bloodBadge}>
                <Text style={styles.bloodBadgeText}>{request.bloodGroup}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location / City:</Text>
              <Text style={styles.detailValue}>{request.city || 'Indore'}</Text>
            </View>

            {request.message ? (
              <View style={styles.noteBox}>
                <Text style={styles.noteTitle}>Emergency Notes / Landmark:</Text>
                <Text style={styles.noteText}>{request.message}</Text>
              </View>
            ) : null}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time Created:</Text>
              <Text style={styles.detailValue}>{formatTimeAgo(request.createdAt)}</Text>
            </View>
          </View>
        )}

        {/* National Emergency Services Buttons (ALWAYS SHOWN) */}
        <View style={styles.emergencyCallSection}>
          <Text style={styles.emergencySectionTitle}>
            Emergency Helpline Direct Calling:
          </Text>

          <View style={styles.emergencyGrid}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => Linking.openURL('tel:112')}
              style={styles.national112Btn}
            >
              <Ionicons name="call" size={20} color="#FFFFFF" />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.emergencyBtnTitle}>Call 112</Text>
                <Text style={styles.emergencyBtnSub}>National Emergency</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => Linking.openURL('tel:108')}
              style={styles.ambulance108Btn}
            >
              <MaterialCommunityIcons name="ambulance" size={22} color="#FFFFFF" />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.emergencyBtnTitle}>Call 108</Text>
                <Text style={styles.emergencyBtnSub}>Ambulance Service</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mandatory Medical Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <Ionicons name="information-circle" size={18} color="#B91C1C" />
          <Text style={styles.disclaimerText}>
            LifeDrop connects donors and recipients. In a medical emergency, contact a hospital or call 112.
          </Text>
        </View>

        {/* Cancel Action */}
        {!isAccepted && !isCancelled && !isCompleted && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleCancelSos}
            disabled={cancelling}
            style={styles.cancelButton}
          >
            <Feather name="x-circle" size={16} color={colors.danger} />
            <Text style={styles.cancelButtonText}>Cancel Emergency SOS</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  radarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.card,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    ...shadows.soft,
  },
  radarWrapper: {
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  radarRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2.5,
    borderColor: '#DC2626',
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
  },
  radarCenter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primaryRed,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.elevated,
  },
  radarCenterAccepted: {
    backgroundColor: colors.success,
  },
  radarCenterCancelled: {
    backgroundColor: colors.lightMuted,
  },
  statusTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 20,
    color: colors.navyDark,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  statusSubtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: spacing.sm,
  },
  donorsNotifiedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.lg,
    width: '100%',
  },
  donorsNotifiedIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  donorsNotifiedTextCol: {
    flex: 1,
  },
  donorsNotifiedCount: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 15,
    color: '#991B1B',
  },
  donorsNotifiedDesc: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    color: '#B91C1C',
  },
  acceptedDonorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 5,
    borderLeftColor: colors.success,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    ...shadows.soft,
  },
  donorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  donorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  donorDetails: {
    flex: 1,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  donorName: {
    fontFamily: fontFamilies.bold,
    fontSize: 17,
    color: colors.navyDark,
  },
  donorBloodGroup: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
    color: colors.primaryRed,
    marginTop: 2,
  },
  donorPhoneText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: '#1E293B',
    marginTop: 2,
  },
  callDonorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    ...shadows.soft,
  },
  callDonorButtonText: {
    color: '#FFFFFF',
    fontFamily: fontFamilies.extraBold,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: spacing.sm,
    gap: 6,
  },
  completeButtonText: {
    color: '#15803D',
    fontFamily: fontFamilies.bold,
    fontSize: 13,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.soft,
  },
  detailsHeader: {
    fontFamily: fontFamilies.bold,
    fontSize: 15,
    color: colors.navyDark,
    marginBottom: spacing.sm,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    color: colors.muted,
  },
  detailValue: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: colors.navyDark,
  },
  bloodBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bloodBadgeText: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 12,
    color: colors.primaryRed,
  },
  noteBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: spacing.sm,
    marginVertical: 6,
  },
  noteTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 11,
    color: colors.muted,
    marginBottom: 2,
  },
  noteText: {
    fontFamily: fontFamilies.regular,
    fontSize: 12.5,
    color: colors.navyDark,
  },
  emergencyCallSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  emergencySectionTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    color: '#991B1B',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emergencyGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  national112Btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    ...shadows.soft,
  },
  ambulance108Btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#991B1B',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    ...shadows.soft,
  },
  emergencyBtnTitle: {
    color: '#FFFFFF',
    fontFamily: fontFamilies.extraBold,
    fontSize: 14,
  },
  emergencyBtnSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: fontFamilies.medium,
    fontSize: 10,
  },
  disclaimerContainer: {
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
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 6,
  },
  cancelButtonText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: colors.danger,
  },
});

export default SosStatusScreen;
