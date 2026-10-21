import React, { useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useNotificationContext } from '../../context/NotificationContext';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import ScreenHeader from '../../components/ScreenHeader';
import { formatTimeAgo } from '../../utils/formatters';

export const NotificationScreen = ({ navigation }) => {
  const { role } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    refreshing,
    page,
    totalPages,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationContext();

  // Refresh on mount
  useEffect(() => {
    fetchNotifications(0, true);
  }, [fetchNotifications]);

  const onRefresh = useCallback(() => {
    fetchNotifications(0, true);
  }, [fetchNotifications]);

  const onEndReached = useCallback(() => {
    if (!loading && !refreshing && page + 1 < totalPages) {
      fetchNotifications(page + 1, false);
    }
  }, [loading, refreshing, page, totalPages, fetchNotifications]);

  const handleNotificationPress = useCallback(
    (item) => {
      // 1. Mark as read on tap
      if (!item.read) {
        markAsRead(item.id);
      }

      // 2. Navigate if relatedRequestId is present
      const reqId = item.relatedRequestId;
      if (reqId) {
        const idNumber = Number(reqId);
        if (role === 'DONOR') {
          navigation.navigate('RequestDetail', { requestId: idNumber });
        } else {
          navigation.navigate('RequestStatus', { requestId: idNumber });
        }
      }
    },
    [markAsRead, role, navigation]
  );

  // Icon and accent color helper based on notification type
  const getNotificationTypeConfig = (type) => {
    switch (type) {
      case 'NEW_REQUEST':
      case 'URGENT':
        return {
          icon: 'water',
          iconColor: colors.primaryRed,
          bgColor: '#FEE2E2',
        };
      case 'REQUEST_ACCEPTED':
        return {
          icon: 'checkmark-circle',
          iconColor: colors.success,
          bgColor: '#DCFCE7',
        };
      case 'REQUEST_CANCELLED':
        return {
          icon: 'close-circle',
          iconColor: colors.warning,
          bgColor: '#FEF3C7',
        };
      case 'REQUEST_COMPLETED':
        return {
          icon: 'heart',
          iconColor: '#2563EB',
          bgColor: '#DBEAFE',
        };
      default:
        return {
          icon: 'notifications',
          iconColor: colors.primaryRed,
          bgColor: '#FFF1F2',
        };
    }
  };

  const renderItem = ({ item }) => {
    const config = getNotificationTypeConfig(item.type);
    const isUnread = !item.read;

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => handleNotificationPress(item)}
        style={[
          styles.itemCard,
          isUnread ? styles.unreadItemCard : styles.readItemCard,
        ]}
      >
        {/* Left accent strip & icon */}
        <View style={[styles.iconBox, { backgroundColor: config.bgColor }]}>
          <Ionicons name={config.icon} size={22} color={config.iconColor} />
        </View>

        {/* Content */}
        <View style={styles.itemContent}>
          <View style={styles.itemHeaderRow}>
            <Text
              style={[
                styles.itemTitle,
                isUnread ? styles.unreadText : styles.readTitleText,
              ]}
              numberOfLines={2}
            >
              {item.title}
            </Text>

            {/* Unread red dot */}
            {isUnread && <View style={styles.unreadDot} />}
          </View>

          <Text
            style={[
              styles.itemBody,
              isUnread ? styles.unreadBodyText : styles.readBodyText,
            ]}
            numberOfLines={3}
          >
            {item.body}
          </Text>

          <View style={styles.itemFooterRow}>
            <View style={styles.timeRow}>
              <Feather name="clock" size={11} color={colors.lightMuted} />
              <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
            </View>

            {item.relatedRequestId ? (
              <View style={styles.tapActionRow}>
                <Text style={styles.tapActionText}>View details</Text>
                <Feather name="chevron-right" size={12} color={colors.primaryRed} />
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primaryRed} />
          <Text style={styles.emptySubtext}>Loading notifications...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="notifications-off-outline" size={40} color={colors.lightMuted} />
        </View>
        <Text style={styles.emptyTitle}>No Notifications Yet</Text>
        <Text style={styles.emptySubtext}>
          You will be notified when nearby emergency blood requests match your blood group, or when
          a donor accepts your request.
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loading || refreshing) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primaryRed} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}`
            : 'Stay updated on blood requests'
        }
        showBack={true}
        onBack={() => navigation.goBack()}
        rightComponent={
          unreadCount > 0 ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={markAllAsRead}
              style={styles.markAllButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="checkmark-done" size={16} color={colors.primaryRed} />
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchNotifications(0, true)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primaryRed]}
            tintColor={colors.primaryRed}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF5F5',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderPink,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.button,
    ...shadows.soft,
  },
  markAllText: {
    marginLeft: 4,
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    color: colors.primaryRed,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radii.card,
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.sm,
    padding: spacing.sm,
  },
  errorText: {
    flex: 1,
    marginLeft: spacing.xs,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.danger,
  },
  retryText: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    color: colors.primaryRed,
    marginLeft: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radii.card,
    marginBottom: spacing.sm,
    ...shadows.soft,
  },
  unreadItemCard: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryRed,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#FEE2E2',
  },
  readItemCard: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  itemContent: {
    flex: 1,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemTitle: {
    flex: 1,
    fontSize: 15,
    marginRight: spacing.xs,
  },
  unreadText: {
    fontFamily: fontFamilies.bold,
    color: colors.navyDark,
  },
  readTitleText: {
    fontFamily: fontFamilies.semiBold,
    color: '#475569',
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.primaryRed,
    marginTop: 4,
  },
  itemBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  unreadBodyText: {
    fontFamily: fontFamilies.regular,
    color: '#334155',
  },
  readBodyText: {
    fontFamily: fontFamilies.regular,
    color: colors.lightMuted,
  },
  itemFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    color: colors.lightMuted,
    marginLeft: 4,
  },
  tapActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tapActionText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
    color: colors.primaryRed,
    marginRight: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  emptyTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
    color: colors.navyDark,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});

export default NotificationScreen;
