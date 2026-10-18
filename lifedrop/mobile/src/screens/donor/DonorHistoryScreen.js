import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
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
import EmptyState from '../../components/EmptyState';
import Loader from '../../components/Loader';

export const DonorHistoryScreen = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/api/donor/history');
      setHistory(res.data?.data || []);
    } catch (err) {
      console.log('[Fetch History Error]', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const renderHistoryItem = ({ item }) => {
    const isCompleted = item.status === 'COMPLETED';
    const isAccepted = item.status === 'ACCEPTED';

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.bloodBadge}>
            <Text style={styles.bloodBadgeText}>{item.bloodGroup}</Text>
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.patientName}>{item.patientName || 'Emergency Patient'}</Text>
            <Text style={styles.cityText}>
              📍 {item.city || 'Bhopal'} • {item.unitsNeeded || 1} unit(s)
            </Text>
          </View>

          <StatusBadge status={item.status || 'ACCEPTED'} size="sm" />
        </View>

        {/* Recipient Contact revealed for accepted requests */}
        {item.recipientPhone ? (
          <View style={styles.contactRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>Recipient Contact</Text>
              <Text style={styles.contactPhone}>{item.recipientPhone}</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => Linking.openURL(`tel:${item.recipientPhone}`)}
              style={styles.callButton}
            >
              <Ionicons name="call" size={15} color="#FFFFFF" />
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Thank You Note */}
        <View style={styles.thankYouBox}>
          <Ionicons name="heart" size={14} color={colors.primaryRed} />
          <Text style={styles.thankYouText}>
            {isCompleted
              ? 'Blood donation successfully completed. You saved a precious life!'
              : 'You accepted this request. Please coordinate with the recipient.'}
          </Text>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Donation History"
        subtitle="Your life-saving contributions to the community"
      />

      {loading ? (
        <Loader message="Loading your donation journey..." fullScreen />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => String(item.requestId || item.id || Math.random())}
          renderItem={renderHistoryItem}
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
              title="No Donation History Yet"
              description="When you accept requests and help patients, your contributions will appear here."
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
    width: 44,
    height: 44,
    borderRadius: radii.circle,
    backgroundColor: colors.pageBg,
    borderColor: colors.borderPink,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bloodBadgeText: {
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
    fontSize: 15,
    color: colors.navyDark,
  },
  cityText: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: radii.sm,
    padding: spacing.sm + 2,
    marginVertical: spacing.xs,
  },
  contactLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    color: colors.muted,
  },
  contactPhone: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    color: colors.navyDark,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    gap: 4,
  },
  callButtonText: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  thankYouBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryBtnBg,
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginTop: spacing.sm,
    gap: 6,
  },
  thankYouText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.primaryDark,
    flex: 1,
  },
});

export default DonorHistoryScreen;
