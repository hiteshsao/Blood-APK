import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import ScreenHeader from '../../../components/ScreenHeader';
import NotificationBell from '../../../components/NotificationBell';
import EmptyState from '../../../components/EmptyState';
import Loader from '../../../components/Loader';
import { bookingApi, providerApi, errorMessage } from '../api/servicesApi';
import { StatusPill, formatWhen, ui } from '../components/ui';
import { colors } from '../../../theme/colors';
import { fontFamilies } from '../../../theme/typography';
import { spacing, radii } from '../../../theme/spacing';

/** Bookings tab: "My Bookings" (as customer) and, for providers, "Received". */
export const BookingsScreen = ({ navigation, route }) => {
  const [segment, setSegment] = useState('mine');
  const [isProvider, setIsProvider] = useState(false);
  const [mine, setMine] = useState([]);
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const [m, me] = await Promise.all([bookingApi.mine(), providerApi.getMe().catch(() => null)]);
      setMine(m);
      setIsProvider(!!me);
      setReceived(me ? await bookingApi.received() : []);
    } catch (e) {
      setError(errorMessage(e, 'Could not load bookings'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const data = segment === 'mine' ? mine : received;

  const renderItem = ({ item }) => (
    <TouchableOpacity activeOpacity={0.88} style={styles.card} onPress={() => navigation.navigate('BookingDetail', { id: item.id })}>
      <View style={styles.row}>
        <Text style={styles.title} numberOfLines={1}>
          {segment === 'mine' ? item.providerName : item.customerName || 'Customer'}
        </Text>
        <StatusPill status={item.status} />
      </View>
      <Text style={styles.cat}>{item.categoryName}</Text>
      <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
      <Text style={styles.when}>{formatWhen(item.scheduledAt)}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={ui.safe}>
      <ScreenHeader title="Bookings" subtitle="Track your service requests" rightComponent={<NotificationBell />} />
      {isProvider ? (
        <View style={styles.seg}>
          {[{ k: 'mine', l: 'My Bookings' }, { k: 'received', l: 'Received' }].map((s) => (
            <TouchableOpacity key={s.k} onPress={() => setSegment(s.k)} style={[styles.segBtn, segment === s.k && styles.segOn]}>
              <Text style={[styles.segText, segment === s.k && { color: colors.modules.services.main }]}>{s.l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
      {loading ? (
        <Loader message="Loading bookings..." fullScreen />
      ) : error ? (
        <EmptyState iconName="alert-circle-outline" title="Something went wrong" description={error} actionTitle="Retry" onAction={load} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: spacing.screenPadding }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={
            <EmptyState
              iconName="calendar-outline"
              title="No bookings yet"
              description={segment === 'mine' ? 'Find a professional and book your first service.' : 'Requests from customers will show up here.'}
              actionTitle={segment === 'mine' ? 'Find Services' : undefined}
              onAction={segment === 'mine' ? () => navigation.navigate('Services') : undefined}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', marginHorizontal: spacing.screenPadding, marginBottom: spacing.sm, backgroundColor: '#F1F5F9', borderRadius: radii.button, padding: 4 },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radii.button - 2 },
  segOn: { backgroundColor: '#FFF' },
  segText: { fontFamily: fontFamilies.bold, fontSize: 13, color: colors.muted },
  card: { backgroundColor: '#FFF', borderRadius: radii.card, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: '#F1F5F9' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { flex: 1, fontFamily: fontFamilies.bold, fontSize: 14.5, color: colors.navyDark, marginRight: 8 },
  cat: { fontFamily: fontFamilies.regular, fontSize: 12, color: colors.muted, marginTop: 2 },
  desc: { fontFamily: fontFamilies.regular, fontSize: 13, color: colors.navyDark, marginTop: 6 },
  when: { fontFamily: fontFamilies.bold, fontSize: 12, color: colors.modules.services.main, marginTop: 6 },
});

export default BookingsScreen;
