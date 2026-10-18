import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import requestApi from '../../api/requestApi';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import ScreenHeader from '../../components/ScreenHeader';
import CustomButton from '../../components/CustomButton';
import EmptyState from '../../components/EmptyState';
import Loader from '../../components/Loader';
import { formatDistance, formatTimeAgo } from '../../utils/formatters';

export const DonorRequestsScreen = ({ navigation }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState(null);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      setError(null);
      const data = await requestApi.getIncomingRequests();
      setRequests(data);
    } catch (err) {
      console.log('[Fetch Requests Error]', err?.response?.data || err?.message);
      setError(err?.response?.data?.message || 'Failed to load incoming requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleAccept = (req) => {
    const id = req.requestId || req.id;
    Alert.alert(
      'Accept Blood Donation Request?',
      `Are you ready to donate ${req.bloodGroup} blood for patient "${req.patientName || 'Emergency Patient'}"? Once accepted, your contact details will be shared with the recipient.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Accept',
          style: 'default',
          onPress: async () => {
            try {
              setActingId(id);
              const acceptedData = await requestApi.acceptRequest(id);
              const phone = acceptedData?.recipientPhone;
              const name = acceptedData?.recipientFirstName || 'Recipient';

              Alert.alert(
                'Request Accepted! 🎉',
                `Thank you for being a life saver! Recipient ${name}'s contact: ${phone || 'Available in request details'}.`,
                phone
                  ? [
                      {
                        text: 'Call Recipient',
                        onPress: () => Linking.openURL(`tel:${phone}`),
                      },
                      {
                        text: 'View Details',
                        onPress: () => navigation.navigate('RequestDetail', { requestId: id }),
                      },
                      { text: 'Close', style: 'cancel' },
                    ]
                  : [
                      {
                        text: 'View Details',
                        onPress: () => navigation.navigate('RequestDetail', { requestId: id }),
                      },
                    ]
              );
              fetchRequests();
            } catch (err) {
              if (err?.response?.status === 409) {
                Alert.alert(
                  'Another Donor Already Accepted',
                  'Another generous donor just accepted this request moments ago. Thank you for your readiness to help!'
                );
              } else {
                const msg = err?.response?.data?.message || 'Failed to accept request.';
                Alert.alert('Error', msg);
              }
            } finally {
              setActingId(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = (req) => {
    const id = req.requestId || req.id;
    Alert.alert(
      'Decline Request?',
      'You will not see this request in your pending queue anymore.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              setActingId(id);
              await requestApi.rejectRequest(id);
              setRequests((prev) => prev.filter((r) => (r.requestId || r.id) !== id));
            } catch (err) {
              Alert.alert('Error', 'Failed to decline request.');
            } finally {
              setActingId(null);
            }
          },
        },
      ]
    );
  };

  const renderRequestItem = ({ item }) => {
    const id = item.requestId || item.id;
    const isActing = actingId === id;

    return (
      <Card
        style={styles.card}
        onPress={() => navigation.navigate('RequestDetail', { requestId: id })}
      >
        <View style={styles.cardHeader}>
          {/* Blood group badge in a red circle */}
          <View style={styles.bloodBadgeCircle}>
            <Text style={styles.bloodBadgeText}>{item.bloodGroup}</Text>
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.patientName}>{item.patientName || 'Emergency Patient'}</Text>
            <Text style={styles.locationText}>
              📍 {item.city || 'Bhopal'} {item.distanceKm != null ? `• ${formatDistance(item.distanceKm)}` : ''}
            </Text>
            <Text style={styles.timeAgoText}>
              {formatTimeAgo(item.createdAt)}
            </Text>
          </View>

          {/* Urgency Badge */}
          <StatusBadge status={item.urgency || 'NORMAL'} size="sm" />
        </View>

        <View style={styles.unitsRow}>
          <View style={styles.unitPill}>
            <Ionicons name="water-outline" size={13} color={colors.primaryRed} />
            <Text style={styles.unitPillText}>{item.unitsNeeded || 1} Unit(s) Needed</Text>
          </View>
        </View>

        {item.message ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageText} numberOfLines={2}>
              "{item.message}"
            </Text>
          </View>
        ) : null}

        {/* Action Buttons Row */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleReject(item)}
            disabled={isActing}
            style={styles.rejectBtn}
          >
            <Text style={styles.rejectBtnText}>Decline</Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <CustomButton
              title="Accept & Connect"
              onPress={() => handleAccept(item)}
              loading={isActing}
              variant="primary"
              style={styles.acceptBtn}
            />
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Incoming Requests"
        subtitle="Patients in need of your blood group nearby"
      />

      {loading ? (
        <Loader message="Fetching requests near you..." fullScreen />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={44} color={colors.danger} />
          <Text style={styles.errorTitle}>Could not load requests</Text>
          <Text style={styles.errorDesc}>{error}</Text>
          <CustomButton
            title="Try Again"
            onPress={fetchRequests}
            variant="secondary"
            style={{ marginTop: spacing.md }}
          />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.requestId || item.id || Math.random())}
          renderItem={renderRequestItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primaryRed]}
              tintColor={colors.primaryRed}
            />
          }
          ListEmptyComponent={
            <EmptyState
              iconName="heart-outline"
              title="No requests near you right now."
              description="There are currently no active blood donation requests matching your group in your locality."
              actionTitle="Check Again"
              onAction={onRefresh}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  listContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  bloodBadgeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.pageBg,
    borderColor: colors.borderPink,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bloodBadgeText: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 16,
    color: colors.primaryRed,
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  patientName: {
    fontFamily: fontFamilies.bold,
    fontSize: 16,
    color: colors.navyDark,
  },
  locationText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  timeAgoText: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: colors.lightMuted,
    marginTop: 1,
  },
  unitsRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  unitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryBtnBg,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radii.pill,
    gap: 4,
  },
  unitPillText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 12,
    color: colors.primaryRed,
  },
  messageBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: radii.sm,
    padding: spacing.sm + 2,
    marginVertical: spacing.sm,
  },
  messageText: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.muted,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  rejectBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.button,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtnText: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    color: colors.muted,
  },
  acceptBtn: {
    marginVertical: 0,
    height: 50,
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

export default DonorRequestsScreen;
