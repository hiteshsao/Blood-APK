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
import recipientApi from '../../api/recipientApi';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import ScreenHeader from '../../components/ScreenHeader';
import NotificationBell from '../../components/NotificationBell';
import CustomButton from '../../components/CustomButton';
import EmptyState from '../../components/EmptyState';
import Loader from '../../components/Loader';
import { formatTimeAgo, formatDate } from '../../utils/formatters';

const FILTERS = ['All', 'Active', 'Completed'];

export const MyRequestsScreen = ({ navigation }) => {
  const [requests, setRequests] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState(null);
  const [error, setError] = useState(null);

  const fetchMyRequests = useCallback(async () => {
    try {
      setError(null);
      const data = await recipientApi.getMyRequests();
      setRequests(data);
    } catch (err) {
      console.log('[Fetch My Requests Error]', err?.response?.data || err?.message);
      setError(err?.response?.data?.message || 'Failed to load blood requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyRequests();
  };

  const handleCancel = (item) => {
    Alert.alert(
      'Cancel Blood Request?',
      `Are you sure you want to cancel the request for "${item.patientName}"? Any ongoing donor notifications will stop.`,
      [
        { text: 'Keep Active', style: 'cancel' },
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: async () => {
            try {
              setActingId(item.id);
              await recipientApi.cancelRequest(item.id);
              fetchMyRequests();
            } catch (err) {
              Alert.alert('Error', 'Failed to cancel request.');
            } finally {
              setActingId(null);
            }
          },
        },
      ]
    );
  };

  const filteredRequests = requests.filter((req) => {
    if (activeFilter === 'Active') {
      return req.status === 'PENDING' || req.status === 'ACCEPTED';
    }
    if (activeFilter === 'Completed') {
      return req.status === 'COMPLETED';
    }
    return true;
  });

  const renderRequestItem = ({ item }) => {
    const isPending = item.status === 'PENDING';
    const isAccepted = item.status === 'ACCEPTED';
    const isCompleted = item.status === 'COMPLETED';
    const isActing = actingId === item.id;

    return (
      <Card
        style={styles.card}
        onPress={() => navigation.navigate('RequestStatus', { requestId: item.id })}
      >
        <View style={styles.cardHeader}>
          {/* Blood group badge in a red circle */}
          <View style={styles.bloodBadgeCircle}>
            <Text style={styles.bloodBadgeText}>{item.bloodGroup}</Text>
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.patientName}>{item.patientName || 'Emergency Patient'}</Text>
            <Text style={styles.subText}>
              {item.unitsNeeded || 1} Unit(s) • 📍 {item.city || 'Indore'}
            </Text>
            <Text style={styles.timeAgoText}>
              {formatTimeAgo(item.createdAt)}
            </Text>
          </View>

          <StatusBadge status={item.status} size="sm" />
        </View>

        {/* Status context row */}
        {isAccepted && item.acceptedDonor ? (
          <View style={styles.acceptedDonorBanner}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.acceptedDonorName}>
                Accepted by: {item.acceptedDonor.name} ({item.acceptedDonor.bloodGroup})
              </Text>
              <Text style={styles.acceptedDonorPhone}>
                📞 {item.acceptedDonor.phone}
              </Text>
            </View>

            {item.acceptedDonor.phone && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => Linking.openURL(`tel:${item.acceptedDonor.phone}`)}
                style={styles.callDonorBtn}
              >
                <Ionicons name="call" size={14} color="#FFFFFF" />
                <Text style={styles.callDonorBtnText}>Call</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : isPending ? (
          <View style={styles.pendingBanner}>
            <Ionicons name="radio-outline" size={16} color={colors.primaryRed} />
            <Text style={styles.pendingText}>
              {item.matchedDonorCount != null
                ? `${item.matchedDonorCount} nearby compatible donors alerted.`
                : 'Searching for nearby donors...'}
            </Text>
          </View>
        ) : isCompleted ? (
          <View style={styles.completedBanner}>
            <Ionicons name="heart" size={16} color={colors.primaryRed} />
            <Text style={styles.completedText}>
              Blood donation successfully completed. Life saved! ❤️
            </Text>
          </View>
        ) : null}

        {/* Footer Actions */}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('RequestStatus', { requestId: item.id })}
          >
            <Text style={styles.viewTimelineLink}>Track Status Timeline →</Text>
          </TouchableOpacity>

          {isPending && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleCancel(item)}
              disabled={isActing}
              style={styles.cancelLinkBtn}
            >
              <Text style={styles.cancelLinkText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="My Blood Requests"
        subtitle="Manage and track your active donation alerts"
        rightComponent={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <NotificationBell style={{ marginRight: 8 }} />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('CreateRequest', { urgency: 'NORMAL' })}
              style={styles.headerAddBtn}
            >
              <Ionicons name="add" size={20} color={colors.primaryRed} />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Filter Tabs (All, Active, Completed) */}
      <View style={styles.filterBar}>
        {FILTERS.map((tab) => {
          const isActive = activeFilter === tab;
          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.8}
              onPress={() => setActiveFilter(tab)}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  isActive && styles.filterTabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <Loader message="Loading your blood requests..." fullScreen />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={44} color={colors.danger} />
          <Text style={styles.errorTitle}>Could not load requests</Text>
          <Text style={styles.errorDesc}>{error}</Text>
          <CustomButton
            title="Try Again"
            onPress={fetchMyRequests}
            variant="secondary"
            style={{ marginTop: spacing.md }}
          />
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => String(item.id)}
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
              iconName="medkit-outline"
              title={
                activeFilter === 'Active'
                  ? 'No Active Requests'
                  : activeFilter === 'Completed'
                  ? 'No Completed Requests Yet'
                  : 'No Blood Requests'
              }
              description={
                activeFilter === 'Active'
                  ? 'You currently have no pending or accepted blood donation requests.'
                  : 'Broadcast a direct emergency alert to nearby donors whenever you need blood.'
              }
              actionTitle="Request Blood Now"
              onAction={() => navigation.navigate('CreateRequest', { urgency: 'NORMAL' })}
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
  headerAddBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF1F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderPink,
  },
  filterBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.screenPadding,
    backgroundColor: '#F1F5F9',
    borderRadius: radii.button,
    padding: 4,
    marginBottom: spacing.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radii.button - 2,
  },
  filterTabActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderPink,
    ...shadows.cardSoft,
  },
  filterTabText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: colors.muted,
  },
  filterTabTextActive: {
    color: colors.primaryRed,
  },
  listContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xxl,
  },
  card: {
    padding: spacing.lg,
    marginVertical: spacing.xs + 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bloodBadgeCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primaryRed,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.redGlow,
  },
  bloodBadgeText: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  patientName: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 16,
    color: colors.navyDark,
  },
  subText: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  timeAgoText: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: colors.lightMuted,
    marginTop: 1,
  },
  acceptedDonorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: spacing.md,
    borderRadius: radii.sm,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  acceptedDonorName: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: '#15803D',
  },
  acceptedDonorPhone: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: '#166534',
    marginTop: 2,
  },
  callDonorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
  },
  callDonorBtnText: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F1',
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginTop: spacing.md,
  },
  pendingText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.primaryRed,
    marginLeft: 6,
    flex: 1,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginTop: spacing.md,
  },
  completedText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.navyDark,
    marginLeft: 6,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  viewTimelineLink: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: colors.primaryRed,
  },
  cancelLinkBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  cancelLinkText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.danger,
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

export default MyRequestsScreen;
