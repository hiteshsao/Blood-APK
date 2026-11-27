import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../../../components/ScreenHeader';
import InputField from '../../../components/InputField';
import CustomButton from '../../../components/CustomButton';
import { bookingApi, errorMessage } from '../api/servicesApi';
import { Chip, ui, svc } from '../components/ui';
import { colors } from '../../../theme/colors';
import { fontFamilies } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';

const SLOTS = [8, 10, 12, 14, 16, 18];
const pad = (n) => String(n).padStart(2, '0');
const slotLabel = (h) => `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? 'AM' : 'PM'}`;

/** Local date-time string without timezone, the format the backend expects (LocalDateTime). */
const toLocalIso = (d, hour) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hour)}:00:00`;

export const BookServiceScreen = ({ navigation, route }) => {
  const { provider } = route.params;
  const days = useMemo(() => {
    const out = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      out.push(d);
    }
    return out;
  }, []);
  const [dayIdx, setDayIdx] = useState(0);
  const [hour, setHour] = useState(null);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isPast = (d, h) => {
    const t = new Date(d);
    t.setHours(h, 0, 0, 0);
    return t.getTime() <= Date.now();
  };

  const submit = async () => {
    if (hour == null) return setError('Pick a time slot');
    if (!description.trim()) return setError('Describe the work needed');
    if (!address.trim()) return setError('Enter the address where work is needed');
    setError('');
    setSaving(true);
    try {
      const booking = await bookingApi.create({
        providerId: provider.id,
        scheduledAt: toLocalIso(days[dayIdx], hour),
        description: description.trim(),
        address: address.trim(),
      });
      Alert.alert('Request sent', `${provider.displayName} will reply soon. You will be notified.`, [
        { text: 'View booking', onPress: () => navigation.replace('BookingDetail', { id: booking.id }) },
      ]);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={ui.safe}>
      <ScreenHeader title="Book Service" subtitle={provider.displayName} showBack onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
          <Text style={ui.label}>Day</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {days.map((d, i) => (
              <TouchableOpacity key={i} onPress={() => { setDayIdx(i); setHour(null); }} style={[styles.day, dayIdx === i && styles.dayOn]}>
                <Text style={[styles.dayTop, dayIdx === i && styles.dayTextOn]}>{i === 0 ? 'Today' : d.toLocaleDateString([], { weekday: 'short' })}</Text>
                <Text style={[styles.dayNum, dayIdx === i && styles.dayTextOn]}>{d.getDate()}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={ui.label}>Time</Text>
          <View style={styles.slots}>
            {SLOTS.map((h) => {
              const past = isPast(days[dayIdx], h);
              return (
                <View key={h} style={{ opacity: past ? 0.35 : 1, marginBottom: 8 }}>
                  <Chip label={slotLabel(h)} active={hour === h} onPress={() => !past && setHour(h)} />
                </View>
              );
            })}
          </View>

          <InputField label="What work is needed?" value={description} onChangeText={setDescription} placeholder="e.g. Ceiling fan not working" autoCapitalize="sentences" />
          <InputField label="Address" value={address} onChangeText={setAddress} placeholder="House no, street, landmark" autoCapitalize="sentences" />

          <Text style={styles.note}>Your address and phone are shared with the provider only after they accept.</Text>
          {error ? <Text style={ui.error}>{error}</Text> : null}
          <CustomButton title="Send Request" onPress={submit} loading={saving} style={{ marginTop: spacing.lg }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  day: { width: 62, paddingVertical: 10, borderRadius: 14, alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', marginRight: 8 },
  dayOn: { backgroundColor: svc.main, borderColor: svc.main },
  dayTop: { fontFamily: fontFamilies.medium, fontSize: 11, color: colors.muted },
  dayNum: { fontFamily: fontFamilies.extraBold, fontSize: 18, color: colors.navyDark, marginTop: 2 },
  dayTextOn: { color: '#FFF' },
  slots: { flexDirection: 'row', flexWrap: 'wrap' },
  note: { fontFamily: fontFamilies.regular, fontSize: 12, color: colors.muted, marginTop: spacing.sm },
});

export default BookServiceScreen;
