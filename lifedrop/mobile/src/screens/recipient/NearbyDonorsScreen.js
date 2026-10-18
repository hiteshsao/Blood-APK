import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import recipientApi from '../../api/recipientApi';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing, radii } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import ScreenHeader from '../../components/ScreenHeader';
import Card from '../../components/Card';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import { formatDate } from '../../utils/formatters';

const { width } = Dimensions.get('window');

const RADIUS_OPTIONS = [5, 10, 25];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Fallback user location (Indore, MP)
const DEFAULT_LAT = 22.7196;
const DEFAULT_LNG = 75.8577;

export const NearbyDonorsScreen = ({ navigation }) => {
  const mapRef = useRef(null);

  const [userLocation, setUserLocation] = useState({
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
  });
  const [selectedRadius, setSelectedRadius] = useState(10);
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('A+');
  const [donors, setDonors] = useState([]);
  const [selectedDonorId, setSelectedDonorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Get user GPS coordinates on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
      } catch (err) {
        console.log('[GPS fetch error in Nearby]', err?.message);
      }
    })();
  }, []);

  // 2. Fetch nearby donors whenever location, radius, or blood group changes
  const fetchDonors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await recipientApi.findNearbyDonors({
        bloodGroup: selectedBloodGroup,
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        radiusKm: selectedRadius,
      });

      // Assign approximate coordinates if backend doesn't provide them
      const enriched = data.map((d, index) => {
        let lat = d.latitude;
        let lng = d.longitude;

        if (!lat || !lng) {
          // Synthetic offset based on distanceKm & index angle
          const distKm = d.distanceKm || (index + 1) * 1.5;
          const angle = (index * (360 / Math.max(data.length, 1)) * Math.PI) / 180;
          const kmPerDegLat = 111.0;
          const kmPerDegLng = 111.0 * Math.cos((userLocation.latitude * Math.PI) / 180);
          lat = userLocation.latitude + (distKm * Math.cos(angle)) / kmPerDegLat;
          lng = userLocation.longitude + (distKm * Math.sin(angle)) / kmPerDegLng;
        }

        return {
          ...d,
          latitude: lat,
          longitude: lng,
        };
      });

      setDonors(enriched);
      if (enriched.length > 0 && !selectedDonorId) {
        setSelectedDonorId(enriched[0].id);
      }
    } catch (err) {
      console.log('[Fetch Nearby Donors Error]', err?.response?.data || err?.message);
      setError('Unable to load nearby donors. Please check connection.');
    } finally {
      setLoading(false);
    }
  }, [selectedBloodGroup, selectedRadius, userLocation, selectedDonorId]);

  useEffect(() => {
    fetchDonors();
  }, [fetchDonors]);

  // Handle donor selection from bottom card
  const handleSelectDonor = (donor) => {
    setSelectedDonorId(donor.id);
    if (mapRef.current && donor.latitude && donor.longitude) {
      mapRef.current.animateToRegion(
        {
          latitude: donor.latitude,
          longitude: donor.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        500
      );
    }
  };

  const renderDonorCard = ({ item }) => {
    const isSelected = item.id === selectedDonorId;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handleSelectDonor(item)}
        style={[
          styles.donorCard,
          isSelected && styles.donorCardSelected,
        ]}
      >
        <View style={styles.donorCardHeader}>
          {/* Blood group badge in red circle */}
          <View
            style={[
              styles.bloodBadgeCircle,
              isSelected && styles.bloodBadgeCircleSelected,
            ]}
          >
            <Text style={styles.bloodBadgeText}>{item.bloodGroup || selectedBloodGroup}</Text>
          </View>

          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={styles.donorName}>{item.firstName || 'Volunteer Donor'}</Text>
            <Text style={styles.donorLocation}>
              📍 {item.city || 'Indore'}
            </Text>
          </View>

          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{item.distanceKm} km away</Text>
          </View>
        </View>

        <View style={styles.donorCardFooter}>
          <View style={styles.lastDonatedRow}>
            <Ionicons name="calendar-outline" size={13} color={colors.muted} />
            <Text style={styles.lastDonatedText}>
              {item.lastDonatedDate
                ? `Last donation: ${formatDate(item.lastDonatedDate)}`
                : 'Eligible & Ready to donate'}
            </Text>
          </View>

          <Text style={styles.privacyNote}>No phone revealed • Privacy safe</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader
        title="Nearby Donors Map"
        subtitle="Explore active, compatible volunteer donors"
      />

      {/* Filter Row 1: Blood Group Chips */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Blood Group Filter</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {BLOOD_GROUPS.map((group) => {
            const isSelected = group === selectedBloodGroup;
            return (
              <TouchableOpacity
                key={group}
                activeOpacity={0.7}
                onPress={() => setSelectedBloodGroup(group)}
                style={[
                  styles.bloodChip,
                  isSelected && styles.bloodChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.bloodChipText,
                    isSelected && styles.bloodChipTextActive,
                  ]}
                >
                  {group}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Filter Row 2: Radius Chips (5, 10, 25 km) */}
      <View style={styles.radiusRow}>
        <Text style={styles.radiusLabel}>Search Radius:</Text>
        <View style={styles.radiusChips}>
          {RADIUS_OPTIONS.map((radius) => {
            const isSelected = radius === selectedRadius;
            return (
              <TouchableOpacity
                key={String(radius)}
                activeOpacity={0.7}
                onPress={() => setSelectedRadius(radius)}
                style={[
                  styles.radiusChip,
                  isSelected && styles.radiusChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.radiusChipText,
                    isSelected && styles.radiusChipTextActive,
                  ]}
                >
                  {radius} km
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: selectedRadius * 0.02,
            longitudeDelta: selectedRadius * 0.02,
          }}
        >
          {/* User Location Marker & Radius Circle */}
          <Circle
            center={userLocation}
            radius={selectedRadius * 1000}
            fillColor="rgba(220, 38, 38, 0.08)"
            strokeColor="#DC2626"
            strokeWidth={1.5}
          />
          <Marker
            coordinate={userLocation}
            title="Your Location"
            description="Center of search radius"
            pinColor="blue"
          />

          {/* Donor Markers */}
          {donors.map((donor) => {
            const isSelected = donor.id === selectedDonorId;
            return (
              <Marker
                key={String(donor.id)}
                coordinate={{
                  latitude: donor.latitude,
                  longitude: donor.longitude,
                }}
                onPress={() => setSelectedDonorId(donor.id)}
                title={`${donor.firstName || 'Donor'} (${donor.bloodGroup})`}
                description={`${donor.distanceKm} km away`}
              >
                <View
                  style={[
                    styles.donorMapMarker,
                    isSelected && styles.donorMapMarkerSelected,
                  ]}
                >
                  <Text style={styles.donorMapMarkerText}>
                    {donor.bloodGroup || selectedBloodGroup}
                  </Text>
                </View>
              </Marker>
            );
          })}
        </MapView>

        {loading && (
          <View style={styles.mapLoadingOverlay}>
            <Loader message="Locating donors..." />
          </View>
        )}
      </View>

      {/* Bottom List of Donor Cards */}
      <View style={styles.bottomSection}>
        <View style={styles.bottomHeaderRow}>
          <Text style={styles.bottomTitle}>
            Available Donors ({donors.length})
          </Text>
          <Text style={styles.bottomSubtitle}>
            Matching {selectedBloodGroup} within {selectedRadius} km
          </Text>
        </View>

        {donors.length === 0 && !loading ? (
          <EmptyState
            iconName="people-outline"
            title="No Donors In This Radius"
            description={`No available ${selectedBloodGroup} donors found within ${selectedRadius} km. Try choosing a larger radius like 25 km.`}
            containerStyle={{ marginHorizontal: spacing.md, padding: spacing.md }}
          />
        ) : (
          <FlatList
            data={donors}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderDonorCard}
            contentContainerStyle={styles.donorListContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  filterSection: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.xs,
  },
  filterLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    color: colors.muted,
    marginBottom: 4,
  },
  chipsScroll: {
    paddingRight: spacing.md,
    gap: 8,
  },
  bloodChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bloodChipActive: {
    backgroundColor: colors.primaryRed,
    borderColor: colors.primaryRed,
    ...shadows.redGlow,
  },
  bloodChipText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: colors.navyDark,
  },
  bloodChipTextActive: {
    color: '#FFFFFF',
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    marginVertical: spacing.xs,
  },
  radiusLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.muted,
    marginRight: spacing.sm,
  },
  radiusChips: {
    flexDirection: 'row',
    gap: 6,
  },
  radiusChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  radiusChipActive: {
    backgroundColor: '#FFF1F1',
    borderColor: colors.borderPink,
  },
  radiusChipText: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    color: colors.muted,
  },
  radiusChipTextActive: {
    fontFamily: fontFamilies.bold,
    color: colors.primaryRed,
  },
  mapContainer: {
    height: Dimensions.get('window').height * 0.32,
    marginHorizontal: spacing.screenPadding,
    borderRadius: radii.card,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.borderPink,
    marginTop: spacing.xs,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 245, 245, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  donorMapMarker: {
    backgroundColor: colors.primaryRed,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    ...shadows.redGlow,
  },
  donorMapMarkerSelected: {
    backgroundColor: colors.primaryDark,
    borderColor: '#F59E0B',
    borderWidth: 2.5,
    transform: [{ scale: 1.15 }],
  },
  donorMapMarkerText: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  bottomSection: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
  },
  bottomHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  bottomTitle: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 15,
    color: colors.navyDark,
  },
  bottomSubtitle: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    color: colors.muted,
  },
  donorListContent: {
    paddingBottom: spacing.xxl,
  },
  donorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.card,
    padding: spacing.md,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...shadows.cardSoft,
  },
  donorCardSelected: {
    borderColor: colors.borderPink,
    borderWidth: 1.5,
    backgroundColor: '#FFFDFD',
  },
  donorCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bloodBadgeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryRed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bloodBadgeCircleSelected: {
    backgroundColor: colors.primaryDark,
    ...shadows.redGlow,
  },
  bloodBadgeText: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  donorName: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    color: colors.navyDark,
  },
  donorLocation: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 1,
  },
  distanceBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
  },
  distanceText: {
    fontFamily: fontFamilies.bold,
    fontSize: 11,
    color: '#2563EB',
  },
  donorCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  lastDonatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastDonatedText: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    color: colors.muted,
    marginLeft: 4,
  },
  privacyNote: {
    fontFamily: fontFamilies.regular,
    fontSize: 10,
    color: colors.lightMuted,
  },
});

export default NearbyDonorsScreen;
