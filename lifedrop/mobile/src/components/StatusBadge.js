import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { radii, spacing } from '../theme/spacing';

/**
 * StatusBadge Component
 * Displays fully-rounded pill badges for request and response statuses:
 * - Pending: Amber
 * - Accepted: Green
 * - Completed: Blue-grey
 * - Cancelled / Expired: Grey
 * - Urgent: Red
 */
export const StatusBadge = ({
  status,
  size = 'md',
  showIcon = true,
  style,
  textStyle,
}) => {
  const normalizedStatus = (status || '').toUpperCase();

  let config = {
    label: normalizedStatus || 'UNKNOWN',
    text: colors.status.pending.text,
    bg: colors.status.pending.bg,
    border: colors.status.pending.border,
    icon: 'time-outline',
  };

  switch (normalizedStatus) {
    case 'PENDING':
      config = {
        label: 'Pending',
        text: '#B45309',
        bg: '#FEF3C7',
        border: '#FDE68A',
        icon: 'time-outline',
      };
      break;

    case 'ACCEPTED':
      config = {
        label: 'Accepted',
        text: '#15803D',
        bg: '#DCFCE7',
        border: '#BBF7D0',
        icon: 'checkmark-circle-outline',
      };
      break;

    case 'COMPLETED':
      config = {
        label: 'Completed',
        text: '#334155',
        bg: '#F1F5F9',
        border: '#CBD5E1',
        icon: 'shield-checkmark-outline',
      };
      break;

    case 'REJECTED':
    case 'CANCELLED':
      config = {
        label: normalizedStatus === 'REJECTED' ? 'Declined' : 'Cancelled',
        text: '#64748B',
        bg: '#F3F4F6',
        border: '#E2E8F0',
        icon: 'close-circle-outline',
      };
      break;

    case 'EXPIRED':
      config = {
        label: 'Expired',
        text: '#6B7280',
        bg: '#F3F4F6',
        border: '#E5E7EB',
        icon: 'timer-outline',
      };
      break;

    case 'URGENT':
      config = {
        label: 'Urgent SOS',
        text: '#DC2626',
        bg: '#FEE2E2',
        border: '#FECACA',
        icon: 'alert-circle',
      };
      break;

    case 'NORMAL':
      config = {
        label: 'Normal',
        text: '#2563EB',
        bg: '#EFF6FF',
        border: '#BFDBFE',
        icon: 'information-circle-outline',
      };
      break;

    default:
      config = {
        label: normalizedStatus,
        text: colors.muted,
        bg: '#F1F5F9',
        border: '#E2E8F0',
        icon: 'ellipse',
      };
  }

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          paddingVertical: isSmall ? 3 : 5,
          paddingHorizontal: isSmall ? 8 : 12,
        },
        style,
      ]}
    >
      {showIcon && (
        <Ionicons
          name={config.icon}
          size={isSmall ? 12 : 14}
          color={config.text}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            color: config.text,
            fontSize: isSmall ? 11 : 12,
          },
          textStyle,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontFamily: fontFamilies.bold,
    letterSpacing: 0.1,
  },
});

export default StatusBadge;
