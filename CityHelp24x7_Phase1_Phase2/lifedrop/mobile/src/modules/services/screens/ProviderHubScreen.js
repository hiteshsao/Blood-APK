import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import ScreenHeader from '../../../components/ScreenHeader';
import CustomButton from '../../../components/CustomButton';
import Card from '../../../components/Card';
import Loader from '../../../components/Loader';
import { providerApi, bookingApi, errorMessage } from '../api/servicesApi';
import { Stars, StatusPill, formatPrice, ui } from '../components/ui';
import { colors } from '../../../theme/colors';
import { fontFamilies } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';

const INFO = {
  PENDING: { icon: 'time-outline', text: 'Your profile is under review. You will be notified once it is verified.' },
  REJECTED: { icon: 'close-circle-outline', text: 'Your profile was not approved. Fix the details and submit again.' },
  SUSPENDED: { icon: 'ban-outline', text: 'Your profile is suspended. Contact support for help.' },
};

/** Single entry point for providers: register, see verification status, manage availability. */
export const ProviderHubScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [p, setP] = useState(null);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const me = await providerApi.getMe();
      setP(me);
      if (me && me.verificationStatus === 'VERIFIED') {
        const list = await bookingApi.received();
        setPending(list.filter((b) => b.status === 'PENDING').length);
      }
    } catch (e) {
      setError(errorMessage(e, 'Could not load your profile'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = async (value) => {
    try {
      setP(await providerApi.setAvailability(value));
    } catch (e) {
      Alert.alert('Could not update', errorMessage(e));
    }
  };

  return (
    <SafeAreaView style={ui.safe}>
      <ScreenHeader title="Provider Dashboard" showBack onBack={() => navigation.goBack()} />
      {loading ? (
        <Loader message="Loading..." fullScreen />
      ) : error ? (
        <Text style={[ui.error, { textAlign: 'center' }]}>{error}</Text>
      ) : !p ? (
        <ScrollView contentContainerStyle={ui.content}>
          <Card>
            <Ionicons name="briefcase-outline" size={34} color={colors.modules.services.main} />
            <Text style={styles.h}>Get customers from your city</Text>
            <Text style={styles.text}>List your service, get booking requests and build your rating. Your phone and address stay private until you accept a job.</Text>
            <CustomButton title="Register as Provider" onPress={() => navigation.navigate('ProviderRegister')} style={{ marginTop: spacing.lg }} />
          </Card>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={ui.content}>
          <Card>
            <View style={styles.row}>
              <Text style={styles.name}>{p.displayName}</Text>
              <StatusPill status={p.verificationStatus === 'REJECTED' ? 'REJECTED_PROFILE' : p.verificationStatus} />
            </View>
            <Text style={styles.text}>{p.categoryName} • {formatPrice(p)}</Text>
            {p.ratingCount > 0 ? <View style={{ marginTop: 6 }}><Stars value={p.ratingAvg} count={p.ratingCount} size={15} /></View> : null}
          </Card>

          {INFO[p.verificationStatus] ? (
            <Card style={{ marginTop: spacing.md }}>
              <View style={styles.row}>
                <Ionicons name={INFO[p.verificationStatus].icon} size={22} color={colors.muted} />
                <Text style={[styles.text, { flex: 1, marginLeft: 10, marginTop: 0 }]}>{INFO[p.verificationStatus].text}</Text>
              </View>
              {p.statusReason ? <Text style={styles.reason}>Reason: {p.statusReason}</Text> : null}
            </Card>
          ) : (
            <Card style={{ marginTop: spacing.md }}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.h2}>Accepting bookings</Text>
                  <Text style={styles.text}>{p.available ? 'You appear in search results.' : 'Customers cannot book you right now.'}</Text>
                </View>
                <Switch value={p.available} onValueChange={toggle} />
              </View>
            </Card>
          )}

          {p.verificationStatus === 'VERIFIED' ? (
            <CustomButton
              title={pending > 0 ? `View ${pending} new request${pending > 1 ? 's' : ''}` : 'View Received Bookings'}
              onPress={() => navigation.navigate('MainTabs', { screen: 'Bookings' })}
              style={{ marginTop: spacing.md }}
            />
          ) : null}
          {p.verificationStatus !== 'SUSPENDED' ? (
            <CustomButton
              title="Edit Profile"
              variant="secondary"
              icon={<Ionicons name="create-outline" size={18} color={colors.primaryRed} />}
              onPress={() => navigation.navigate('ProviderRegister', { profile: p })}
              style={{ marginTop: spacing.sm }}
            />
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { flex: 1, fontFamily: fontFamilies.extraBold, fontSize: 17, color: colors.navyDark, marginRight: 8 },
  h: { fontFamily: fontFamilies.extraBold, fontSize: 17, color: colors.navyDark, marginTop: spacing.sm },
  h2: { fontFamily: fontFamilies.bold, fontSize: 14.5, color: colors.navyDark },
  text: { fontFamily: fontFamilies.regular, fontSize: 13, color: colors.muted, marginTop: 4, lineHeight: 19 },
  reason: { fontFamily: fontFamilies.medium, fontSize: 12.5, color: colors.danger, marginTop: 8 },
});

export default ProviderHubScreen;
