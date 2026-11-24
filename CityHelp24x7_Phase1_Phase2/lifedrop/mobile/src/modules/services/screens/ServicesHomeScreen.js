import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCity } from '../../../context/CityContext';
import HomeHeader from '../../../components/HomeHeader';
import CitySelectorSheet from '../../../components/CitySelectorSheet';
import SectionHeader from '../../../components/SectionHeader';
import ModuleBanner from '../../../components/ModuleBanner';
import { servicesApi } from '../api/servicesApi';
import ProviderCard from '../components/ProviderCard';
import { ui, svc } from '../components/ui';
import { colors } from '../../../theme/colors';
import { fontFamilies } from '../../../theme/typography';
import { spacing, radii } from '../../../theme/spacing';

export const ServicesHomeScreen = ({ navigation }) => {
  const { cities, selectedCity, selectCity } = useCity();
  const [cityOpen, setCityOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [top, setTop] = useState([]);
  const [q, setQ] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const [cats, res] = await Promise.all([
        servicesApi.getCategories(),
        servicesApi.searchProviders({ cityId: selectedCity?.id, sort: 'rating', size: 5 }),
      ]);
      setCategories(cats);
      setTop(res?.content || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not load services');
    } finally {
      setRefreshing(false);
    }
  }, [selectedCity?.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const open = (cat) => navigation.navigate('ProviderList', { categoryId: cat?.id, categoryName: cat?.name });
  const search = () => navigation.navigate('ProviderList', { q: q.trim() });
  const shown = showAll ? categories : categories.filter((c) => c.featured);

  return (
    <SafeAreaView style={ui.safe}>
      <HomeHeader
        cityLabel={selectedCity ? `${selectedCity.name}, ${selectedCity.state}` : null}
        onCityPress={() => setCityOpen(true)}
      />
      <ScrollView
        contentContainerStyle={ui.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <Text style={styles.title}>Home Services</Text>
        <Text style={styles.sub}>Trusted, verified professionals near you</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            style={styles.input}
            placeholder="Search electrician, plumber..."
            placeholderTextColor={colors.lightMuted}
            value={q}
            onChangeText={setQ}
            onSubmitEditing={search}
            returnKeyType="search"
          />
        </View>

        {error ? <Text style={ui.error}>{error}</Text> : null}

        <SectionHeader
          title="Categories"
          actionLabel={showAll ? 'Show Less' : 'View All'}
          onActionPress={() => setShowAll(!showAll)}
          color={svc.main}
        />
        <View style={styles.grid}>
          {shown.map((c) => (
            <TouchableOpacity key={c.id} style={styles.cat} activeOpacity={0.85} onPress={() => open(c)}>
              <View style={styles.catIcon}>
                <Ionicons name={c.icon || 'construct-outline'} size={24} color={svc.main} />
              </View>
              <Text style={styles.catText} numberOfLines={2}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionHeader title="Top Rated Near You" actionLabel="See All" onActionPress={() => open(null)} color={svc.main} />
        {top.length === 0 ? (
          <Text style={styles.empty}>No providers in this city yet. Be the first one to join!</Text>
        ) : (
          top.map((p) => (
            <ProviderCard key={p.id} provider={p} onPress={() => navigation.navigate('ProviderDetail', { id: p.id })} />
          ))
        )}

        <ModuleBanner
          title="Are you a professional?"
          subtitle="Join as a service provider and get bookings from your city."
          icon="briefcase"
          color={svc.main}
          tint={svc.tint}
          onPress={() => navigation.navigate('ProviderHub')}
        />
      </ScrollView>
      <CitySelectorSheet visible={cityOpen} onClose={() => setCityOpen(false)} cities={cities} selectedId={selectedCity?.id} onSelect={selectCity} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  title: { fontFamily: fontFamilies.extraBold, fontSize: 22, color: colors.navyDark, marginTop: spacing.sm },
  sub: { fontFamily: fontFamilies.regular, fontSize: 13, color: colors.muted, marginBottom: spacing.md },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: radii.button, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 14 },
  input: { flex: 1, paddingVertical: 12, marginLeft: 8, fontFamily: fontFamilies.regular, fontSize: 14, color: colors.navyDark },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cat: { width: '25%', alignItems: 'center', marginBottom: spacing.lg },
  catIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6EDFA', alignItems: 'center', justifyContent: 'center' },
  catText: { fontFamily: fontFamilies.bold, fontSize: 11, color: colors.navyDark, textAlign: 'center', marginTop: 6, paddingHorizontal: 2 },
  empty: { fontFamily: fontFamilies.regular, fontSize: 13, color: colors.muted, marginVertical: spacing.md },
});

export default ServicesHomeScreen;
