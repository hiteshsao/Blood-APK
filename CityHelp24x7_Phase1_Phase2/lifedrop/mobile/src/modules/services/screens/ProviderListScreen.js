import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, ScrollView, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCity } from '../../../context/CityContext';
import { useLocation } from '../../../hooks/useLocation';
import ScreenHeader from '../../../components/ScreenHeader';
import EmptyState from '../../../components/EmptyState';
import Loader from '../../../components/Loader';
import { servicesApi } from '../api/servicesApi';
import ProviderCard from '../components/ProviderCard';
import { Chip, ui } from '../components/ui';
import { colors } from '../../../theme/colors';
import { fontFamilies } from '../../../theme/typography';
import { spacing, radii } from '../../../theme/spacing';

const SORTS = [
  { key: 'rating', label: 'Top rated' },
  { key: 'distance', label: 'Nearest' },
  { key: 'price', label: 'Lowest price' },
];

export const ProviderListScreen = ({ navigation, route }) => {
  const { categoryId, categoryName, q: initialQ } = route.params || {};
  const { selectedCity } = useCity();
  const { requestLocation } = useLocation();
  const [q, setQ] = useState(initialQ || '');
  const [sort, setSort] = useState('rating');
  const [minRating, setMinRating] = useState(0);
  const [coords, setCoords] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await servicesApi.searchProviders({
        categoryId,
        cityId: selectedCity?.id,
        q: q.trim() || undefined,
        minRating: minRating || undefined,
        sort,
        lat: coords?.latitude,
        lng: coords?.longitude,
        size: 50,
      });
      setItems(res?.content || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not load providers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryId, selectedCity?.id, q, minRating, sort, coords]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(load, q ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const pickSort = async (key) => {
    if (key === 'distance' && !coords) {
      const loc = await requestLocation();
      if (!loc) return;
      setCoords(loc);
    }
    setSort(key);
  };

  return (
    <SafeAreaView style={ui.safe}>
      <ScreenHeader
        title={categoryName || 'All Services'}
        subtitle={selectedCity ? `In ${selectedCity.name}` : undefined}
        showBack
        onBack={() => navigation.goBack()}
      />
      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color={colors.muted} />
        <TextInput style={styles.input} placeholder="Search by name" value={q} onChangeText={setQ} placeholderTextColor={colors.lightMuted} />
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {SORTS.map((s) => (
            <Chip key={s.key} label={s.label} active={sort === s.key} onPress={() => pickSort(s.key)} />
          ))}
          <Chip label="4★ & up" active={minRating === 4} onPress={() => setMinRating(minRating === 4 ? 0 : 4)} />
        </ScrollView>
      </View>
      {loading ? (
        <Loader message="Finding professionals..." fullScreen />
      ) : error ? (
        <EmptyState iconName="alert-circle-outline" title="Something went wrong" description={error} actionTitle="Retry" onAction={load} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ padding: spacing.screenPadding }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={<EmptyState iconName="construct-outline" title="No providers found" description="Try another category, city or filter." />}
          renderItem={({ item }) => <ProviderCard provider={item} onPress={() => navigation.navigate('ProviderDetail', { id: item.id })} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: radii.button, borderWidth: 1, borderColor: '#E2E8F0', marginHorizontal: spacing.screenPadding, paddingHorizontal: 12 },
  input: { flex: 1, paddingVertical: 10, marginLeft: 8, fontFamily: fontFamilies.regular, fontSize: 13.5, color: colors.navyDark },
  chips: { paddingHorizontal: spacing.screenPadding, paddingVertical: spacing.sm },
});

export default ProviderListScreen;
