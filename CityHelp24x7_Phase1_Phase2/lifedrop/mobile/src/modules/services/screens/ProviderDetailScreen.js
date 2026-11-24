import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Linking, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import ScreenHeader from '../../../components/ScreenHeader';
import CustomButton from '../../../components/CustomButton';
import Card from '../../../components/Card';
import Loader from '../../../components/Loader';
import { servicesApi, errorMessage } from '../api/servicesApi';
import { Stars, formatPrice, formatWhen, ui, svc } from '../components/ui';
import { colors } from '../../../theme/colors';
import { fontFamilies } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';

export const ProviderDetailScreen = ({ navigation, route }) => {
  const { id } = route.params;
  const [p, setP] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const [prov, revs] = await Promise.all([servicesApi.getProvider(id), servicesApi.getReviews(id).catch(() => [])]);
      setP(prov);
      setReviews(revs);
    } catch (e) {
      setError(errorMessage(e, 'Provider not found'));
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const sendReport = async () => {
    if (!reason.trim()) return;
    setSending(true);
    try {
      await servicesApi.reportProvider(id, reason.trim());
      setReportOpen(false);
      setReason('');
      Alert.alert('Thanks', 'Your report was submitted.');
    } catch (e) {
      Alert.alert('Could not report', errorMessage(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={ui.safe}>
      <ScreenHeader title="Provider" showBack onBack={() => navigation.goBack()} />
      {!p ? (
        error ? <Text style={[ui.error, { textAlign: 'center' }]}>{error}</Text> : <Loader message="Loading..." fullScreen />
      ) : (
        <ScrollView contentContainerStyle={ui.content}>
          <Card>
            <View style={styles.top}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{p.displayName.charAt(0).toUpperCase()}</Text></View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.name}>{p.displayName}</Text>
                  {p.verificationStatus === 'VERIFIED' ? <Ionicons name="checkmark-circle" size={18} color="#16A34A" style={{ marginLeft: 6 }} /> : null}
                </View>
                <Text style={styles.cat}>{p.categoryName}</Text>
                {p.ratingCount > 0 ? <Stars value={p.ratingAvg} count={p.ratingCount} size={15} /> : <Text style={styles.cat}>No reviews yet</Text>}
              </View>
            </View>
            <View style={styles.facts}>
              <Text style={styles.fact}>{p.experienceYears != null ? `${p.experienceYears} yrs experience` : 'Experience not listed'}</Text>
              <Text style={styles.fact}>{formatPrice(p)}</Text>
            </View>
            {p.description ? <Text style={styles.desc}>{p.description}</Text> : null}
            {!p.available ? <Text style={styles.busy}>Currently not taking bookings</Text> : null}
          </Card>

          <Card style={{ marginTop: spacing.md }}>
            <Text style={styles.h}>Contact</Text>
            {p.contactVisible ? (
              <>
                <Text style={styles.row}>{p.phone}</Text>
                <Text style={styles.row}>{p.address}</Text>
                {p.phone ? <CustomButton title="Call" icon={<Ionicons name="call" size={18} color="#FFF" />} onPress={() => Linking.openURL(`tel:${p.phone}`)} style={{ marginTop: spacing.md }} /> : null}
              </>
            ) : (
              <View style={styles.lock}>
                <Ionicons name="lock-closed" size={16} color={colors.muted} />
                <Text style={styles.lockText}>Phone and address are shared after the provider accepts your booking.</Text>
              </View>
            )}
          </Card>

          <Text style={[styles.h, { marginTop: spacing.lg }]}>Reviews</Text>
          {reviews.length === 0 ? <Text style={styles.cat}>No reviews yet.</Text> : reviews.map((r) => (
            <Card key={r.id} style={{ marginTop: spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.reviewer}>{r.customerName || 'Customer'}</Text>
                <Stars value={r.rating} />
              </View>
              {r.comment ? <Text style={styles.desc}>{r.comment}</Text> : null}
              <Text style={styles.date}>{formatWhen(r.createdAt)}</Text>
            </Card>
          ))}

          <Text style={styles.report} onPress={() => setReportOpen(true)}>Report this provider</Text>
        </ScrollView>
      )}

      {p && p.verificationStatus === 'VERIFIED' && p.available ? (
        <View style={styles.footer}>
          <CustomButton title="Book Now" onPress={() => navigation.navigate('BookService', { provider: p })} />
        </View>
      ) : null}

      <Modal visible={reportOpen} transparent animationType="fade" onRequestClose={() => setReportOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.modal}>
            <Text style={styles.h}>Report provider</Text>
            <TextInput style={styles.textarea} multiline placeholder="What went wrong?" value={reason} onChangeText={setReason} maxLength={500} />
            <CustomButton title="Submit report" onPress={sendReport} loading={sending} style={{ marginTop: spacing.md }} />
            <Text style={styles.cancel} onPress={() => setReportOpen(false)}>Cancel</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: svc.tint, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  avatarText: { fontFamily: fontFamilies.extraBold, fontSize: 24, color: svc.main },
  name: { fontFamily: fontFamilies.extraBold, fontSize: 18, color: colors.navyDark },
  cat: { fontFamily: fontFamilies.regular, fontSize: 12.5, color: colors.muted, marginVertical: 2 },
  facts: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  fact: { fontFamily: fontFamilies.bold, fontSize: 12.5, color: colors.navyDark },
  desc: { fontFamily: fontFamilies.regular, fontSize: 13, color: colors.navyDark, marginTop: spacing.sm, lineHeight: 19 },
  busy: { fontFamily: fontFamilies.bold, fontSize: 12, color: '#92400E', marginTop: spacing.sm },
  h: { fontFamily: fontFamilies.bold, fontSize: 15, color: colors.navyDark },
  row: { fontFamily: fontFamilies.medium, fontSize: 13.5, color: colors.navyDark, marginTop: 8 },
  lock: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  lockText: { flex: 1, marginLeft: 8, fontFamily: fontFamilies.regular, fontSize: 12.5, color: colors.muted },
  reviewer: { fontFamily: fontFamilies.bold, fontSize: 13, color: colors.navyDark },
  date: { fontFamily: fontFamilies.regular, fontSize: 11, color: colors.lightMuted, marginTop: 6 },
  report: { textAlign: 'center', fontFamily: fontFamilies.medium, fontSize: 12.5, color: colors.muted, marginTop: spacing.xl, textDecorationLine: 'underline' },
  footer: { padding: spacing.screenPadding, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'center', padding: spacing.screenPadding },
  modal: { backgroundColor: '#FFF', borderRadius: 20, padding: spacing.lg },
  textarea: { minHeight: 90, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 10, marginTop: spacing.md, textAlignVertical: 'top', fontFamily: fontFamilies.regular },
  cancel: { textAlign: 'center', marginTop: spacing.md, fontFamily: fontFamilies.bold, color: colors.muted },
});

export default ProviderDetailScreen;
