import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useCity } from '../../context/CityContext';
import SectionHeader from '../../components/SectionHeader';
import FadeInUp from '../../components/FadeInUp';
import { servicesApi, bookingApi } from './api/servicesApi';
import { Stars, StatusPill, formatPrice, formatWhen } from './components/ui';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

const brand = colors.brand;
const ACTIVE_BOOKING = ['PENDING', 'ACCEPTED'];
const MAX_TILES = 7; // + "More" = two rows of four

const TRUST = [
  { icon: 'shield-checkmark', label: 'Verified pros' },
  { icon: 'star', label: 'Rated by locals' },
  { icon: 'pricetag', label: 'Clear prices' },
];

/**
 * Services-first Home feed (shown when features.services is ON):
 * search, hero, category grid, the next active booking and top-rated providers.
 */
export const HomeServicesSection = ({ navigation }) => {
  const { selectedCity } = useCity();
  const [categories, setCategories] = useState([]);
  const [top, setTop] = useState([]);
  const [nextBooking, setNextBooking] = useState(null);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    const [cats, providers, mine] = await Promise.all([
      servicesApi.getCategories().catch(() => []),
      servicesApi.searchProviders({ cityId: selectedCity?.id, sort: 'rating', size: 6 }).catch(() => null),
      bookingApi.mine().catch(() => []),
    ]);
    const sorted = [...cats].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
    setCategories(sorted);
    setTop(providers?.content || []);
    const upcoming = (mine || [])
      .filter((b) => ACTIVE_BOOKING.includes(b.status))
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    setNextBooking(upcoming[0] || null);
  }, [selectedCity?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const search = () => {
    const term = q.trim();
    if (term) navigation.navigate('ProviderList', { q: term });
  };
  const openCategory = (c) => navigation.navigate('ProviderList', { categoryId: c.id, categoryName: c.name });
  const tiles = categories.slice(0, MAX_TILES);
  const cityName = selectedCity?.name || 'your city';

  return (
    <View>
      {/* Search */}
      <FadeInUp delay={90}>
      <View style={[styles.search, shadows.cardSoft]}>
        <Ionicons name="search" size={19} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search electrician, plumber, AC repair..."
          placeholderTextColor={colors.lightMuted}
          value={q}
          onChangeText={setQ}
          onSubmitEditing={search}
          returnKeyType="search"
        />
        {q ? (
          <TouchableOpacity onPress={search} style={styles.searchGo} accessibilityLabel="Search">
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        ) : null}
      </View>
      </FadeInUp>

      {/* Hero */}
      <FadeInUp delay={180} distance={26} fromScale={0.96}>
      <LinearGradient
        colors={colors.gradients.brandHero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, shadows.brandGlow]}
      >
        <View style={styles.heroCircleLg} />
        <View style={styles.heroCircleSm} />
        <MaterialCommunityIcons name="account-hard-hat" size={92} color="rgba(255,255,255,0.9)" style={styles.heroArt} />
        <View style={styles.heroPill}>
          <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" />
          <Text style={styles.heroPillText}>VERIFIED EXPERTS</Text>
        </View>
        <Text style={styles.heroTitle}>Home services,{'\n'}right on time.</Text>
        <Text style={styles.heroSub}>Trusted local pros in {cityName}</Text>
        <TouchableOpacity activeOpacity={0.9} style={styles.heroBtn} onPress={() => navigation.navigate('Services')}>
          <Text style={styles.heroBtnText}>Book a service</Text>
          <Ionicons name="arrow-forward" size={16} color={brand.main} />
        </TouchableOpacity>
      </LinearGradient>
      </FadeInUp>

      {/* Trust strip */}
      <FadeInUp delay={300} style={styles.trustRow}>
        {TRUST.map((t) => (
          <View key={t.label} style={styles.trustItem}>
            <Ionicons name={t.icon} size={14} color={brand.main} />
            <Text style={styles.trustText}>{t.label}</Text>
          </View>
        ))}
      </FadeInUp>

      {/* Categories: tiles pop in one after another */}
      <FadeInUp delay={360}>
        <SectionHeader title="Services" actionLabel="View all" onActionPress={() => navigation.navigate('Services')} />
      </FadeInUp>
      <View style={styles.grid}>
        {tiles.map((c, i) => (
          <FadeInUp key={c.id} delay={420 + i * 55} distance={10} fromScale={0.7} style={styles.tile}>
            <TouchableOpacity style={styles.tileInner} activeOpacity={0.85} onPress={() => openCategory(c)}>
              <View style={styles.tileIcon}>
                <Ionicons name={c.icon || 'construct-outline'} size={25} color={brand.main} />
              </View>
              <Text style={styles.tileText} numberOfLines={2}>
                {c.name}
              </Text>
            </TouchableOpacity>
          </FadeInUp>
        ))}
        {categories.length > 0 ? (
          <FadeInUp delay={420 + tiles.length * 55} distance={10} fromScale={0.7} style={styles.tile}>
            <TouchableOpacity style={styles.tileInner} activeOpacity={0.85} onPress={() => navigation.navigate('Services')}>
              <View style={[styles.tileIcon, styles.tileIconMore]}>
                <Ionicons name="grid" size={22} color={colors.navySlate} />
              </View>
              <Text style={styles.tileText}>More</Text>
            </TouchableOpacity>
          </FadeInUp>
        ) : null}
      </View>

      {/* Next booking */}
      {nextBooking ? (
        <FadeInUp>
        <TouchableOpacity
          activeOpacity={0.88}
          style={[styles.bookingCard, shadows.cardSoft]}
          onPress={() => navigation.navigate('BookingDetail', { id: nextBooking.id })}
        >
          <View style={styles.bookingIcon}>
            <Ionicons name="calendar" size={20} color={brand.main} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bookingLabel}>YOUR NEXT BOOKING</Text>
            <Text style={styles.bookingTitle} numberOfLines={1}>
              {nextBooking.categoryName} · {nextBooking.providerName}
            </Text>
            <Text style={styles.bookingWhen}>{formatWhen(nextBooking.scheduledAt)}</Text>
          </View>
          <StatusPill status={nextBooking.status} />
        </TouchableOpacity>
        </FadeInUp>
      ) : null}

      {/* Top rated */}
      <FadeInUp delay={700}>
      <SectionHeader
        title="Top rated near you"
        actionLabel="See all"
        onActionPress={() => navigation.navigate('ProviderList', {})}
      />
      {top.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="people-outline" size={22} color={colors.muted} />
          <Text style={styles.emptyText}>No verified providers in {cityName} yet. Check back soon.</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hList}
          style={styles.hScroll}
        >
          {top.map((p) => (
            <TouchableOpacity
              key={p.id}
              activeOpacity={0.9}
              style={[styles.proCard, shadows.cardSoft]}
              onPress={() => navigation.navigate('ProviderDetail', { id: p.id })}
            >
              <View style={styles.proTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(p.displayName || '?').replace(/^Sample\s+/i, '').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.verified}>
                  <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              </View>
              <Text style={styles.proName} numberOfLines={2}>
                {p.displayName}
              </Text>
              <Text style={styles.proCat} numberOfLines={1}>
                {p.categoryName}
                {p.experienceYears != null ? ` · ${p.experienceYears} yrs` : ''}
              </Text>
              <View style={styles.proMeta}>
                {p.ratingCount > 0 ? <Stars value={p.ratingAvg} count={p.ratingCount} size={13} /> : <Text style={styles.newBadge}>New</Text>}
                {p.distanceKm != null ? <Text style={styles.proDist}>{p.distanceKm} km</Text> : null}
              </View>
              <Text style={styles.proPrice}>{formatPrice(p)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      </FadeInUp>
    </View>
  );
};

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingLeft: 14,
    paddingRight: 6,
    height: 52,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    marginTop: spacing.md,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 10,
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    color: colors.navyDark,
  },
  searchGo: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: brand.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    borderRadius: 24,
    padding: spacing.xl,
    marginTop: spacing.lg,
    overflow: 'hidden',
    minHeight: 188,
  },
  heroCircleLg: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    right: -40,
    top: -30,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroCircleSm: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    right: 40,
    bottom: -50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroArt: {
    position: 'absolute',
    right: 14,
    top: 34,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroPillText: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 10.5,
    letterSpacing: 0.8,
    color: '#FFFFFF',
    marginLeft: 5,
  },
  heroTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 24,
    lineHeight: 30,
    color: '#FFFFFF',
    marginTop: spacing.md,
  },
  heroSub: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    color: '#DBEAFE',
    marginTop: 4,
  },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: spacing.lg,
  },
  heroBtnText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13.5,
    color: brand.main,
    marginRight: 6,
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EEF2F7',
    paddingVertical: 6,
    paddingHorizontal: 9,
  },
  trustText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
    color: colors.navySlate,
    marginLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  tile: {
    width: '25%',
    paddingHorizontal: 1,
    marginBottom: spacing.md,
  },
  tileInner: {
    alignItems: 'center',
  },
  tileIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileIconMore: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  tileText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 11,
    lineHeight: 14,
    color: colors.navySlate,
    textAlign: 'center',
    marginTop: 6,
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.card,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: brand.main,
    marginTop: spacing.xs,
  },
  bookingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: brand.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  bookingLabel: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: brand.main,
  },
  bookingTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    color: colors.navyDark,
    marginTop: 1,
  },
  bookingWhen: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.muted,
    marginTop: 1,
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  emptyText: {
    flex: 1,
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    color: colors.muted,
    marginLeft: spacing.md,
  },
  hScroll: {
    marginHorizontal: -spacing.screenPadding,
  },
  hList: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.sm,
  },
  proCard: {
    width: 196,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: spacing.md,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  proTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: brand.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 18,
    color: brand.main,
  },
  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  verifiedText: {
    fontFamily: fontFamilies.bold,
    fontSize: 10,
    color: '#166534',
    marginLeft: 3,
  },
  proName: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.navyDark,
    marginTop: spacing.sm,
    minHeight: 36,
  },
  proCat: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  proMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  proDist: {
    fontFamily: fontFamilies.medium,
    fontSize: 11.5,
    color: colors.muted,
    marginLeft: 8,
  },
  newBadge: {
    fontFamily: fontFamilies.bold,
    fontSize: 11,
    color: brand.main,
    backgroundColor: brand.tint,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  proPrice: {
    fontFamily: fontFamilies.bold,
    fontSize: 12.5,
    color: colors.navyDark,
    marginTop: 8,
  },
});

export default HomeServicesSection;
