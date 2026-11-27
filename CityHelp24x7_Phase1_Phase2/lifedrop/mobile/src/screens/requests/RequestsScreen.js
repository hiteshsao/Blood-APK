import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { isDonorUser } from '../../utils/userRoles';
import ScreenHeader from '../../components/ScreenHeader';
import NotificationBell from '../../components/NotificationBell';
import MyRequestsScreen from '../recipient/MyRequestsScreen';
import DonorRequestsScreen from '../donor/DonorRequestsScreen';
import DonorHistoryScreen from '../donor/DonorHistoryScreen';
import EmptyState from '../../components/EmptyState';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';

/**
 * Unified "Requests" hub.
 *  - "I Requested": requests the user created (was recipient's My Requests)
 *  - "I Can Help": incoming requests for donors (+ donation history). Non-donors see an enable prompt.
 * route.params.segment: 'mine' | 'help'
 */
export const RequestsScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const donor = isDonorUser(user);
  const [segment, setSegment] = useState(route?.params?.segment === 'help' ? 'help' : 'mine');
  const [helpTab, setHelpTab] = useState('incoming');

  useEffect(() => {
    const s = route?.params?.segment;
    if (s === 'help' || s === 'mine') setSegment(s);
  }, [route?.params?.segment]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Requests"
        subtitle="Blood requests you made and ones you can help with"
        rightComponent={<NotificationBell />}
      />

      <View style={styles.segmentWrap}>
        {[
          { key: 'mine', label: 'I Requested' },
          { key: 'help', label: 'I Can Help' },
        ].map((s) => {
          const active = segment === s.key;
          return (
            <TouchableOpacity
              key={s.key}
              activeOpacity={0.85}
              style={[styles.segment, active && styles.segmentActive]}
              onPress={() => setSegment(s.key)}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {segment === 'mine' ? (
        <MyRequestsScreen navigation={navigation} embedded />
      ) : !donor ? (
        <EmptyState
          iconName="heart-outline"
          title="Become a blood donor"
          description="Enable your donor profile to receive requests from patients near you."
          actionTitle="Enable Donor Profile"
          onAction={() => navigation.navigate('DonorOnboarding')}
        />
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.subTabs}>
            {[
              { key: 'incoming', label: 'Incoming' },
              { key: 'history', label: 'My Donations' },
            ].map((t) => (
              <TouchableOpacity key={t.key} onPress={() => setHelpTab(t.key)} style={styles.subTab}>
                <Text style={[styles.subTabText, helpTab === t.key && styles.subTabTextActive]}>{t.label}</Text>
                {helpTab === t.key ? <View style={styles.subTabLine} /> : null}
              </TouchableOpacity>
            ))}
          </View>
          {helpTab === 'incoming' ? (
            <DonorRequestsScreen navigation={navigation} embedded />
          ) : (
            <DonorHistoryScreen embedded />
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.pageBg },
  segmentWrap: {
    flexDirection: 'row',
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.sm,
    backgroundColor: '#F1F5F9',
    borderRadius: radii.button,
    padding: 4,
  },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radii.button - 2 },
  segmentActive: { backgroundColor: '#FFFFFF' },
  segmentText: { fontFamily: fontFamilies.bold, fontSize: 13, color: colors.muted },
  segmentTextActive: { color: colors.primaryRed },
  subTabs: { flexDirection: 'row', paddingHorizontal: spacing.screenPadding, marginBottom: spacing.xs },
  subTab: { marginRight: spacing.xl, paddingVertical: 6 },
  subTabText: { fontFamily: fontFamilies.bold, fontSize: 13, color: colors.lightMuted },
  subTabTextActive: { color: colors.navyDark },
  subTabLine: { height: 2, backgroundColor: colors.primaryRed, marginTop: 4, borderRadius: 1 },
});

export default RequestsScreen;
