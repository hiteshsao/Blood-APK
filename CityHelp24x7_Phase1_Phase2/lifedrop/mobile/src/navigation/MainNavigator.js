import React, { useState } from 'react';
import { StyleSheet, Platform, View, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useFeatures } from '../context/AppConfigContext';
import { useDonorLocationSync } from '../hooks/useLocation';
import SosBottomSheet from '../components/SosBottomSheet';
import { getTabs } from './tabConfig';
import { getTabScreen } from './tabRegistry';
import { getExtraStackScreens } from './stackRegistry';
import CreateRequestScreen from '../screens/recipient/CreateRequestScreen';
import NearbyDonorsScreen from '../screens/recipient/NearbyDonorsScreen';
import RequestStatusScreen from '../screens/recipient/RequestStatusScreen';
import SosStatusScreen from '../screens/recipient/SosStatusScreen';
import RequestDetailScreen from '../screens/donor/RequestDetailScreen';
import NotificationScreen from '../screens/common/NotificationScreen';
import RequestsScreen from '../screens/requests/RequestsScreen';
import DonorOnboardingScreen from '../screens/home/DonorOnboardingScreen';
import FacilitiesListScreen from '../screens/facilities/FacilitiesListScreen';
import FacilityDetailScreen from '../screens/facilities/FacilityDetailScreen';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { shadows } from '../theme/shadows';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const SosTabButton = ({ onPress }) => (
  <View style={styles.sosWrap}>
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.sosBtn, shadows.sosGlow]}>
      <Ionicons name="warning" size={22} color="#FFFFFF" />
      <Text style={styles.sosText}>SOS</Text>
    </TouchableOpacity>
  </View>
);

const Placeholder = () => <View style={{ flex: 1 }} />;

const MainTabs = ({ navigation }) => {
  const features = useFeatures();
  const { user } = useAuth();
  const [sosOpen, setSosOpen] = useState(false);
  const tabs = getTabs(features).filter((t) => t.isSos || getTabScreen(t.name));

  return (
    <>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.brand.main,
          tabBarInactiveTintColor: colors.lightMuted,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >
        {tabs.map((t) =>
          t.isSos ? (
            <Tab.Screen
              key={t.name}
              name={t.name}
              component={Placeholder}
              options={{
                tabBarLabel: () => null,
                tabBarIcon: () => null,
                tabBarButton: () => <SosTabButton onPress={() => setSosOpen(true)} />,
              }}
            />
          ) : (
            <Tab.Screen
              key={t.name}
              name={t.name}
              component={getTabScreen(t.name)}
              options={{
                tabBarLabel: t.label,
                tabBarIcon: ({ focused, color }) => (
                  <Ionicons name={focused ? t.iconActive : t.icon} size={22} color={color} />
                ),
              }}
            />
          )
        )}
      </Tab.Navigator>

      <SosBottomSheet
        visible={sosOpen}
        onClose={() => setSosOpen(false)}
        user={user}
        onSosDispatched={(r) => {
          setSosOpen(false);
          navigation.navigate('SosStatus', {
            requestId: r.requestId,
            donorsNotified: r.donorsNotified,
            radiusKm: r.radiusKm,
          });
        }}
      />
    </>
  );
};

export const MainNavigator = () => {
  // Keeps donor location fresh for enabled donors (hook itself ignores non-donors).
  useDonorLocationSync();
  const extra = getExtraStackScreens();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="CreateRequest" component={CreateRequestScreen} />
      <Stack.Screen name="RequestStatus" component={RequestStatusScreen} />
      <Stack.Screen name="SosStatus" component={SosStatusScreen} />
      <Stack.Screen name="NearbyDonors" component={NearbyDonorsScreen} />
      <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
      <Stack.Screen name="RequestsHub" component={RequestsScreen} />
      <Stack.Screen name="DonorOnboarding" component={DonorOnboardingScreen} />
      <Stack.Screen name="FacilitiesList" component={FacilitiesListScreen} />
      <Stack.Screen name="FacilityDetail" component={FacilityDetailScreen} />
      {extra.map(([name, component]) => (
        <Stack.Screen key={name} name={name} component={component} />
      ))}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    height: Platform.OS === 'ios' ? 88 : 72,
    paddingBottom: Platform.OS === 'ios' ? 26 : 10,
    paddingTop: 8,
    ...shadows.tabBar,
  },
  tabBarLabel: { fontFamily: fontFamilies.bold, fontSize: 11, letterSpacing: 0.1 },
  sosWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sosBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.accentSos,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -26,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  sosText: { fontFamily: fontFamilies.extraBold, fontSize: 9.5, color: '#FFFFFF', marginTop: -1 },
});

export default MainNavigator;
