import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import requestApi from '../../api/requestApi';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import ScreenHeader from '../../components/ScreenHeader';
import CustomButton from '../../components/CustomButton';
import Loader from '../../components/Loader';
import { formatDistance, formatTimeAgo, formatDate } from '../../utils/formatters';

export const RequestDetailScreen = ({ route, navigation }) => {
  const { requestId } = route.params || {};

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [acceptedData, setAcceptedData] = useState(null);
  const [error, setError] = useState(null);

  const fetchDetails = useCallback(async () => {
    if (!requestId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await requestApi.getRequestDetails(requestId);
      setRequest(data);

      if (data?.recipientPhone) {
        setAcceptedData({
          recipientFirstName: data.recipientFirstName,
          recipientPhone: data.recipientPhone,
        });
      }
    } catch (err) {
      console.log('[Fetch Detail Error]', err?.response?.data || err?.message);
      setError(err?.response?.data?.message || 'Failed to load request details.');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleAccept = () => {
    Alert.alert(
      'Accept Blood Donation Request?',
      `Are you ready to donate ${request?.bloodGroup} blood for patient "${request?.patientName || 'Emergency Patient'}"? Once accepted, your contact details will be shared with the recipient.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Accept',
          style: 'default',
          onPress: async () => {
            try {
              setActing(true);
              const res = await requestApi.acceptRequest(requestId);
              setAcceptedData(res);
              // Refresh details to update state
              fetchDetails();

              Alert.alert(
                'Request Accepted! 🎉',
                `Thank you for being a life saver! You can now call or WhatsApp ${res?.recipientFirstName || 'the recipient'}.`
              );
            } catch (err) {
              if (err?.response?.status === 409) {
                Alert.alert(
                  'Another Donor Already Accepted',
                  'Another generous donor just accepted this request moments ago. Thank you for your readiness to save a life!',
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
              } else {
                const msg = err?.response?.data?.message || 'Failed to accept request.';
                Alert.alert('Error', msg);
              }
            } finally {
              setActing(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = () => {
    Alert.alert(
      'Decline Blood Request?',
      'You will not see this request in your pending queue anymore.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              setActing(true);
              await requestApi.rejectRequest(requestId);
              Alert.alert('Request Declined', 'You have declined this request.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err) {
              Alert.alert('Error', 'Failed to decline request.');
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

  const handleWhatsApp = (phone, recipientName) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hello ${recipientName || ''}, I accepted your blood donation request for ${request?.bloodGroup || ''} on LifeDrop. I am ready to coordinate.`
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
        <ScreenHeader title="Request Details" showBack onBack={() => navigation.goBack()} />
        <Loader message="Loading blood request details..." fullScreen />
      </SafeAreaView>
    );
  }

  if (error || !request) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title="Request Details" showBack onBack={() => navigation.goBack()} />
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

  const isAccepted =
    request.status === 'ACCEPTED' ||
    request.status === 'COMPLETED' ||
    !!acceptedData?.recipientPhone ||
    request.myResponseStatus === 'ACCEPTED';

  const recipientPhone = acceptedData?.recipientPhone || request.recipientPhone;
  const recipientName =
    acceptedData?.recipientFirstName || request.recipientFirstName || 'Recipient';

  // Default coordinate for map preview (Bhopal center fallback)
  const mapLat = request.latitude || 23.2599;
  const mapLng = request.longitude || 77.4126;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Blood Request Details"
        subtitle={`ID: #${requestId} • ${request.city || 'Nearby'}`}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Status & Patient Card */}
        <Card style={styles.heroCard} variant="highlight">
          <View style={styles.heroTopRow}>
            <View style={styles.bloodBadgeLarge}>
              <Text style={styles.bloodBadgeTextLarge}>{request.bloodGroup}</Text>
            </View>

            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.patientName}>{request.patientName || 'Emergency Patient'}</Text>
              <Text style={styles.unitsNeeded}>
                {request.unitsNeeded || 1} Unit(s) • Needed Urgently
              </Text>
              <Text style={styles.timeAgoText}>
                Posted {formatTimeAgo(request.createdAt)}
              </Text>
            </View>

            <StatusBadge status={request.urgency || 'NORMAL'} size="md" />
          </View>
        </Card>

        {/* Accepted Contact Information Banner */}
        {isAccepted && recipientPhone ? (
          <Card style={styles.acceptedContactCard}>
            <View style={styles.acceptedHeaderRow}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.acceptedTitle}>You Accepted This Request! 🎉</Text>
                <Text style={styles.acceptedSubtitle}>
                  Contact {recipientName} directly to coordinate hospital location.
                </Text>
              </View>
            </View>

            <View style={styles.phoneDisplayBox}>
              <Text style={styles.phoneLabel}>RECIPIENT CONTACT</Text>
              <Text style={styles.phoneNumberText}>{recipientPhone}</Text>
            </View>

            <View style={styles.actionContactRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleCall(recipientPhone)}
                style={[styles.contactBtn, styles.callBtn]}
              >
                <Ionicons name="call" size={18} color="#FFFFFF" />
                <Text style={styles.contactBtnText}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleWhatsApp(recipientPhone, recipientName)}
                style={[styles.contactBtn, styles.whatsappBtn]}
              >
                <MaterialCommunityIcons name="whatsapp" size={20} color="#FFFFFF" />
                <Text style={styles.contactBtnText}>WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : null}

        {/* Details List */}
        <Card style={styles.detailsCard}>
          <Text style={styles.sectionHeaderTitle}>Donation Overview</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Ionicons name="location-outline" size={18} color={colors.primaryRed} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Location & Distance</Text>
              <Text style={styles.detailValue}>
                {request.city || 'Bhopal'}
                {request.distanceKm != null ? ` (${formatDistance(request.distanceKm)})` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Ionicons name="water-outline" size={18} color={colors.primaryRed} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Units Required</Text>
              <Text style={styles.detailValue}>{request.unitsNeeded || 1} Unit(s)</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Ionicons name="time-outline" size={18} color={colors.primaryRed} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Required By</Text>
              <Text style={styles.detailValue}>
                {request.requiredBy ? formatDate(request.requiredBy) : 'As soon as possible'}
              </Text>
            </View>
          </View>

          {request.message ? (
            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primaryRed} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Patient Room / Note</Text>
                <Text style={styles.messageNoteText}>"{request.message}"</Text>
              </View>
            </View>
          ) : null}
        </Card>

        {/* Map Preview of Recipient Vicinity */}
        <Card style={styles.mapCard}>
          <Text style={styles.sectionHeaderTitle}>Approximate Location</Text>
          <Text style={styles.mapSubtitle}>
            Privacy Protected: exact coordinates revealed only after mutual confirmation.
          </Text>

          <View style={styles.mapWrapper}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: mapLat,
                longitude: mapLng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Circle
                center={{ latitude: mapLat, longitude: mapLng }}
                radius={1200}
                fillColor="rgba(220, 38, 38, 0.18)"
                strokeColor="#DC2626"
                strokeWidth={1.5}
              />
              <Marker
                coordinate={{ latitude: mapLat, longitude: mapLng }}
                title={request.city || 'Recipient Location'}
                description="Approximate vicinity"
              />
            </MapView>
          </View>
        </Card>

        {/* Action Buttons if not accepted yet */}
        {!isAccepted && request.status === 'PENDING' && (
          <View style={styles.actionContainer}>
            <CustomButton
              title="Accept & Connect"
              onPress={handleAccept}
              loading={acting}
              variant="primary"
              style={styles.acceptPrimaryBtn}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleReject}
              disabled={acting}
              style={styles.declineSecondaryBtn}
            >
              <Text style={styles.declineText}>Decline Request</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Medical disclaimer note */}
        <View style={styles.disclaimerContainer}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.muted} />
          <Text style={styles.disclaimerText}>
            LifeDrop is a direct peer-to-peer blood donation network. Never exchange money. Blood donation is a voluntary life-saving act.
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
  heroCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bloodBadgeLarge: {
    width: 60,
    height: 60,
    borderRadius: radii.circle,
    backgroundColor: colors.primaryRed,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.redGlow,
  },
  bloodBadgeTextLarge: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 22,
    color: '#FFFFFF',
  },
  patientName: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 18,
    color: colors.navyDark,
    letterSpacing: -0.3,
  },
  unitsNeeded: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    color: colors.primaryDark,
    marginTop: 2,
  },
  timeAgoText: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  acceptedContactCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1.5,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  acceptedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  acceptedTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 16,
    color: '#15803D',
  },
  acceptedSubtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: '#166534',
    marginTop: 2,
  },
  phoneDisplayBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: spacing.md,
  },
  phoneLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 0.5,
  },
  phoneNumberText: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 20,
    color: colors.navyDark,
    marginTop: 2,
  },
  actionContactRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radii.button,
    gap: 6,
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
  },
  detailsCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeaderTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 16,
    color: colors.navyDark,
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  detailIconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.pageBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  detailLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.muted,
  },
  detailValue: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    color: colors.navyDark,
    marginTop: 2,
  },
  messageNoteText: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.ink,
    fontStyle: 'italic',
    marginTop: 2,
    lineHeight: 18,
  },
  mapCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  mapSubtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.muted,
    marginBottom: spacing.md,
    marginTop: -4,
  },
  mapWrapper: {
    height: 180,
    borderRadius: radii.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  actionContainer: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  acceptPrimaryBtn: {
    height: 54,
  },
  declineSecondaryBtn: {
    height: 48,
    borderRadius: radii.button,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  declineText: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    color: colors.muted,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
    padding: spacing.md,
    borderRadius: radii.sm,
    gap: spacing.sm,
  },
  disclaimerText: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: colors.muted,
    flex: 1,
    lineHeight: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
    color: colors.navyDark,
    marginTop: spacing.md,
  },
  errorDesc: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default RequestDetailScreen;
