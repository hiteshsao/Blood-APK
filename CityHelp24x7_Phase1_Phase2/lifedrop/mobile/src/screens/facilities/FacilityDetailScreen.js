import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import facilityApi from '../../api/facilityApi';
import ScreenHeader from '../../components/ScreenHeader';
import CustomButton from '../../components/CustomButton';
import Card from '../../components/Card';
import Loader from '../../components/Loader';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const Row = ({ icon, text }) =>
  text ? (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={colors.muted} />
      <Text style={styles.rowText}>{text}</Text>
    </View>
  ) : null;

export const FacilityDetailScreen = ({ navigation, route }) => {
  const { id, facility: initial } = route.params || {};
  const [f, setF] = useState(initial || null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    facilityApi
      .getById(id)
      .then((d) => alive && setF(d))
      .catch((e) => alive && !initial && setError(e?.response?.data?.message || 'Not found'));
    return () => {
      alive = false;
    };
  }, [id]);

  const call = (n) => Linking.openURL(`tel:${n}`);
  const openMap = () => {
    if (f.latitude == null || f.longitude == null) return;
    const url = Platform.select({
      ios: `http://maps.apple.com/?ll=${f.latitude},${f.longitude}&q=${encodeURIComponent(f.name)}`,
      default: `https://www.google.com/maps/search/?api=1&query=${f.latitude},${f.longitude}`,
    });
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title={f?.name || 'Details'} showBack onBack={() => navigation.goBack()} />
      {!f ? (
        error ? <Text style={styles.err}>{error}</Text> : <Loader message="Loading..." fullScreen />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.screenPadding }}>
          <Card>
            <Text style={styles.type}>{f.type === 'BLOOD_BANK' ? 'BLOOD BANK' : 'HOSPITAL'}{f.open24x7 ? '  •  OPEN 24x7' : ''}</Text>
            <Text style={styles.name}>{f.name}</Text>
            <Row icon="location-outline" text={f.address} />
            <Row icon="call-outline" text={f.phone} />
            <Row icon="alert-circle-outline" text={f.emergencyPhone ? `Emergency: ${f.emergencyPhone}` : null} />
            <Row icon="information-circle-outline" text={f.notes} />
            {f.sample ? <Text style={styles.sample}>Sample data. Call to confirm before visiting.</Text> : null}
          </Card>
          {f.phone ? <CustomButton title="Call" icon={<Ionicons name="call" size={18} color="#FFF" />} onPress={() => call(f.phone)} style={styles.btn} /> : null}
          {f.emergencyPhone ? <CustomButton title="Call Emergency" variant="secondary" icon={<Ionicons name="alert-circle" size={18} color={colors.primaryRed} />} onPress={() => call(f.emergencyPhone)} style={styles.btn} /> : null}
          {f.latitude != null ? <CustomButton title="Open in Maps" variant="secondary" icon={<Ionicons name="map" size={18} color={colors.primaryRed} />} onPress={openMap} style={styles.btn} /> : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.pageBg },
  type: { fontFamily: fontFamilies.extraBold, fontSize: 11, letterSpacing: 0.8, color: colors.primaryRed },
  name: { fontFamily: fontFamilies.extraBold, fontSize: 19, color: colors.navyDark, marginVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10 },
  rowText: { flex: 1, marginLeft: 10, fontFamily: fontFamilies.regular, fontSize: 13.5, color: colors.navyDark },
  sample: { marginTop: 12, fontFamily: fontFamilies.medium, fontSize: 12, color: '#92400E' },
  btn: { marginTop: spacing.md },
  err: { textAlign: 'center', marginTop: 40, color: colors.danger, fontFamily: fontFamilies.medium },
});

export default FacilityDetailScreen;
