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
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import ScreenHeader from '../../components/ScreenHeader';
import CustomButton from '../../components/CustomButton';
import EmptyState from '../../components/EmptyState';
import Loader from '../../components/Loader';

const FILTERS = ['All', 'Active', 'Completed'];

export const MyRequestsScreen = ({ navigation }) => {
  const [requests, setRequests] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState(null);

  const fetchMyRequests = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/api/recipient/requests');
      setRequests(res.data?.data || []);
    } catch (err) {
      console.log('[Fetch My Requests Error]', err?.message);
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
      'Are you sure you want to cancel this request? Any pending donor notifications will be stopped.',
      [
        { text: 'Keep Active', style: 'cancel' },
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: async () => {
            try {
              setActingId(item.id);
              await axiosInstance.put(`/api/recipient/requests/${item.id}/cancel`);
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

  const handleComplete = (item) => {
    Alert.alert(
      'Mark Donation Completed? 🩸',
      `Did donor "${item.acceptedDonor?.name || 'the donor'}" complete the blood donation? Marking completed will update the donor's 90-day recovery record.`,
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Yes, Completed',
          style: 'default',
          onPress: async () => {
            try {
              setActingId(item.id);
              await axiosInstance.post(`/api/recipient/requests/${item.id}/complete`);
              Alert.alert('Thank You!', 'Blood donation marked as completed. Life saved!');
              fetchMyRequests();
            } catch (err) {
              Alert.alert('Error', 'Failed to mark as completed.');
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
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.bloodCircle}>
            <Text style={styles.bloodCircleText}>{item.bloodGroup}</Text>
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.patientName}>{item.patientName}</Text>
            <Text style={styles.subText}>
              {item.unitsNeeded || 1} Unit(s) • 📍 {item.city || 'Bhopal'}
            </Text>
          </View>

          <StatusBadge status={item.status} size="sm" />
        </View>

        {/* Accepted Donor Contact Info */}
        {isAccepted && item.acceptedDonor && (
          <View style={styles.donorInfoBox}>
            <View style={styles.donorRow}>
              <View style={styles.donorAvatar}>
                <Ionicons name="person" size={16} color={colors.primaryRed} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.donorName}>
                  Accepted by: {item.acceptedDonor.name} ({item.acceptedDonor.bloodGroup})
                </Text>
                <Text style={styles.donorPhone}>
                  📞 {item.acceptedDonor.phone || 'Phone shared'}
                </Text>
              </View>

              {item.acceptedDonor.phone && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => Linking.openURL(`tel:${item.acceptedDonor.phone}`)}
                  style={styles.callDonorBtn}
                >
                  <Ionicons name="call" size={16} color="#FFFFFF" />
                  <Text style={styles.callDonorBtnText}>Call</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Complete button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleComplete(item)}
              disabled={isActing}
              style={styles.completeBtn}
            >
              <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
              <Text style={styles.completeBtnText}>Mark as Completed</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Pending broadcast count */}
        {isPending && (
          <View style={styles.pendingInfoRow}>
            <Ionicons name="radio" size={15} color={colors.primaryRed} />
            <Text style={styles.pendingInfoText}>
              {item.matchedDonorCount != null
                ? `${item.matchedDonorCount} nearby compatible donors alerted.`
                : 'Awaiting donor response...'}
            </Text>
          </View>
        )}

        {/* Cancel button while Pending */}
        {isPending && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleCancel(item)}
            disabled={isActing}
            style={styles.cancelRequestBtn}
          >
            <Text style={styles.cancelRequestBtnText}>Cancel Request</Text>
          </TouchableOpacity>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="My Blood Requests"
        subtitle="Track active requests and donor responses"
      />

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            activeOpacity={0.7}
            onPress={() => setActiveFilter(f)}
            style={[
              styles.filterChip,
              activeFilter === f && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === f && styles.filterChipTextActive,
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <Loader message="Loading your requests..." fullScreen />
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => String(item.id || Math.random())}
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
              title="No Blood Requests"
              description="You have not created any requests under this filter."
              actionTitle="Create Request"
              onAction={() => navigation.navigate('Request Blood')}
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderPink,
  },
  filterChipActive: {
    backgroundColor: colors.primaryRed,
    borderColor: colors.primaryRed,
  },
  filterChipText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: colors.navyDark,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
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
  headerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  patientName: {
    fontFamily: fontFamilies.bold,
    fontSize: 16,
    color: colors.navyDark,
  },
  subText: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  donorInfoBox: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  donorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  donorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.pageBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donorName: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    color: '#15803D',
  },
  donorPhone: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    color: '#166534',
    marginTop: 2,
  },
  callDonorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    gap: 4,
  },
  callDonorBtnText: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryRed,
    paddingVertical: 10,
    borderRadius: radii.button,
    marginTop: spacing.sm,
    gap: 6,
  },
  completeBtnText: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  pendingInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pageBg,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
    gap: 6,
  },
  pendingInfoText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.primaryRed,
  },
  cancelRequestBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  cancelRequestBtnText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
    color: colors.muted,
  },
});

export default MyRequestsScreen;
