import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import recipientApi from '../../api/recipientApi';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import ScreenHeader from '../../components/ScreenHeader';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import CustomButton from '../../components/CustomButton';
import Loader from '../../components/Loader';
import { formatDate, formatTimeAgo } from '../../utils/formatters';

export const RequestStatusScreen = ({ route, navigation }) => {
  const { requestId } = route.params || {};

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetails = useCallback(async () => {
    if (!requestId) return;
    try {
      setError(null);
      const data = await recipientApi.getRequestDetails(requestId);
      setRequest(data);
    } catch (err) {
      console.log('[Fetch RequestStatus Error]', err?.response?.data || err?.message);
      setError(err?.response?.data?.message || 'Failed to load request status.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetails();
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Blood Request?',
      'Are you sure you want to cancel this request? Any pending notifications to donors will be stopped.',
      [
        { text: 'Keep Active', style: 'cancel' },
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: async () => {
            try {
              setActing(true);
              const cancelled = await recipientApi.cancelRequest(requestId);
              setRequest(cancelled);
              Alert.alert('Request Cancelled', 'Your blood request has been cancelled.');
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to cancel request.');
            } finally {
              setActing(false);
            }
          },
        },
      ]
    );
  };

  const handleComplete = () => {
    const donorName = request?.acceptedDonor?.name || 'the donor';
    Alert.alert(
      'Mark Blood Donation Completed? 🩸',
      `Did ${donorName} complete the blood donation? Marking as completed will update the donor's 90-day recovery record in the system.`,
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Yes, Completed!',
          style: 'default',
          onPress: async () => {
            try {
              setActing(true);
              const completed = await recipientApi.completeRequest(requestId);
              setRequest(completed);
              Alert.alert('Thank You! 🎉', 'Blood donation marked as completed. You saved a life!');
            } catch (err) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to complete request.');
            } finally {
              setActing(false);
            }
          },
        },
      ]
    );
  };

  const handleCall = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (phone, donorName) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hello ${donorName || ''}, thank you for accepting my blood donation request on LifeDrop! I am reaching out to coordinate location details.`
    );
    const waUrl = `whatsapp://send?phone=${cleanPhone}&text=${message}`;

    Linking.canOpenURL(waUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(waUrl);
        } else {
          Linking.openURL(`https://wa.me/${cleanPhone}?text=${message}`);
        }
      })
      .catch(() => {
        Linking.openURL(`https://wa.me/${cleanPhone}?text=${message}`);
      });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title="Request Status" showBack onBack={() => navigation.goBack()} />
        <Loader message="Loading live request timeline..." fullScreen />
      </SafeAreaView>
    );
  }

  if (error || !request) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title="Request Status" showBack onBack={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <Text style={styles.errorTitle}>Could not load request</Text>
          <Text style={styles.errorDesc}>{error || 'Request not found.'}</Text>
          <CustomButton
            title="Try Again"
            onPress={fetchDetails}
            variant="secondary"
            style={{ marginTop: spacing.md }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const isPending = request.status === 'PENDING';
  const isAccepted = request.status === 'ACCEPTED';
  const isCompleted = request.status === 'COMPLETED';
  const isCancelled = request.status === 'CANCELLED';

  const matchedCount = request.matchedDonorCount != null ? request.matchedDonorCount : 0;
  const acceptedDonor = request.acceptedDonor;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Live Request Status"
        subtitle={`Request #${requestId} • ${request.city || 'Indore'}`}
        showBack
        onBack={() => navigation.goBack()}
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
        {/* Top Request Summary Card */}
        <Card style={styles.summaryCard} variant="highlight">
          <View style={styles.summaryTopRow}>
            <View style={styles.bloodCircleLarge}>
              <Text style={styles.bloodCircleTextLarge}>{request.bloodGroup}</Text>
            </View>

            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.patientName}>{request.patientName}</Text>
              <Text style={styles.unitsSubtitle}>
                {request.unitsNeeded || 1} Unit(s) Needed • 📍 {request.city || 'Indore'}
              </Text>
              <Text style={styles.postedTime}>
                Created {formatTimeAgo(request.createdAt)}
              </Text>
            </View>

            <StatusBadge status={request.status} size="md" />
          </View>

          {request.message ? (
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>"{request.message}"</Text>
            </View>
          ) : null}
        </Card>

        {/* Number of Donors Notified Banner */}
        <Card style={styles.broadcastBanner}>
          <View style={styles.broadcastIconBox}>
            <Ionicons name="radio" size={24} color={colors.primaryRed} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.broadcastTitle}>
              {isPending
                ? `${matchedCount} Compatible Donors Notified`
                : isAccepted
                ? 'Donor Connected & Ready'
                : isCompleted
                ? 'Donation Finished Successfully'
                : 'Broadcast Stopped'}
            </Text>
            <Text style={styles.broadcastDesc}>
              Search Radius: {request.radiusKm || 10} km • Urgency:{' '}
              {request.urgency || 'NORMAL'}
            </Text>
          </View>
        </Card>

        {/* Accepted Donor Connected Card (When status === 'ACCEPTED') */}
        {isAccepted && acceptedDonor && (
          <Card style={styles.acceptedDonorCard}>
            <View style={styles.acceptedDonorHeader}>
              <Ionicons name="checkmark-circle" size={26} color={colors.success} />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.acceptedDonorTitle}>Donor Accepted! 🎉</Text>
                <Text style={styles.acceptedDonorSubtitle}>
                  Please call the donor immediately to coordinate meeting location.
                </Text>
              </View>
            </View>

            <View style={styles.donorDetailsRow}>
              <View style={styles.donorField}>
                <Text style={styles.donorFieldLabel}>DONOR NAME</Text>
                <Text style={styles.donorFieldValue}>{acceptedDonor.name}</Text>
              </View>

              <View style={styles.donorField}>
                <Text style={styles.donorFieldLabel}>BLOOD GROUP</Text>
                <Text style={[styles.donorFieldValue, { color: colors.primaryRed }]}>
                  {acceptedDonor.bloodGroup}
                </Text>
              </View>

              <View style={styles.donorField}>
                <Text style={styles.donorFieldLabel}>CITY</Text>
                <Text style={styles.donorFieldValue}>{acceptedDonor.city || 'Indore'}</Text>
              </View>
            </View>

            <View style={styles.phoneDisplayBox}>
              <Text style={styles.phoneLabel}>DIRECT CONTACT NUMBER</Text>
              <Text style={styles.phoneValue}>{acceptedDonor.phone || 'Phone number shared'}</Text>
            </View>

            {/* Direct Call & WhatsApp Buttons */}
            {acceptedDonor.phone && (
              <View style={styles.contactButtonsRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleCall(acceptedDonor.phone)}
                  style={[styles.contactBtn, styles.callBtn]}
                >
                  <Ionicons name="call" size={18} color="#FFFFFF" />
                  <Text style={styles.contactBtnText}>Call Donor</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleWhatsApp(acceptedDonor.phone, acceptedDonor.name)}
                  style={[styles.contactBtn, styles.whatsappBtn]}
                >
                  <MaterialCommunityIcons name="whatsapp" size={20} color="#FFFFFF" />
                  <Text style={styles.contactBtnText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* "Mark as Completed" button */}
            <CustomButton
              title="Mark Donation as Completed"
              icon={<Ionicons name="checkmark-done" size={20} color="#FFFFFF" />}
              onPress={handleComplete}
              loading={acting}
              variant="primary"
              style={styles.markCompleteBtn}
            />
          </Card>
        )}

        {/* Completed Celebration Card */}
        {isCompleted && (
          <Card style={styles.completedCard}>
            <View style={styles.completedIconCircle}>
              <Ionicons name="heart" size={32} color={colors.primaryRed} />
            </View>
            <Text style={styles.completedHeading}>Donation Completed! ❤️</Text>
            <Text style={styles.completedSubheading}>
              {acceptedDonor?.name ? `Donor ${acceptedDonor.name} completed the blood donation.` : 'The donation was completed.'}{' '}
              A life was saved with zero intermediaries. Thank you for using LifeDrop!
            </Text>
          </Card>
        )}

        {/* 4-Step Timeline Component */}
        <Card style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Status Timeline</Text>

          <View style={styles.timelineContainer}>
            {/* Step 1: Request Sent */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicatorColumn}>
                <View style={[styles.timelineDot, styles.timelineDotComplete]}>
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </View>
                <View style={[styles.timelineLine, styles.timelineLineComplete]} />
              </View>

              <View style={styles.timelineContent}>
                <Text style={styles.timelineStepTitle}>1. Request Broadcasted</Text>
                <Text style={styles.timelineStepDesc}>
                  Request registered on LifeDrop P2P network.
                </Text>
                <Text style={styles.timelineStepTime}>
                  {request.createdAt ? formatDate(request.createdAt) : 'Recently'}
                </Text>
              </View>
            </View>

            {/* Step 2: Donors Notified */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicatorColumn}>
                <View
                  style={[
                    styles.timelineDot,
                    matchedCount > 0 ? styles.timelineDotComplete : styles.timelineDotActive,
                  ]}
                >
                  <Ionicons
                    name={matchedCount > 0 ? 'checkmark' : 'radio'}
                    size={14}
                    color="#FFFFFF"
                  />
                </View>
                <View
                  style={[
                    styles.timelineLine,
                    (isAccepted || isCompleted) && styles.timelineLineComplete,
                  ]}
                />
              </View>

              <View style={styles.timelineContent}>
                <Text style={styles.timelineStepTitle}>2. Donors Notified</Text>
                <Text style={styles.timelineStepDesc}>
                  {matchedCount > 0
                    ? `${matchedCount} compatible nearby donors alerted.`
                    : 'Searching for available donors within radius.'}
                </Text>
              </View>
            </View>

            {/* Step 3: Donor Accepted */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicatorColumn}>
                <View
                  style={[
                    styles.timelineDot,
                    (isAccepted || isCompleted)
                      ? styles.timelineDotComplete
                      : isPending
                      ? styles.timelineDotPending
                      : styles.timelineDotCancelled,
                  ]}
                >
                  <Ionicons
                    name={
                      (isAccepted || isCompleted)
                        ? 'checkmark'
                        : isCancelled
                        ? 'close'
                        : 'time-outline'
                    }
                    size={14}
                    color="#FFFFFF"
                  />
                </View>
                <View
                  style={[
                    styles.timelineLine,
                    isCompleted && styles.timelineLineComplete,
                  ]}
                />
              </View>

              <View style={styles.timelineContent}>
                <Text style={styles.timelineStepTitle}>3. Donor Accepted</Text>
                <Text style={styles.timelineStepDesc}>
                  {isAccepted
                    ? `${acceptedDonor?.name || 'A donor'} accepted this request! Contact details exchanged.`
                    : isCompleted
                    ? `Accepted by ${acceptedDonor?.name || 'donor'}.`
                    : isCancelled
                    ? 'Request cancelled before acceptance.'
                    : 'Awaiting first donor response (first to accept connects).'}
                </Text>
              </View>
            </View>

            {/* Step 4: Completed */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicatorColumn}>
                <View
                  style={[
                    styles.timelineDot,
                    isCompleted
                      ? styles.timelineDotComplete
                      : styles.timelineDotPending,
                  ]}
                >
                  <Ionicons
                    name={isCompleted ? 'heart' : 'heart-outline'}
                    size={14}
                    color="#FFFFFF"
                  />
                </View>
              </View>

              <View style={styles.timelineContent}>
                <Text style={styles.timelineStepTitle}>4. Donation Completed</Text>
                <Text style={styles.timelineStepDesc}>
                  {isCompleted
                    ? 'Donation confirmed. Donor recovery gap started.'
                    : 'Recipient marks completed after blood is provided.'}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Cancel Button while PENDING */}
        {isPending && (
          <View style={styles.cancelSection}>
            <CustomButton
              title="Cancel Blood Request"
              onPress={handleCancel}
              loading={acting}
              variant="outline"
              style={styles.cancelBtn}
              textStyle={{ color: colors.danger }}
            />
            <Text style={styles.cancelNotice}>
              Cancel only if you no longer require blood or have arranged it elsewhere.
            </Text>
          </View>
        )}

        {/* Live Refresh Hint */}
        <View style={styles.refreshHintRow}>
          <Ionicons name="refresh-circle-outline" size={16} color={colors.muted} />
          <Text style={styles.refreshHintText}>
            Pull down to refresh and track donor updates in real time.
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
    paddingBottom: spacing.xxxl,
  },
  summaryCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bloodCircleLarge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primaryRed,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.redGlow,
  },
  bloodCircleTextLarge: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 20,
    color: '#FFFFFF',
  },
  patientName: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 17,
    color: colors.navyDark,
  },
  unitsSubtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  postedTime: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: colors.lightMuted,
    marginTop: 1,
  },
  messageBox: {
    backgroundColor: '#F8FAFC',
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginTop: spacing.md,
  },
  messageText: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    color: colors.navyDark,
    fontStyle: 'italic',
  },
  broadcastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F1',
    borderColor: colors.borderPink,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  broadcastIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.cardSoft,
  },
  broadcastTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    color: colors.primaryDark,
  },
  broadcastDesc: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  acceptedDonorCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1.5,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  acceptedDonorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  acceptedDonorTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 16,
    color: '#15803D',
  },
  acceptedDonorSubtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: '#166534',
    marginTop: 1,
  },
  donorDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
  },
  donorField: {
    flex: 1,
  },
  donorFieldLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 0.5,
  },
  donorFieldValue: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 13,
    color: colors.navyDark,
    marginTop: 2,
  },
  phoneDisplayBox: {
    backgroundColor: '#FFFFFF',
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  phoneLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 0.5,
  },
  phoneValue: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 18,
    color: '#15803D',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radii.button,
  },
  callBtn: {
    backgroundColor: colors.success,
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
  },
  contactBtnText: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
  },
  markCompleteBtn: {
    marginTop: spacing.xs,
  },
  completedCard: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    marginBottom: spacing.md,
  },
  completedIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF1F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  completedHeading: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 18,
    color: colors.navyDark,
    marginBottom: spacing.xs,
  },
  completedSubheading: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  timelineCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  timelineTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 16,
    color: colors.navyDark,
    marginBottom: spacing.lg,
  },
  timelineContainer: {
    paddingLeft: spacing.xs,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 64,
  },
  timelineIndicatorColumn: {
    alignItems: 'center',
    width: 28,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDotComplete: {
    backgroundColor: colors.success,
  },
  timelineDotActive: {
    backgroundColor: colors.primaryRed,
  },
  timelineDotPending: {
    backgroundColor: '#CBD5E1',
  },
  timelineDotCancelled: {
    backgroundColor: colors.danger,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  timelineLineComplete: {
    backgroundColor: colors.success,
  },
  timelineContent: {
    flex: 1,
    marginLeft: spacing.md,
    paddingBottom: spacing.lg,
  },
  timelineStepTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    color: colors.navyDark,
  },
  timelineStepDesc: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    lineHeight: 16,
  },
  timelineStepTime: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: colors.lightMuted,
    marginTop: 2,
  },
  cancelSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  cancelBtn: {
    borderColor: colors.danger,
  },
  cancelNotice: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 6,
  },
  refreshHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  refreshHintText: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.muted,
    marginLeft: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 18,
    color: colors.navyDark,
    marginTop: spacing.md,
  },
  errorDesc: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default RequestStatusScreen;
