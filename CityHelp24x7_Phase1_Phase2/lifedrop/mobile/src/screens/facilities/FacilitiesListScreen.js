import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCity } from '../../context/CityContext';
import facilityApi from '../../api/facilityApi';
import { useLocation } from '../../hooks/useLocation';
import ScreenHeader from '../../components/ScreenHeader';
import FacilityCard from '../../components/FacilityCard';
import EmptyState from '../../components/EmptyState';
import Loader from '../../components/Loader';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';

const TYPES = [
  { key: 'BLOOD_BANK', label: 'Blood Banks' },
  { key: 'HOSPITAL', label: 'Hospitals' },
];

export const FacilitiesListScreen = ({ navigation, route }) => {
  const { selectedCity } = useCity();
  const { requestLocation } = useLocation();
  const [type, setType] = useState(route?.params?.type || 'BLOOD_BANK');
  const [q, setQ] = useState('');
  const [open24, setOpen24] = useState(false);
  const [nearMe, setNearMe] = useState(false);
  const [coords, setCoords] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await facilityApi.search({
        type,
        cityId: selectedCity?.id,
        q: q.trim() || undefined,
        open24x7: open24,
        lat: nearMe && coords ? coords.latitude : undefined,
        lng: nearMe && coords ? coords.longitude : undefined,
        size: 50,
      });
      setItems(res?.content || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not load list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [type, selectedCity?.id, q, open24, nearMe, coords]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(load, q ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const toggleNear = async () => {
    if (nearMe) return setNearMe(false);
    const loc = await requestLocation();
    if (loc) {
      setCoords(loc);
      setNearMe(true);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Blood Banks & Hospitals"
        subtitle={selectedCity ? `In ${selectedCity.name}` : 'All cities'}
        showBack
        onBack={() => navigation.goBack()}
      />
      <View style={styles.tabs}>
        {TYPES.map((t) => (
          <TouchableOpacity key={t.key} onPress={() => setType(t.key)} style={[styles.tab, type === t.key && styles.tabOn]}>
            <Text style={[styles.tabText, type === t.key && styles.tabTextOn]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={colors.muted} />
        <TextInput style={styles.input} placeholder="Search by name" value={q} onChangeText={setQ} placeholderTextColor={colors.lightMuted} />
      </View>
      <View style={styles.filters}>
        <TouchableOpacity onPress={() => setOpen24(!open24)} style={[styles.pill, open24 && styles.pillOn]}>
          <Text style={[styles.pillText, open24 && styles.pillTextOn]}>Open 24x7</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleNear} style={[styles.pill, nearMe && styles.pillOn]}>
          <Text style={[styles.pillText, nearMe && styles.pillTextOn]}>Near me</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Loader message="Loading..." fullScreen />
      ) : error ? (
        <EmptyState iconName="alert-circle-outline" title="Something went wrong" description={error} actionTitle="Retry" onAction={load} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ padding: spacing.screenPadding }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={<EmptyState iconName="business-outline" title="Nothing found" description="Try another filter or city." />}
          renderItem={({ item }) => (
            <FacilityCard facility={item} onPress={() => navigation.navigate('FacilityDetail', { id: item.id, facility: item })} />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.pageBg },
  tabs: { flexDirection: 'row', marginHorizontal: spacing.screenPadding, backgroundColor: '#F1F5F9', borderRadius: radii.button, padding: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radii.button - 2 },
  tabOn: { backgroundColor: '#FFF' },
  tabText: { fontFamily: fontFamilies.bold, fontSize: 13, color: colors.muted },
  tabTextOn: { color: colors.primaryRed },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: radii.button, borderWidth: 1, borderColor: '#E2E8F0', marginHorizontal: spacing.screenPadding, marginTop: spacing.sm, paddingHorizontal: 12 },
  input: { flex: 1, paddingVertical: 10, marginLeft: 8, fontFamily: fontFamilies.regular, fontSize: 13.5, color: colors.navyDark },
  filters: { flexDirection: 'row', paddingHorizontal: spacing.screenPadding, marginTop: spacing.sm },
  pill: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginRight: 8, backgroundColor: '#FFF' },
  pillOn: { backgroundColor: colors.primaryRed, borderColor: colors.primaryRed },
  pillText: { fontFamily: fontFamilies.bold, fontSize: 12, color: colors.muted },
  pillTextOn: { color: '#FFF' },
});

export default FacilitiesListScreen;
