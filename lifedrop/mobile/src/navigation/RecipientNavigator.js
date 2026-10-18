import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import RecipientHomeScreen from '../screens/recipient/RecipientHomeScreen';
import CreateRequestScreen from '../screens/recipient/CreateRequestScreen';
import NearbyDonorsScreen from '../screens/recipient/NearbyDonorsScreen';
import MyRequestsScreen from '../screens/recipient/MyRequestsScreen';
import RequestStatusScreen from '../screens/recipient/RequestStatusScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { shadows } from '../theme/shadows';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const RecipientTabs = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primaryRed,
        tabBarInactiveTintColor: colors.lightMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Nearby') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'My Requests') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={RecipientHomeScreen} />
      <Tab.Screen name="Nearby" component={NearbyDonorsScreen} />
      <Tab.Screen name="My Requests" component={MyRequestsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export const RecipientNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="RecipientTabs" component={RecipientTabs} />
      <Stack.Screen name="CreateRequest" component={CreateRequestScreen} />
      <Stack.Screen name="RequestStatus" component={RequestStatusScreen} />
      <Stack.Screen name="NearbyDonors" component={NearbyDonorsScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 26 : 10,
    paddingTop: 8,
    ...shadows.tabBar,
  },
  tabBarLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: 11,
    letterSpacing: 0.1,
  },
});

export default RecipientNavigator;
