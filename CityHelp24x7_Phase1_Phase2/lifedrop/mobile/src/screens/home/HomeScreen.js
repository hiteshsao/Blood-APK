import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useCity } from '../../context/CityContext';
import { useFeatures } from '../../context/AppConfigContext';
import recipientApi from '../../api/recipientApi';
import requestApi from '../../api/requestApi';
import { getActiveHomeSections } from '../../config/homeSections';
import { isDonorUser } from '../../utils/userRoles';
import HomeHeader from '../../components/HomeHeader';
import CitySelectorSheet from '../../components/CitySelectorSheet';
import SectionHeader from '../../components/SectionHeader';
import QuickAccessItem from '../../components/QuickAccessItem';
import ModuleBanner from '../../components/ModuleBanner';
import FadeInUp from '../../components/FadeInUp';
import Card from '../../components/Card';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

const blood = colors.modules.blood;

export const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const features = useFeatures();
  const { cities, selectedCity, selectCity, needsSelection } = useCity();

  const [cityOpen, setCityOpen] = useState(false);
  const [activeSos, setActiveSos] = useState(null);
  const [incomingCount, setIncomingCount] = useState(0);
  const [available, setAvailable] = useState(user?.available ?? true);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const donor = isDonorUser(user);
  const extraSections = getActiveHomeSections(features);
  const hasExtraSections = extraSections.length > 0;
  const cityLabel = selectedCity ? `${selectedCity.name}, ${selectedCity.state}` : null;

  // Ask for the city once, the first time the app has no saved selection.
  useEffect(() => {
    if (needsSelection) setCityOpen(true);
  }, [needsSelection]);

  useEffect(() => {
    setAvailable(user?.available ?? true);
  }, [user?.available]);

  const loadData = useCallback(async () => {
    try {
      const sos = await recipientApi.getActiveSos();
      setActiveSos(sos || null);
    } catch {
      setActiveSos(null);
    }
    if (donor) {
      try {
        const incoming = await requestApi.getIncomingRequests();
        setIncomingCount(Array.isArray(incoming) ? incoming.length : 0);
      } catch {
        setIncomingCount(0);
      }
    } else {
      setIncomingCount(0);
    }
  }, [donor]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const goRequestBlood = () => navigation.navigate('CreateRequest', { urgency: 'NORMAL' });

  const goDonateBlood = () => {
    if (donor) {
      navigation.navigate('RequestsHub', { segment: 'help' });
    } else {
      navigation.navigate('DonorOnboarding');
    }
  };

  const goNearbyDonors = () => navigation.navigate('NearbyDonors');
  const goBloodBanks = () => navigation.navigate('FacilitiesList', { type: 'BLOOD_BANK' });
  const goHospitals = () => navigation.navigate('FacilitiesList', { type: 'HOSPITAL' });
  const goMyRequests = () => navigation.navigate('RequestsHub', { segment: 'mine' });

  const toggleAvailability = async (value) => {
    const previous = available;
    setAvailable(value);
    setSavingAvailability(true);
    try {
      await requestApi.updateAvailability(value);
    } catch (err) {
      setAvailable(previous);
      Alert.alert('Could not update', err?.response?.data?.message || 'Please try again.');
    } finally {
      setSavingAvailability(false);
    }
  };

  const firstName = (user?.name || '').trim().split(/\s+/)[0];

  const sosBanner = activeSos ? (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.sosBanner}
      onPress={() =>
        navigation.navigate('SosStatus', {
          requestId: activeSos.id,
          donorsNotified: activeSos.matchedDonorCount,
          radiusKm: activeSos.radiusKm,
        })
      }
    >
      <View style={styles.sosDot} />
      <View style={{ flex: 1 }}>
        <Text style={styles.sosBannerTitle}>ACTIVE SOS IN PROGRESS</Text>
        <Text style={styles.sosBannerSub}>
          {activeSos.matchedDonorCount || 0} donors notified. Tap for live status.
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
    </TouchableOpacity>
  ) : null;

  const donorStrip = donor ? (
    <View style={styles.bloodDonorRow}>
      <View style={[styles.statusDot, { backgroundColor: available ? colors.success : colors.lightMuted }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.donorTitle}>{available ? 'You are available to donate' : 'Donor mode is OFF'}</Text>
        <Text style={styles.donorSub}>
          {available ? 'Nearby patients can reach you.' : 'Turn ON to get request alerts.'}
        </Text>
      </View>
      <Switch
        value={available}
        onValueChange={toggleAvailability}
        disabled={savingAvailability}
        trackColor={{ false: '#CBD5E1', true: colors.borderPink }}
        thumbColor={available ? colors.primaryRed : '#94A3B8'}
      />
    </View>
  ) : null;

  const incomingRow =
    donor && incomingCount > 0 ? (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.incomingRow}
        onPress={() => navigation.navigate('RequestsHub', { segment: 'help' })}
      >
        <Ionicons name="notifications" size={16} color={blood.main} />
        <Text style={styles.incomingText}>
          {incomingCount} blood request{incomingCount > 1 ? 's' : ''} need your help
        </Text>
        <Ionicons name="chevron-forward" size={16} color={blood.main} />
      </TouchableOpacity>
    ) : null;

  // Home order: Blood (main service) first, then home services, then the partner banner.
  const renderBloodHelp = () => (
    <View>
      <FadeInUp delay={90} distance={26} fromScale={0.96}>
        <LinearGradient
          colors={colors.gradients.sos}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bloodHero, shadows.sosGlow]}
        >
          <View style={styles.heroCircle} />
          <MaterialCommunityIcons name="heart-pulse" size={96} color="rgba(255,255,255,0.2)" style={styles.bloodHeroArt} />
          <View style={styles.bloodHeroPill}>
            <Ionicons name="water" size={12} color="#FFFFFF" />
            <Text style={styles.bloodHeroPillText}>BLOOD SERVICE • 24x7</Text>
          </View>
          <Text style={styles.bloodHeroTitle}>Need blood?{'\n'}Donors near you, fast.</Text>
          <Text style={styles.bloodHeroSub}>Free and direct. No middlemen.</Text>
          <View style={styles.bloodBtns}>
            <TouchableOpacity activeOpacity={0.9} style={[styles.bloodBtn, styles.bloodBtnWhite]} onPress={goRequestBlood}>
              <Ionicons name="add-circle" size={17} color={blood.main} />
              <Text style={[styles.bloodBtnText, { color: blood.main }]}>Request Blood</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.9} style={[styles.bloodBtn, styles.bloodBtnGhost]} onPress={goDonateBlood}>
              <Ionicons name="heart" size={16} color="#FFFFFF" />
              <Text style={[styles.bloodBtnText, { color: '#FFFFFF' }]}>Donate Blood</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </FadeInUp>
      <FadeInUp delay={220}>
      <View style={[styles.bloodCard, shadows.cardSoft]}>
        {donorStrip ? <View style={[styles.bloodDonorWrap, { marginTop: 0, marginBottom: spacing.md }]}>{donorStrip}</View> : null}
        {incomingRow ? <View style={{ marginBottom: spacing.md }}>{incomingRow}</View> : null}
        <View style={styles.bloodQuick}>
          <QuickAccessItem icon="people-outline" label="Nearby Donors" onPress={goNearbyDonors} color={blood.main} tint={blood.tint} />
          <QuickAccessItem icon="business-outline" label="Blood Banks" onPress={goBloodBanks} color={blood.main} tint={blood.tint} />
          <QuickAccessItem icon="medkit-outline" label="Hospitals" onPress={goHospitals} color={colors.modules.directory.main} tint={colors.modules.directory.tint} />
          <QuickAccessItem icon="document-text-outline" label="My Requests" onPress={goMyRequests} color={colors.modules.news.main} tint={colors.modules.news.tint} />
        </View>
      </View>
      </FadeInUp>
    </View>
  );

  const homeSections = [
    ...extraSections.map(({ id, order, Component }) => ({
      id,
      order,
      render: () => <Component navigation={navigation} />,
    })),
    { id: 'blood', order: 5, render: renderBloodHelp },
  ].sort((a, b) => a.order - b.order);

  const gridCards = [
    { key: 'request', icon: 'water', title: 'Request Blood', sub: 'Need blood in emergency?', onPress: goRequestBlood },
    { key: 'donate', icon: 'heart', title: 'Donate Blood', sub: 'Be a hero. Save lives.', onPress: goDonateBlood },
    { key: 'donors', icon: 'people', title: 'Nearby Donors', sub: 'Find donors near you', onPress: goNearbyDonors },
    { key: 'banks', icon: 'business', title: 'Blood Banks', sub: 'Find nearby blood banks', onPress: goBloodBanks },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <HomeHeader cityLabel={cityLabel} onCityPress={() => setCityOpen(true)} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[hasExtraSections ? colors.brand.main : colors.primaryRed]}
            tintColor={hasExtraSections ? colors.brand.main : colors.primaryRed}
          />
        }
      >
        {hasExtraSections ? (
          <>
            <FadeInUp style={styles.greeting}>
              <Text style={styles.greetingTitle}>{firstName ? `Hi, ${firstName} 👋` : 'Hi there 👋'}</Text>
              <Text style={styles.greetingSub}>What do you need help with today?</Text>
            </FadeInUp>
            {sosBanner}
            {homeSections.map((section) => (
              <React.Fragment key={section.id}>{section.render()}</React.Fragment>
            ))}
          </>
        ) : (
          <>
        {sosBanner}

        {/* BLOOD SERVICE hero */}
        <LinearGradient
          colors={colors.gradients.sos}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, shadows.sosGlow]}
        >
          <View style={styles.heroTop}>
            <Ionicons name="water" size={18} color="#FFFFFF" />
            <Text style={styles.heroLabel}>BLOOD SERVICE</Text>
          </View>
          <Text style={styles.heroTitle}>Every Drop Can{'\n'}Save a Life</Text>
          <Text style={styles.heroSub}>Donate Blood. Save Lives.</Text>
          <MaterialCommunityIcons
            name="heart-pulse"
            size={86}
            color="rgba(255,255,255,0.22)"
            style={styles.heroEcg}
          />
          <View style={styles.heroButtons}>
            <TouchableOpacity activeOpacity={0.9} style={[styles.heroBtn, styles.heroBtnWhite]} onPress={goRequestBlood}>
              <Ionicons name="add-circle" size={18} color={blood.main} />
              <Text style={[styles.heroBtnText, { color: blood.main }]}>Request Blood</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.9} style={[styles.heroBtn, styles.heroBtnWhite]} onPress={goDonateBlood}>
              <Ionicons name="heart" size={17} color={blood.main} />
              <Text style={[styles.heroBtnText, { color: blood.main }]}>Donate Blood</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Donor strip: availability + incoming requests */}
        {donor ? (
          <Card style={styles.donorCard}>
            {donorStrip}
            {incomingRow}
          </Card>
        ) : null}

        {/* Quick access icons */}
        <View style={styles.quickRow}>
          <QuickAccessItem icon="people-outline" label="Nearby Donors" onPress={goNearbyDonors} color={blood.main} tint={blood.tint} />
          <QuickAccessItem icon="business-outline" label="Blood Banks" onPress={goBloodBanks} color={colors.info} tint="#DBEAFE" />
          <QuickAccessItem icon="medkit-outline" label="Hospitals" onPress={goHospitals} color={colors.info} tint="#DBEAFE" />
          <QuickAccessItem icon="document-text-outline" label="My Requests" onPress={goMyRequests} color="#7C3AED" tint="#EDE9FE" />
        </View>

        {/* Phase 1 (services OFF): 2x2 quick cards */}
        <SectionHeader title="Quick Access" />
        <View style={styles.grid}>
          {gridCards.map((c) => (
            <TouchableOpacity key={c.key} activeOpacity={0.88} style={[styles.gridCard, shadows.cardSoft]} onPress={c.onPress}>
              <View style={styles.gridIcon}>
                <Ionicons name={c.icon} size={22} color={blood.main} />
              </View>
              <Text style={styles.gridTitle}>{c.title}</Text>
              <Text style={styles.gridSub} numberOfLines={2}>
                {c.sub}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ModuleBanner
          title="Be a Hero. Donate Blood"
          subtitle="Join thousands of heroes who are saving lives every day."
          icon="heart-circle"
          onPress={goDonateBlood}
        />
          </>
        )}
      </ScrollView>

      <CitySelectorSheet
        visible={cityOpen}
        onClose={() => setCityOpen(false)}
        cities={cities}
        selectedId={selectedCity?.id}
        onSelect={selectCity}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xxxl,
  },
  sosBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentSos,
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sosDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    marginRight: spacing.md,
  },
  sosBannerTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 12.5,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  sosBannerSub: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: '#FEE2E2',
    marginTop: 2,
  },
  hero: {
    borderRadius: 24,
    padding: spacing.xl,
    overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroLabel: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 11.5,
    letterSpacing: 1,
    color: '#FFFFFF',
    marginLeft: 6,
  },
  heroTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 25,
    lineHeight: 31,
    color: '#FFFFFF',
    marginTop: spacing.sm,
  },
  heroSub: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    color: '#FEE2E2',
    marginTop: 4,
  },
  heroEcg: {
    position: 'absolute',
    right: 10,
    top: 34,
  },
  heroButtons: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  heroBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radii.button,
  },
  heroBtnWhite: {
    backgroundColor: '#FFFFFF',
    marginRight: spacing.sm,
  },
  heroBtnText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13.5,
    marginLeft: 6,
  },
  donorCard: {
    marginTop: spacing.lg,
  },
  bloodDonorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bloodDonorWrap: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  greeting: {
    marginTop: spacing.xs,
  },
  greetingTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 22,
    color: colors.navyDark,
  },
  greetingSub: {
    fontFamily: fontFamilies.medium,
    fontSize: 13.5,
    color: colors.muted,
    marginTop: 2,
  },
  bloodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#F3E8E8',
    marginTop: spacing.md,
  },
  bloodHero: {
    borderRadius: 24,
    padding: spacing.xl,
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  heroCircle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -50,
    top: -50,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  bloodHeroArt: {
    position: 'absolute',
    right: 12,
    top: 30,
  },
  bloodHeroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bloodHeroPillText: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 10.5,
    letterSpacing: 0.8,
    color: '#FFFFFF',
    marginLeft: 5,
  },
  bloodHeroTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 24,
    lineHeight: 30,
    color: '#FFFFFF',
    marginTop: spacing.md,
  },
  bloodHeroSub: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
    color: '#FEE2E2',
    marginTop: 4,
  },
  bloodBtnWhite: {
    backgroundColor: '#FFFFFF',
  },
  bloodBtnGhost: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  bloodTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bloodIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: blood.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  bloodTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 16,
    color: colors.navyDark,
  },
  bloodSub: {
    fontFamily: fontFamilies.medium,
    fontSize: 12.5,
    color: colors.muted,
    marginTop: 1,
  },
  bloodBadge: {
    backgroundColor: blood.tint,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  bloodBadgeText: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 11,
    color: blood.main,
  },
  bloodBtns: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  bloodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
  },
  bloodBtnFill: {
    backgroundColor: blood.main,
  },
  bloodBtnOutline: {
    borderWidth: 1.5,
    borderColor: blood.main,
    backgroundColor: '#FFFFFF',
  },
  bloodBtnText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13.5,
    marginLeft: 6,
  },
  bloodDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: spacing.lg,
  },
  bloodQuick: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.md,
  },
  donorTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    color: colors.navyDark,
  },
  donorSub: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  incomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: blood.tint,
    borderRadius: radii.button,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  incomingText: {
    flex: 1,
    fontFamily: fontFamilies.bold,
    fontSize: 12.5,
    color: blood.main,
    marginHorizontal: 8,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  gridIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: blood.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  gridTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    color: colors.navyDark,
  },
  gridSub: {
    fontFamily: fontFamilies.regular,
    fontSize: 11.5,
    lineHeight: 15,
    color: colors.muted,
    marginTop: 2,
  },
});

export default HomeScreen;
