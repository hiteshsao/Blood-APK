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
import { formatDate } from '../../utils/formatters';

export const DonorHistoryScreen = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      setError(null);
      const data = await requestApi.getHistory();
      setHistory(data);
    } catch (err) {
      console.log('[Fetch History Error]', err?.response?.data || err?.message);
      setError(err?.response?.data?.message || 'Failed to load donation history.');
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
    const donationDate = item.createdAt ? formatDate(item.createdAt) : 'Recently';

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.bloodBadgeCircle}>
            <Text style={styles.bloodBadgeText}>{item.bloodGroup}</Text>
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.patientName}>{item.patientName || 'Emergency Patient'}</Text>
            <Text style={styles.cityText}>
              📍 {item.city || 'Bhopal'} • {item.unitsNeeded || 1} Unit(s)
            </Text>
            <Text style={styles.dateText}>Donated on: {donationDate}</Text>
          </View>

          <StatusBadge status={item.status || 'ACCEPTED'} size="sm" />
        </View>

        {/* Recipient Phone info for ongoing accepted requests */}
        {item.recipientPhone && isAccepted ? (
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

        {/* Personalized Thank-You Note */}
        <View style={styles.thankYouBox}>
          <Ionicons name="heart" size={16} color={colors.primaryRed} />
          <Text style={styles.thankYouText}>
            {isCompleted
              ? `Blood donation completed on ${donationDate}. You saved a precious life and gave hope to a family. Thank you for your selfless act!`
              : `You accepted this request on ${donationDate}. Please coordinate with the recipient to complete the donation.`}
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
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={44} color={colors.danger} />
          <Text style={styles.errorTitle}>Could not load history</Text>
          <Text style={styles.errorDesc}>{error}</Text>
          <CustomButton
            title="Try Again"
            onPress={fetchHistory}
            variant="secondary"
            style={{ marginTop: spacing.md }}
          />
        </View>
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
              description="When you accept requests and help patients in need, your completed contributions will appear here."
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
  cityText: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  dateText: {
    fontFamily: fontFamilies.regular,
    fontSize: 11,
    color: colors.lightMuted,
    marginTop: 1,
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
    alignItems: 'flex-start',
    backgroundColor: colors.secondaryBtnBg,
    borderColor: colors.borderPink,
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: radii.sm,
    marginTop: spacing.sm,
    gap: 8,
  },
  thankYouText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.primaryDark,
    flex: 1,
    lineHeight: 18,
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

export default DonorHistoryScreen;
