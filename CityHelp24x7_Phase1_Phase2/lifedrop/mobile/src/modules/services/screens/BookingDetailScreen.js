import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Linking, Alert, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import ScreenHeader from '../../../components/ScreenHeader';
import CustomButton from '../../../components/CustomButton';
import Card from '../../../components/Card';
import Loader from '../../../components/Loader';
import { bookingApi, errorMessage } from '../api/servicesApi';
import { StatusPill, formatWhen, ui } from '../components/ui';
import { colors } from '../../../theme/colors';
import { fontFamilies } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';

export const BookingDetailScreen = ({ navigation, route }) => {
  const { id } = route.params;
  const [b, setB] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setB(await bookingApi.get(id));
    } catch (e) {
      setError(errorMessage(e, 'Booking not found'));
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const run = async (fn) => {
    setBusy(true);
    try {
      setB(await fn());
    } catch (e) {
      Alert.alert('Could not update', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const confirm = (title, message, fn) =>
    Alert.alert(title, message, [{ text: 'No', style: 'cancel' }, { text: 'Yes', style: 'destructive', onPress: () => run(fn) }]);

  const submitReview = async () => {
    if (!rating) return Alert.alert('Pick a rating', 'Tap the stars to rate.');
    setBusy(true);
    try {
      await bookingApi.review(id, rating, comment.trim() || undefined);
      await load();
    } catch (e) {
      Alert.alert('Could not submit', errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const asCustomer = b?.viewerRole === 'CUSTOMER';
  const asProvider = b?.viewerRole === 'PROVIDER';

  return (
    <SafeAreaView style={ui.safe}>
      <ScreenHeader title="Booking" showBack onBack={() => navigation.goBack()} />
      {!b ? (
        error ? <Text style={[ui.error, { textAlign: 'center' }]}>{error}</Text> : <Loader message="Loading..." fullScreen />
      ) : (
        <ScrollView contentContainerStyle={ui.content}>
          <Card>
            <View style={styles.row}>
              <Text style={styles.name}>{asCustomer ? b.providerName : b.customerName || 'Customer'}</Text>
              <StatusPill status={b.status} />
            </View>
            <Text style={styles.cat}>{b.categoryName}</Text>
            <Text style={styles.when}>{formatWhen(b.scheduledAt)}</Text>
            <Text style={styles.h}>Work needed</Text>
            <Text style={styles.text}>{b.description}</Text>
            {b.providerNote ? (<><Text style={styles.h}>Note from provider</Text><Text style={styles.text}>{b.providerNote}</Text></>) : null}
          </Card>

          <Card style={{ marginTop: spacing.md }}>
            <Text style={styles.h}>{asCustomer ? 'Provider contact' : 'Customer contact'}</Text>
            {b.contactVisible ? (
              <>
                <Text style={styles.text}>{b.otherPartyPhone}</Text>
                <Text style={styles.text}>{b.otherPartyAddress}</Text>
                {b.otherPartyPhone ? (
                  <CustomButton title="Call" icon={<Ionicons name="call" size={18} color="#FFF" />} onPress={() => Linking.openURL(`tel:${b.otherPartyPhone}`)} style={{ marginTop: spacing.md }} />
                ) : null}
              </>
            ) : (
              <View style={styles.lock}>
                <Ionicons name="lock-closed" size={16} color={colors.muted} />
                <Text style={styles.lockText}>Phone and address are shared once the booking is accepted.</Text>
              </View>
            )}
          </Card>

          <View style={{ marginTop: spacing.lg }}>
            {asProvider && b.status === 'PENDING' ? (
              <>
                <CustomButton title="Accept" onPress={() => run(() => bookingApi.accept(id))} loading={busy} />
                <CustomButton title="Decline" variant="secondary" icon={<Ionicons name="close" size={18} color={colors.primaryRed} />} onPress={() => confirm('Decline booking?', 'The customer will be told.', () => bookingApi.reject(id))} style={{ marginTop: spacing.sm }} />
              </>
            ) : null}
            {asProvider && b.status === 'ACCEPTED' ? (
              <CustomButton title="Mark as Completed" onPress={() => run(() => bookingApi.complete(id))} loading={busy} />
            ) : null}
            {(asCustomer && (b.status === 'PENDING' || b.status === 'ACCEPTED')) || (asProvider && b.status === 'ACCEPTED') ? (
              <CustomButton title="Cancel Booking" variant="secondary" icon={<Ionicons name="close-circle" size={18} color={colors.primaryRed} />} onPress={() => confirm('Cancel booking?', 'The other person will be told.', () => bookingApi.cancel(id))} style={{ marginTop: spacing.sm }} />
            ) : null}
          </View>

          {asCustomer && b.status === 'COMPLETED' ? (
            b.reviewed ? (
              <Card style={{ marginTop: spacing.md }}>
                <Text style={styles.h}>Your rating</Text>
                <View style={{ flexDirection: 'row', marginTop: 6 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Ionicons key={n} name={n <= (b.rating || 0) ? 'star' : 'star-outline'} size={24} color="#F59E0B" />
                  ))}
                </View>
              </Card>
            ) : (
              <Card style={{ marginTop: spacing.md }}>
                <Text style={styles.h}>Rate this service</Text>
                <View style={{ flexDirection: 'row', marginVertical: spacing.sm }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <TouchableOpacity key={n} onPress={() => setRating(n)} hitSlop={6}>
                      <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={32} color="#F59E0B" />
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput style={styles.textarea} multiline placeholder="Write a short review (optional)" value={comment} onChangeText={setComment} maxLength={500} />
                <CustomButton title="Submit Review" onPress={submitReview} loading={busy} style={{ marginTop: spacing.md }} />
              </Card>
            )
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { flex: 1, fontFamily: fontFamilies.extraBold, fontSize: 17, color: colors.navyDark, marginRight: 8 },
  cat: { fontFamily: fontFamilies.regular, fontSize: 12.5, color: colors.muted, marginTop: 2 },
  when: { fontFamily: fontFamilies.bold, fontSize: 13, color: colors.modules.services.main, marginTop: 6 },
  h: { fontFamily: fontFamilies.bold, fontSize: 13, color: colors.navyDark, marginTop: spacing.md },
  text: { fontFamily: fontFamilies.regular, fontSize: 13.5, color: colors.navyDark, marginTop: 4, lineHeight: 19 },
  lock: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  lockText: { flex: 1, marginLeft: 8, fontFamily: fontFamilies.regular, fontSize: 12.5, color: colors.muted },
  textarea: { minHeight: 70, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 10, textAlignVertical: 'top', fontFamily: fontFamilies.regular },
});

export default BookingDetailScreen;
