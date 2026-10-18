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
import axiosInstance from '../../api/axiosInstance';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import ScreenHeader from '../../components/ScreenHeader';
import CustomButton from '../../components/CustomButton';
import EmptyState from '../../components/EmptyState';
import Loader from '../../components/Loader';

export const DonorRequestsScreen = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/api/donor/requests');
      setRequests(res.data?.data || []);
    } catch (err) {
      console.log('[Fetch Requests Error]', err?.message);
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
              const res = await axiosInstance.post(`/api/donor/requests/${id}/accept`);
              const acceptedData = res.data?.data;
              const phone = acceptedData?.recipientPhone;

              Alert.alert(
                'Request Accepted! 🎉',
                `Thank you for being a life saver! Recipient contact: ${phone || 'Available in history'}.`,
                phone
                  ? [
                      {
                        text: 'Call Recipient',
                        onPress: () => Linking.openURL(`tel:${phone}`),
                      },
                      { text: 'Close', style: 'cancel' },
                    ]
                  : [{ text: 'OK' }]
              );
              fetchRequests();
            } catch (err) {
              if (err?.response?.status === 409) {
                Alert.alert(
                  'Already Accepted',
                  'Another generous donor just accepted this request moments ago. Thank you for your readiness!'
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
              await axiosInstance.post(`/api/donor/requests/${id}/reject`);
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
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.bloodBadge}>
            <Text style={styles.bloodBadgeText}>{item.bloodGroup}</Text>
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.patientName}>{item.patientName || 'Emergency Patient'}</Text>
            <Text style={styles.locationText}>
              📍 {item.city || 'Bhopal'} {item.distanceKm ? `• ~${item.distanceKm.toFixed(1)} km away` : ''}
            </Text>
          </View>

          <StatusBadge status={item.urgency || 'NORMAL'} size="sm" />
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailPill}>
            <Ionicons name="water-outline" size={14} color={colors.primaryRed} />
            <Text style={styles.detailPillText}>{item.unitsNeeded || 1} Unit(s) Needed</Text>
          </View>
        </View>

        {item.message ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>"{item.message}"</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
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
        subtitle="Recipients seeking your blood group nearby"
      />

      {loading ? (
        <Loader message="Fetching requests near you..." fullScreen />
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
          ListEmptyStateComponent={
            <EmptyState
              iconName="heart-outline"
              title="No Requests Near You"
              description="There are no pending blood donation requests matching your area and blood type right now."
              actionTitle="Refresh"
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
    marginBottom: spacing.sm,
  },
  bloodBadge: {
    width: 48,
    height: 48,
    borderRadius: radii.circle,
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
  detailsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryBtnBg,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radii.pill,
    gap: 4,
  },
  detailPillText: {
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
    height: 52,
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
  },
});

export default DonorRequestsScreen;
